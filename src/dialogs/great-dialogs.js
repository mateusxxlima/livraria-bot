class GreatDialogs {
  constructor(context) {
    this.context = context;
  }

  great() {
    this.context.sendActivity(`
      Olá tudo bem? Em que posso ajudar?
      
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

module.exports = GreatDialogs;