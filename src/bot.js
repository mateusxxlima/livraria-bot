const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const HelpDialogs = require('./dialogs/help-dialogs.js');
const GreatDialogs = require('./dialogs/great-dialogs.js');
const AboutMeDialogs = require('./dialogs/about-me-dialogs.js');
const SearchDialogs = require('./dialogs/search-dialogs');
const GoodbyeDialogs = require('./dialogs/goodbye-dialogs');
const ShowCartDialogs = require('./dialogs/show-cart-dialogs');
const SearchBooks = require('./API/search-books-api');

const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class Bot extends ActivityHandler {

  constructor(conversationState, userState) {
    super();
    this.books = [];
    this.recognizerResult = {};
    this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
    this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
    this.conversationState = conversationState;
    this.userState = userState;

    this.searchBooks = new SearchBooks();
    this.searchDialogs = new SearchDialogs();
    this.greatDialogs = new GreatDialogs();
    this.helpDialogs = new HelpDialogs();
    this.aboutMeDialogs = new AboutMeDialogs();
    this.goodbyeDialogs = new GoodbyeDialogs();
    this.showCartDialogs = new ShowCartDialogs();
    
    this.dispatchRecognizer = new LuisRecognizer({
      applicationId: process.env.LuisAppId,
      endpointKey: process.env.LuisAPIKey,
      endpoint: process.env.LuisAPIHostName
    }, true);

    this.onMessage(async (context, next) => {
      this.recognizerResult = {};
      this.recognizerResult = await this.dispatchRecognizer.recognize(context);
      const topIntent = LuisRecognizer.topIntent(this.recognizerResult);
      const conversationData = await this.conversationDataAccessor.get(context, { books: [], lastSearch: [], cart: [] });
      await this.switchCase(topIntent, context, conversationData);
      await next();
    });
  }

  async switchCase(topIntent, context, conversationData) {
    switch (topIntent) {
      case 'great':
        await this.greatDialogs.great(context);
        break;
      case 'about-me':
        await this.aboutMeDialogs.about(context);
        break;
      case 'search':      
        await this.search(context, conversationData);
        break;
      case 'pagination':      
        this.pagination(conversationData);
        break;
      case 'add-cart':        
        await this.cartAdd(context, conversationData);
        break;
      case 'show-cart':        
        await this.showCartDialogs.sendBooks(context, conversationData.cart);
        break;
      case 'remove-cart':        
        await this.cartRemove(context, conversationData);
        break;
      case 'pagination':
        await this.searchDialogs.sendBooks(context, this.books);
        break;
      case 'help':
        await this.helpDialogs.help(context);
        break;
      case 'close-the-order':
        await this.closeTheOrder(context, conversationData);
        break;
      case 'goodbye':
        await this.goodbyeDialogs.bye(context);
        break;
      case 'None':
        context.sendActivity('Desculpa eu não consegui entender, você poderia reformular a frase? 😅');
        break;
    }
  }

  async search(context, conversationData) {
    await context.sendActivity('Ok, por favor aguarde um segundo enquanto eu procuro 😄');
    const bookArray = await this.searchBooks.search(context);
    conversationData.books = bookArray;
    conversationData.lastSearch = bookArray;
    this.books.length = 0;
    for (let i = 0; i < 4; i++) {
      if (conversationData.books.length === 0) break;
      this.books.push(conversationData.books.shift());
    }
    conversationData.lastSearch = [...this.books, ...conversationData.lastSearch];
    await this.searchDialogs.sendBooks(context, this.books);
  }

  pagination(conversationData) {
    this.books.length = 0;
    for (let i = 0; i < 4; i++) {
      if (conversationData.books.length === 0) break;
      this.books.push(conversationData.books.shift());
    }
  }

  async cartAdd(context, conversationData) {
    const listOfBooksSearched = conversationData.lastSearch.length;
    if (listOfBooksSearched === 0) {
      await context.sendActivity('Você precisa fazer uma busca antes de adicionar um produto ao carrinho 🙃');
      await context.sendActivity(`
        Tente dizer:
        - Quero um livro de aventura
      `)
      return;
    }
    const isThereAnumber = this.recognizerResult.entities.number;
    if (!isThereAnumber) {
      await context.sendActivity('Hmm, não consegui entender o número do livro que você quer adicionar 😅');
      await context.sendActivity(`
        Tente dizer:
        - Adicione o livro 1 (ou)
        - Adicione o livro dois ao meu carrinho
      `);
      return;
    }
    const numberToAdd = this.recognizerResult.entities.number[0]
    if (numberToAdd > listOfBooksSearched || numberToAdd < 1) {
      await context.sendActivity('Você precisa dizer o número de um produto válido 🙃');
      return;
    }
    const indexOfElement = conversationData.lastSearch.findIndex(element => element.number === numberToAdd);
    const elementToAddCart = conversationData.lastSearch[indexOfElement]
    if (elementToAddCart.price === 'Esgotado') {
      await context.sendActivity(`Ops, não consigo adicionar o livro "${numberToAdd}" ao seu carrinho, pois ele está esgotado 😅`);
      await context.sendActivity('Mas posso adicionar qualquer outro que não esteja esgotado 😄');
      return;
    }
    let theBookAlreadyInTheCart;
    const isItemInArray = conversationData.cart.findIndex(element => element.id === elementToAddCart.id)
    theBookAlreadyInTheCart = isItemInArray === -1 ? false : true;
    if (theBookAlreadyInTheCart) {
      await context.sendActivity(`O livro "${numberToAdd}" já foi adicionado ao seu carrinho 😄`);
    } else {
      conversationData.cart.push(elementToAddCart);
      await context.sendActivity(`Prontinho adicionei o livro "${numberToAdd}" ao seu carrinho 😄`);
      await context.sendActivity(`
        Você pode dizer:
        - Quero ver meu carrinho (ou)
        - Ver mais
      `)
    }
  }

  async cartRemove(context, conversationData) {
    if (conversationData.cart.length === 0) {
      await context.sendActivity('Ops, seu carrinho está vazio 😮');
      return;
    }
    if (!this.recognizerResult.entities.number) {
      await context.sendActivity('Hmm, não consegui entender o número que você quer remover 😅');
      await context.sendActivity(`
        Tente dizer:
        - Remova o livro 1 (ou)
        - Remova o livro dois do meu carrinho
      `);
      return;
    }
    const numberToRemove = this.recognizerResult.entities.number[0];
    const indexToRemove = conversationData.cart.findIndex(element => element.number === numberToRemove)
    if (indexToRemove !== -1) {
      conversationData.cart.splice(indexToRemove, 1);
      await context.sendActivity(`Prontinho removi o livro "${numberToRemove}" do seu carrinho 😄`)
    } else {
      await context.sendActivity('Ops, não encontrei esse livro no seu carrinho 😮, por favor confira seu carrinho e tente novamente 😉')
    }
  }

  async closeTheOrder(context, conversationData) {
    if (conversationData.cart.length === 0) {
      await context.sendActivity('Hmm, não consigo fechar seu pedido, pois seu carrinho esta vazio 😅');
      return;
    }
    await context.sendActivity('Ok, fechando seu pedido ...');
    await context.sendActivity('Agora vou enviar para o seu endereço os livro que estão no seu carrinho 😄');
    await this.showCartDialogs.sendBooks(context, conversationData.cart);
    await context.sendActivity('Obrigado pela preferência 😀');
  }

  async run(context) {
    await super.run(context);
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports = Bot;