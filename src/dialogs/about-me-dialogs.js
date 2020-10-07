class AboutMeDialogs {
  constructor(context) {
    this.context = context;
  }

  about() {
    this.context.sendActivity(`
      Então, eu sou um Chat Bot 😃
      Sou uma inteligência artificial e
      estou aqui para te ajudar 😉
      Neste projeto trabalho para
      ajudar as pessoas a comprarem livros 📚
      Fui programado por Mateus Lima
      no projeto de uma POC, na empresa Compasso.
    `)
  }
}

module.exports = AboutMeDialogs;