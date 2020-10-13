const { ActivityTypes } = require('botbuilder');
const SearchBooks = require('../API/search-books-api');

class SearchDialogs {
  constructor() {
    this.searchBooks = new SearchBooks();
  }

  async search(context, conversationDataAccessor) {
    const conversationData = await conversationDataAccessor.get(context, { books: [] });
    await context.sendActivity('Ok, por favor aguarde um segundo enquanto eu procuro 😄');
    const books = await this.searchAtAPI(context.activity.text);
    conversationData.books = books.reverse();
    for (let index = 0; index < 4; index++) {
      let book = conversationData.books.pop();
      await this.sendResponse(context, index, book);
    }
    await context.sendActivity('Ver mais ou add ao carrinho?');
    await context.sendActivity(`
      Você pode dizer:
      - Ver mais titulos semelhantes (ou)
      - Adicione o livro "1" ao meu carrinho
    `);
  }

  async searchAtAPI(data) {
    let query = data.split(' ').reverse().join(' ');
    const { data: { books } } = await this.searchBooks.search(query);
    books.length = 12;
    return books;
  }

  async sendResponse(context, index, book) {
    let { name, price, author, image } = book;
    const reply = { type: ActivityTypes.Message };
    author = author.split(',').reverse().join(' ')
    reply.text = `Livro: ${++index}  👇👇👇👇`;
    reply.attachments = [this.getInternetAttachment(image)];
    await context.sendActivity(reply);
    await context.sendActivity(name);
    await context.sendActivity(`
      Autor: ${author || 'Não encontrado'}
      Preço: ${price}
    `);
    await context.sendActivity('📕     -=-     -=-     📔     -=-     -=-     📘');
  }

  getInternetAttachment(image) {
    return {
      name: ' ',
      contentType: 'image/jpg',
      contentUrl: image
    };
  }
}

module.exports = SearchDialogs;