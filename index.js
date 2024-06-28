const fs = require('fs');
const path = require('path');

let quotes = [];

module.exports = {
  onServerStart: (thelounge) => {
    console.log("QuotePlugin: onServerStart called");

    const storageDir = thelounge.Config.getPersistentStorageDir();
    const dbPath = path.join(storageDir, 'quotes.json');

    if (fs.existsSync(dbPath)) {
      quotes = JSON.parse(fs.readFileSync(dbPath));
    }

    const saveQuotes = () => {
      fs.writeFileSync(dbPath, JSON.stringify(quotes, null, 2));
    };

    thelounge.Commands.add({
      name: "quote",
      description: "Quotes a specific message from the last 50 messages by a user",
      usage: "/quote <username>",
      handler: (client, target, args) => {
        client.emit('command:quote', target, 'quote', args);
      }
    });

    setInterval(saveQuotes, 3600000);

    process.on('SIGINT', () => {
      saveQuotes();
      process.exit();
    });
    process.on('SIGTERM', () => {
      saveQuotes();
      process.exit();
    });
  },

  onMessage: (client, network, chan, message) => {
    if (message.type === 'message') {
      quotes.push({
        username: message.from,
        text: message.text,
        timestamp: message.time
      });
      if (quotes.length > 5000) {
        quotes.shift();
      }
    }
  }
};
