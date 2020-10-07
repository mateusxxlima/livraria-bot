const restify = require('restify');
const { BotFrameworkAdapter, MemoryStorage, UserState, ConversationState } = require('botbuilder');
const Luis = require('./luis');
require('dotenv').config();

const port = process.env.PORT || process.env.port || 3000;
const server = restify.createServer();
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
})

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);
  await context.sendTraceActivity(
      'OnTurnError Trace',
      error,
      'https://www.botframework.com/schemas/error',
      'TurnError'
  );
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

const luis = new Luis();

server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await luis.run(context);
  });
});

server.listen(port, () => {
  console.log('Server running on port %d', port);
  console.log(process.pid)
});