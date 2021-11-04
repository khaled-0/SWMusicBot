const { MessageEmbed } = require("discord.js");
const lyricsFinder = require("lyrics-finder");
const i18n = require("../util/i18n");

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  description: i18n.__("lyrics.description"),
  commandOption: undefined,
  async execute(client, message, interaction) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);
    
    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              ephemeral: true,
              content: i18n.__("lyrics.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("lyrics.errorNotQueue"))
        .catch(console.error);
    }

    let lyrics = null;
    const title = queue.songs[0].title;
    try {
      lyrics = await lyricsFinder(queue.songs[0].title, "");
      if (!lyrics) lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    } catch (error) {
      lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    }

    let lyricsEmbed = new MessageEmbed()
      .setTitle(i18n.__mf("lyrics.embedTitle", { title: title }))
      .setDescription(lyrics)
      .setColor("#F8AA2A")
      .setTimestamp();

    if (lyricsEmbed.description.length >= 2048)
      lyricsEmbed.description = `${lyricsEmbed.description.substr(0, 2045)}...`;

      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              embeds: [lyricsEmbed]
            }
          }
        });
      }

      return message
        .inlineReply(lyricsEmbed)
        .catch(console.error);
  }
};
