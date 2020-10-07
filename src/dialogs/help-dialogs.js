class HelpDialogs {
  constructor(context) {
    this.context = context;
  }

  async help() {
    await this.context.sendActivity(`
      Tente dizer: 
      📔 Quero comprar livros 
      📘 Me mostre livros de aventura 
      📕 Quero um um livro interessante 
      🛒 Adicione o livro "1" ao meu carrinho 
      📚 Me mostre meu carrinho 
      📦 Quero fechar meu pedido
    `)
  }
}

module.exports = HelpDialogs;