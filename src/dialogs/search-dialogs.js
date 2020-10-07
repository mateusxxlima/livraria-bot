const SearchBooks = require('../API/search-books-api');

class SearchDialogs {
  constructor(context) {
    this.context = context;
    this.searchBooks = new SearchBooks();
  }

  async search(books) {
    for (const book of books) {
      const { name, price, author } = book;
      await this.context.sendActivity(`
        Nome: ${name}
        Autor: ${author.split(',').reverse().join(' ')}
        Preço: ${price}
      `);
    }
  }
}

module.exports = SearchDialogs;