class GreatDialogs {

  async great(context) {
    await context.sendActivity(`
      Olá tudo bem? Como posso ajudar?
      
      Tente dizer: 
      📕 Livros de romance 
      📘 Quero o livro Sapiens
      📗 Autor Auguto Cury
      📚 Me mostre meu carrinho 
      📦 Quero finalizar meu pedido
    `)
  }
}

module.exports = GreatDialogs;