const axios = require('axios');

class SearchBooks {
  constructor() {
    this.PAGINATION_MAX = 12;
    this.URL = 'https://livraria-compasso.glitch.me/api/search';
  }

  async search({ activity: { text } }) {
    try {
      const term = text.split(' ').reverse().join(' ');
      const { data } = await axios.get(this.URL, { params: { term } });
      const books = this.formatBooksArray(data);
      return books;
    } catch (err) {
      throw err;
    }
  }

  formatBooksArray({ data: { books } }) {
    if (books.length > this.PAGINATION_MAX) books.length = this.PAGINATION_MAX;
    let booksWithNumber = books.map((book, index) => {
      book.number = ++ index;
      return book;
    })
    booksWithNumber = booksWithNumber.reverse();
    return booksWithNumber;
  }

}

module.exports = SearchBooks;