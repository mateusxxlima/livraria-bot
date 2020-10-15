const { ActivityTypes } = require('botbuilder');

class ShowCartDialogs {

  async sendBooks(context, books) {
    await context.sendActivity('Livros no seu carrinho 👇👇👇👇');
    if (books.length === 0) {
      await context.sendActivity('Seu carrinho está vazio 😮');
      await context.sendActivity(`
        Você pode dizer:
        - Quero pesquisar livros de romance (ou)
        - Adicione o livro "1" ao meu carrinho
      `)
      return;
    }
    for (const book of books) {
      await this.sendBook(context, book);
    }
    await context.sendActivity(`Valor total: R$${this.sunCart(books).toFixed(2)}`);
  }

  async sendBook(context, book) {
    let { name, price, author, image, number } = book;
    const reply = { type: ActivityTypes.Message };
    reply.text = `Livro: ${number}`;
    author = author.split(',').reverse().join(' ');
    reply.attachments = [this.getInternetAttachment(image)];
    await context.sendActivity(reply);
    await context.sendActivity(name);
    await context.sendActivity(`
      Autor: ${author || 'Não encontrado'}
      Preço: ${price}
    `);
    await context.sendActivity('📕     -=-     -=-     📔     -=-     -=-     📘');
  }

  getInternetAttachment(image) {
    return {
      name: ' ',
      contentType: 'image/jpg',
      contentUrl: image
    };
  }

  sunCart(books) {
    return books.reduce((sun, element) => {
      sun += element.value;
      return sun;
    }, 0);
  }
}

module.exports = ShowCartDialogs;