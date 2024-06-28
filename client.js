const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(api.config.getHome(), 'plugins', 'quotes.db');
const db = new sqlite3.Database(dbPath);

module.exports = (client) => {
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

    db.all(`
      SELECT * FROM messages
      WHERE username = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `, [username], (err, rows) => {
      if (err) {
        console.error(err);
        client.sendMessage({
          type: "error",
          text: "Database error",
          chan: target.chan.id
        });
        return;
      }

      if (rows.length === 0) {
        client.sendMessage({
          type: "error",
          text: `No messages found for user ${username}`,
          chan: target.chan.id
        });
        return;
      }

      const options = rows.map((msg, index) => `${index + 1}: <%${msg.username}> ${msg.text}`).join("\n");
      client.sendMessage({
        type: "message",
        text: `Select a message to quote by typing the number:\n${options}`,
        chan: target.chan.id
      });

      const quoteListener = (network, chan, cmd, newArgs) => {
        const selection = parseInt(newArgs[0], 10) - 1;
        console.log("QuotePlugin: Selection received", selection);
        if (isNaN(selection) || selection < 0 || selection >= rows.length) {
          client.sendMessage({
            type: "error",
            text: "Invalid selection",
            chan: target.chan.id
          });
          return;
        }

        const selectedMessage = rows[selection];
        const additionalMessage = newArgs.slice(1).join(" ");
        client.sendMessage({
          type: "message",
          text: `<%${selectedMessage.username}> ${selectedMessage.text} - ${additionalMessage}`,
          chan: target.chan.id
        });

        client.removeListener("input", quoteListener);
      };

      client.once("input", quoteListener);
    });
  });
};
