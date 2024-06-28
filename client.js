module.exports = (client) => {
  client.on('command:quote', (target, command, args) => {
    console.log("QuotePlugin: Command received", command, args); // Log received command
    const username = args[0];
    if (!username) {
      client.sendMessage({
        type: "error",
        text: "Usage: /quote <username>",
        chan: target.chan.id
      });
      return;
    }

    // Fetch the last 50 messages
    const messages = target.chan.messages.slice(-50).reverse();
    const userMessages = messages.filter(msg => msg.from === username).slice(0, 50);
    console.log("QuotePlugin: Found messages", userMessages); // Log found messages

    if (userMessages.length === 0) {
      client.sendMessage({
        type: "error",
        text: `No messages found for user ${username}`,
        chan: target.chan.id
      });
      return;
    }

    const options = userMessages.map((msg, index) => `${index + 1}: <%${msg.from}> ${msg.text}`).join("\n");
    client.sendMessage({
      type: "message",
      text: `Select a message to quote by typing the number:\n${options}`,
      chan: target.chan.id
    });

    const quoteListener = (network, chan, cmd, newArgs) => {
      const selection = parseInt(newArgs[0], 10) - 1;
      console.log("QuotePlugin: Selection received", selection); // Log selection
      if (isNaN(selection) || selection < 0 || selection >= userMessages.length) {
        client.sendMessage({
          type: "error",
          text: "Invalid selection",
          chan: target.chan.id
        });
        return;
      }

      const selectedMessage = userMessages[selection];
      const additionalMessage = newArgs.slice(1).join(" ");
      client.sendMessage({
        type: "message",
        text: `<%${selectedMessage.from}> ${selectedMessage.text} - ${additionalMessage}`,
        chan: target.chan.id
      });

      // Remove the listener to prevent duplicate handling
      client.removeListener("input", quoteListener);
    };

    client.once("input", quoteListener);
  });
};
