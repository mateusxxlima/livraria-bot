const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const HelpDialogs = require('./dialogs/help-dialogs.js');
const GreatDialogs = require('./dialogs/great-dialogs.js');
const AboutMeDialogs = require('./dialogs/about-me-dialogs.js');
const SearchDialogs = require('./dialogs/search-dialogs');

const CONVERSATION_DATA_PROPERTY = 'conversationData';
const USER_PROFILE_PROPERTY = 'userProfile';

class Luis extends ActivityHandler {

  constructor(conversationState, userState) {
    super();
    this.topIntent = '';
    this.conversationDataAccessor = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
    this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
    this.conversationState = conversationState;
    this.userState = userState;

    this.dispatchRecognizer = new LuisRecognizer({
      applicationId: '51f0e64c-f63c-4259-b51a-5923aacd3c29',
      endpointKey: '5684d3ce4328443b8eb12bb22628bcf7',
      endpoint: 'https://luisteste.cognitiveservices.azure.com/'
    }, true);

    this.onMessage(async (context, next) => {
      const recognizerResult = await this.dispatchRecognizer.recognize(context);
      this.topIntent = LuisRecognizer.topIntent(recognizerResult);
      await this.intentiesSwitch(context);
      await next();
    });
  }


  async intentiesSwitch(context) {
    switch (this.topIntent) {
      case 'search':
        const searchDialogs = new SearchDialogs();
        await searchDialogs.search(context, this.conversationDataAccessor);
        break;
      case 'great':
        const greatDialogs = new GreatDialogs(context);
        await greatDialogs.great();
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

  async run(context) {
    await super.run(context);
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports = Luis;