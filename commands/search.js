const { MessageEmbed } = require("discord.js");
const YouTube = require("youtube-sr").default;
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "search",
  description: i18n.__("search.description"),
  excludeSlash : true,
  async execute(client, message, interaction, args) {
    if (!args.length)
      return message
        .inlineReply(
          i18n.__mf("search.usageReply", {
            prefix: message.client.prefix,
            name: module.exports.name,
          })
        )
        .catch(console.error);
    if (message.channel.activeCollector)
      return message.inlineReply(i18n.__("search.errorAlreadyCollector"));
    if (!message.member.voice.channel)
      return message
        .inlineReply(i18n.__("search.errorNotChannel"))
        .catch(console.error);

    const search = args.join(" ");

    let resultsEmbed = new MessageEmbed()
      .setTitle(i18n.__("search.resultEmbedTitle"))
      .setDescription(i18n.__mf("search.resultEmbedDesc", { search: search }))
      .setColor("#F8AA2A");

    try {
      const results = await YouTube.search(search, { limit: 10 });

      results.map((video, index) =>
        resultsEmbed.addField(
          `https://youtu.be/${video.id}`,
          `${index + 1}. ${video.title}`
        )
      );
      let resultsMessage = await message.channel.send(resultsEmbed);

      function filter(msg) {
        const pattern = /^[1-9][0]?(\s*,\s*[1-9][0]?)*$/;
        return pattern.test(msg.content);
      }

      message.channel.activeCollector = true;
      const response = await message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      const reply = response.first().content;

      if (reply.includes(",")) {
        let songs = reply.split(",").map((str) => str.trim());

        for (let song of songs) {
          await message.client.commands
            .get("play")
            .execute(message, [resultsEmbed.fields[parseInt(song) - 1].name]);
        }
      } else {
        const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;
        message.client.commands.get("play").execute(message, [choice]);
      }

      message.channel.activeCollector = false;
      resultsMessage.delete().catch(console.error);
      response.first().delete().catch(console.error);
    } catch (error) {
      console.error(error);
      message.channel.activeCollector = false;
      message.inlineReply(error.message).catch(console.error);
    }
  },
};
