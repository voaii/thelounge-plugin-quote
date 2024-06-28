// index.js
module.exports = {
  onServerStart: (api) => {
    console.log("QuotePlugin: onServerStart called");

    api.Commands.add("quote", {
      description: "Quotes a specific message from the last 50 messages by a user",
      usage: "/quote <username>"
    });
  }
};
