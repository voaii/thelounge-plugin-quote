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
        console.log("QuotePlugin: Command handler triggered", args);
        client.emit('command:quote', target, 'quote', args);
      }
    });

    setInterval(saveQuotes, 3600000);
    process.on('exit', saveQuotes);
    process.on('SIGINT', saveQuotes);
    process.on('SIGTERM', saveQuotes);

    const initializeClient = (client) => {
      client.on('join', (channel, message) => {
        console.log(`User ${client.name} joined channel ${channel.name}`);
      });

      client.on('message', (channel, message) => {
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
      });
    };

    if (thelounge.clients) {
      thelounge.clients.forEach(initializeClient);
      thelounge.on('client:new', initializeClient);
    } else {
      console.error("QuotePlugin: thelounge.clients is undefined");
    }
  }
};
