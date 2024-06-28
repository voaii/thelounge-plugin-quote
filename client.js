const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const storageDir = client.manager.getPersistentStorageDir();
  const dbPath = path.join(storageDir, 'quotes.json');

  const getQuotes = () => {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath));
    }
    return [];
  };

  client.on('command:quote', (target, command, args) => {
    console.log("QuotePlugin: Command received", command, args);
    const username = args[0];
    if (!username) {
      client.sendMessage({
        type: "error",
        text: "Usage: /quote <username>",
        chan: target.chan.id
      });
      return;
    }

    const quotes = getQuotes();
    const userQuotes = quotes.filter(q => q.username === username).slice(-50);

    if (userQuotes.length === 0) {
      client.sendMessage({
        type: "error",
        text: `No quotes found for user ${username}`,
        chan: target.chan.id
      });
      return;
    }

    const options = userQuotes.map((q, index) => `${index + 1}: <%${q.username}> ${q.text}`).join("\n");
    client.sendMessage({
      type: "message",
      text: `Select a quote by typing the number:\n${options}`,
      chan: target.chan.id
    });

    const quoteListener = (network, chan, cmd, newArgs) => {
      console.log("QuotePlugin: Selection received", newArgs);
      const selection = parseInt(newArgs[0], 10) - 1;
      if (isNaN(selection) || selection < 0 || selection >= userQuotes.length) {
        client.sendMessage({
          type: "error",
          text: "Invalid selection",
          chan: target.chan.id
        });
        return;
      }

      const selectedQuote = userQuotes[selection];
      const additionalMessage = newArgs.slice(1).join(" ");
      client.sendMessage({
        type: "message",
        text: `<%${selectedQuote.username}> ${selectedQuote.text} - ${additionalMessage}`,
        chan: target.chan.id
      });

      client.removeListener("input", quoteListener);
    };

    client.once("input", quoteListener);
  });
};
