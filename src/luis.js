const { LuisRecognizer } = require('botbuilder-ai');
const { ActivityHandler } = require('botbuilder');

const HelpDialogs = require('./dialogs/help-dialogs.js');
const GreatDialogs = require('./dialogs/great-dialogs.js');
const AboutMeDialogs = require('./dialogs/about-me-dialogs.js');

const SearchBooks = require('./API/search-books-api');

class Luis extends ActivityHandler {

  constructor() {
    super();
    this.books = [];

    this.dispatchRecognizer = new LuisRecognizer({
      applicationId: process.env.LuisAppId,
      endpointKey: process.env.LuisAPIKey,
      endpoint:process.env.LuisAPIHostName
    }, true);

    this.onMessage(async (context, next) => {
      const recognizerResult = await this.dispatchRecognizer.recognize(context);
      const intent = LuisRecognizer.topIntent(recognizerResult);
      if (intent === 'search') {
        await this.searchAtAPI(context.activity.text);
        for (let i = 0; i < 5; i++) {
          const { name, price, author } = this.books[i];
          await context.sendActivity(`
            Nome: ${name}
            Autor: ${author.split(',').reverse().join(' ')}
            Preço: ${price}
          `);
        }
      }
      this.getIntent(context, intent);
      await next();
    });
  }

  async searchAtAPI(data) {
    const searchBooks = new SearchBooks();
    const { data: { books } } = await searchBooks.search(data);
    this.books = books;
  }
  
  async getIntent(context, intent) {
    switch (intent) {
      case 'search':
        break;
      case 'great':
        const greatDialogs = new GreatDialogs(context);
        greatDialogs.great()

        break;
      case 'about-me':
        const aboutMeDialogs = new AboutMeDialogs(context);
        aboutMeDialogs.about();
        break;
      case 'help':
        const helpDialogs = new HelpDialogs(context);
        helpDialogs.help();
        break;
      default:
        context.sendActivity('Desculpa eu não consegui entender, você poderia reformular a frase? 😅');
    }
  }
}

module.exports = Luis