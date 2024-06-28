const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

module.exports = {
  onServerStart: (api) => {
    console.log("QuotePlugin: onServerStart called");

    const dbPath = path.join(api.config.getHome(), 'plugins', 'quotes.db');

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Could not connect to database', err);
      } else {
        console.log('Connected to database at', dbPath);
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        text TEXT,
        timestamp INTEGER
      )
    `);

    api.Commands.add({
      name: "quote",
      description: "Quotes a specific message from the last 50 messages by a user",
      usage: "/quote <username>",
      handler: (client, target, args) => {
        client.emit('command:quote', target, 'quote', args);
      }
    });

    setInterval(() => {
      db.run(`
        DELETE FROM messages
        WHERE id NOT IN (
          SELECT id FROM messages
          ORDER BY timestamp DESC
          LIMIT 5000
        )
      `);
    }, 3600000);
  },

  onMessage: (message, network) => {
    if (message.type === 'message') {
      const { from, text, time } = message;
      db.run(`
        INSERT INTO messages (username, text, timestamp)
        VALUES (?, ?, ?)
      `, [from, text, time]);
    }
  }
};
