const axios = require('axios');

class SearchBooks {
  constructor() {
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
    books.length = 12;
    let booksWithNumber = books.map((book, index) => {
      book.number = ++ index;
      return book;
    })
    booksWithNumber = books.reverse();
    return booksWithNumber;
  }

}

module.exports = SearchBooks;