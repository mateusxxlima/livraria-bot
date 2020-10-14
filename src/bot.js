const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const HelpDialogs = require('./dialogs/help-dialogs.js');
const GreatDialogs = require('./dialogs/great-dialogs.js');
const AboutMeDialogs = require('./dialogs/about-me-dialogs.js');
const SearchDialogs = require('./dialogs/search-dialogs');
const GoodbyeDialogs = require('./dialogs/goodbye-dialogs');
const SearchBooks = require('./API/search-books-api');

const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class Bot extends ActivityHandler {

  constructor(conversationState, userState) {
    super();
    this.books = [];
    this.topIntent = '';
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
    this.dispatchRecognizer = new LuisRecognizer({
      applicationId: '51f0e64c-f63c-4259-b51a-5923aacd3c29',
      endpointKey: '5684d3ce4328443b8eb12bb22628bcf7',
      endpoint: 'https://luisteste.cognitiveservices.azure.com/'
    }, true);

    this.onMessage(async (context, next) => {
      const recognizerResult = await this.dispatchRecognizer.recognize(context);
      this.topIntent = LuisRecognizer.topIntent(recognizerResult);
      await next();
    });

    this.onMessage(async (context, next) => {
      const conversationData = await this.conversationDataAccessor.get(context, { books: [] });
      if (this.topIntent === 'search') {
        await context.sendActivity('Ok, por favor aguarde um segundo enquanto eu procuro 😄');
        const books = await this.searchBooks.search(context);
        conversationData.books.length = 0;
        conversationData.books =  books;
        this.books.length = 0;
        for (let i = 0; i < 4; i++) {
          if (conversationData.books.length === 0) break;
          this.books.push(conversationData.books.pop()); 
        }
      }
      if (this.topIntent === 'pagination') {
        this.books.length = 0;
        for (let i = 0; i < 4; i++) {
          if (conversationData.books.length === 0) break;
          this.books.push(conversationData.books.pop());
        }
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
      default:
        context.sendActivity('Desculpa eu não consegui entender, você poderia reformular a frase? 😅');
    }
  }

  async run(context) {
    await super.run(context);
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports = Bot;