class AboutMeDialogs {
  constructor(context) {
    this.context = context;
  }

  async about() {
    await this.context.sendActivity('Então, eu sou o Bot bibliotecário 🤓 !!! E estou aqui para te ajudar a comprar livros 📚 !!! Fui programado por Mateus Lima no projeto de uma POC, na empresa Compasso')
  }
}

module.exports = AboutMeDialogs;