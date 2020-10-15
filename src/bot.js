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
    this.topIntent = '';
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
      applicationId: '51f0e64c-f63c-4259-b51a-5923aacd3c29',
      endpointKey: '5684d3ce4328443b8eb12bb22628bcf7',
      endpoint: 'https://luisteste.cognitiveservices.azure.com/'
    }, true);

    this.onMessage(async (context, next) => {
      this.recognizerResult = {};
      this.recognizerResult = await this.dispatchRecognizer.recognize(context);
      this.topIntent = LuisRecognizer.topIntent(this.recognizerResult);
      await next();
    });

    this.onMessage(async (context, next) => {

      const conversationData = await this.conversationDataAccessor.get(context, { books: [], lastSearch: [], cart: [] });
      if (this.topIntent === 'search') {
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
      }

      if (this.topIntent === 'pagination') {
        this.books.length = 0;
        for (let i = 0; i < 4; i++) {
          if (conversationData.books.length === 0) break;
          this.books.push(conversationData.books.shift());
        }
      }

      if (this.topIntent == 'add-cart') {
        if (conversationData.lastSearch.length === 0) {
          await context.sendActivity('Você precisa fazer uma busca antes de adicionar um produto ao carrinho 🙃');
          await context.sendActivity(`
            Tente dizer:
            - Quero um livro de aventura
          `)
          return;
        }        
        if (!this.recognizerResult.entities.number) {
          await context.sendActivity('Hmm, não consegui entender o número do livro que você quer adicionar 😅');
          await context.sendActivity(`
            Tente dizer:
            - Adicione o livro 1 (ou)
            - Adicione o livro dois ao meu carrinho
          `);
          return;
        }
        const numberToAdd = this.recognizerResult.entities.number[0]
        if (numberToAdd > conversationData.lastSearch.length || numberToAdd < 1) {
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
        if (conversationData.cart.findIndex(element => element.id === elementToAddCart.id) !== -1) {
          await context.sendActivity(`O livro "${numberToAdd}" já foi adicionado ao seu carrinho 😄`);
          return;
        }
        conversationData.cart.push(elementToAddCart);
        await context.sendActivity(`Prontinho adicionei o livro "${numberToAdd}" ao seu carrinho 😄`);
        await context.sendActivity(`
          Você pode dizer:
          - Quero ver meu carrinho (ou)
          - Ver mais
        `)
      }

      if (this.topIntent === 'remove-cart') {
        if (conversationData.cart.length === 0) {
          context.sendActivity('Ops, seu carrinho está vazio 😮');
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

      if (this.topIntent === 'show-cart') {
        await this.showCartDialogs.sendBooks(context, conversationData.cart);
      }

      if (this.topIntent === 'close-the-order') {
        if (conversationData.cart.length === 0) {
          context.sendActivity('Hmm, não consigo fechar seu pedido, pois seu carrinho esta vazio 😅');
          return;
        }
        await context.sendActivity('Ok, fechando seu pedido ...');
        await context.sendActivity('Agora vou enviar para o seu endereço os livro que estão no seu carrinho 😄');
        await this.showCartDialogs.sendBooks(context, conversationData.cart);
        await context.sendActivity('Obrigado pela preferência 😀');
      }

      await this.intentiesSwitch(context);
      next();
    })
  }

  async intentiesSwitch(context) {
    switch (this.topIntent) {
      case 'search':        
        await this.searchDialogs.sendBooks(context, this.books);
        break;
      case 'pagination':
        await this.searchDialogs.sendBooks(context, this.books);
        break;
      case 'great':
        await this.greatDialogs.great(context);
        break;
      case 'about-me':
        await this.aboutMeDialogs.about(context);
        break;
      case 'help':
        await this.helpDialogs.help(context);
        break;
      case 'goodbye':
        await this.goodbyeDialogs.bye(context);
        break;
      case 'None':
        context.sendActivity('Desculpa eu não consegui entender, você poderia reformular a frase? 😅');
        break;
    }
  }

  async run(context) {
    await super.run(context);
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports = Bot;