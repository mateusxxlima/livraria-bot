const restify = require('restify');
const { BotFrameworkAdapter } = require('botbuilder');
const Luis = require('./luis');
require('dotenv').config();

const port =  process.env.port || process.env.PORT || 3978;
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
  await context.sendActivity('Ops, parece que algo saiu errado 🤦‍♂️');
  await context.sendActivity('Você poderia tentar novamente? 😅');
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