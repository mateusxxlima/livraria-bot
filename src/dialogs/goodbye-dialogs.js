class GoodbyeDialogs {
  async bye(context) {
    await context.sendActivity('Até mais 😄');
  }
}

module.exports = GoodbyeDialogs;