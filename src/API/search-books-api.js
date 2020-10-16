const axios = require('axios');

class SearchBooks {
  constructor() {
    this.MAX_PAGINATION_SIZE = 12;
    this.URL = process.env.URL_API;
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
    if (books.length > this.MAX_PAGINATION_SIZE) {
      books.length = this.MAX_PAGINATION_SIZE;
    }
    let booksWithNumber = books.map((book, index) => {
      book.number = ++ index;
      return book;
    })
    return booksWithNumber;
  }

}

module.exports = SearchBooks;