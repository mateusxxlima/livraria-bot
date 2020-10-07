const axios = require('axios');

class SearchBooks {
  constructor() {
    this.URL = 'https://livraria-compasso.glitch.me/api/search';
  }

  async search(dataForSearch) {
    try {
      const params = this.createParams(dataForSearch);
      const { data } = await axios.get(this.URL, params);
      return data;
    } catch (err) {
      throw err;
    }
  }

  createParams(data) {
    return {
      params: {
        term: data
      }
    };
  }
}

module.exports = SearchBooks;