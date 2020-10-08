const { LuisRecognizer } = require('botbuilder-ai');
const { ActivityHandler, ActionTypes, ActivityTypes, CardFactory } = require('botbuilder');

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
        await context.sendActivity('Ok, por favor aguarde um segundo enquanto eu procuro 😄');
        await this.searchAtAPI(context.activity.text);
        for (let index = 0; index < 5; index++) {
          await this.sendResponse(context, index);
        }
      }
      this.getIntent(context, intent);
      await next();
    });
  }

  async searchAtAPI(data) {
    let query = data.split(' ').reverse().join(' ');
    const searchBooks = new SearchBooks();
    const { data: { books } } = await searchBooks.search(query);
    this.books = books;
  }

  async sendResponse(context, index) {
    const { name, price, author, image } = this.books[index];
    const reply = { type: ActivityTypes.Message };
    reply.text = `
      Nome: ${name}
      Autor: ${author.split(',').reverse().join(' ')}
      Preço: ${price}
    `;
    reply.attachments = [this.getInternetAttachment(image)];
    await context.sendActivity(reply);
  }

  getInternetAttachment(image) {
    return {
      name: 'architecture-resize.jpg',
      contentType: 'image/jpg',
      contentUrl: image
    };
  }
  
  async getIntent(context, intent) {
    switch (intent) {
      case 'search':
        break;
      case 'great':
        const greatDialogs = new GreatDialogs(context);
        await greatDialogs.great()
        break;
      case 'about-me':
        const aboutMeDialogs = new AboutMeDialogs(context);
        await aboutMeDialogs.about();
        break;
      case 'help':
        const helpDialogs = new HelpDialogs(context);
        await helpDialogs.help();
        break;
      default:
        context.sendActivity('Desculpa eu não consegui entender, você poderia reformular a frase? 😅');
    }
  }
}

module.exports = Luis;