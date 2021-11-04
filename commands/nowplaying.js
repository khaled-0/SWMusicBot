const { splitBar } = require("string-progressbar");
const { MessageEmbed } = require("discord.js");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "np",
  description: i18n.__("nowplaying.description"),
  commandOption: undefined,
  execute(client, message, interaction) {
   const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);
    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("nowplaying.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("nowplaying.errorNotQueue"))
        .catch(console.error);
    }

    const song = queue.songs[0];
    const seek =
      (queue.connection.dispatcher.streamTime -
        queue.connection.dispatcher.pausedTime) /
      1000;
    const left = song.duration - seek;

    let nowPlaying = new MessageEmbed()
      .setTitle(i18n.__("nowplaying.embedTitle"))
      .setDescription(`${song.title}\n${song.url}`)
      .setColor("#F8AA2A")
      .setAuthor(message.client.user.username);

    if (song.duration > 0) {
      nowPlaying.addField(
        "\u200b",
        new Date(seek * 1000).toISOString().substr(11, 8) +
          "[" +
          splitBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
          "]" +
          (song.duration == 0
            ? " ◉ LIVE"
            : new Date(song.duration * 1000).toISOString().substr(11, 8)),
        false
      );
      nowPlaying.setFooter(
        i18n.__mf("nowplaying.timeRemaining", {
          time: new Date(left * 1000).toISOString().substr(11, 8),
        })
      );
    }

    if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              embeds: [nowPlaying]
            }
          }
        });
      }

      return message
        .inlineReply(nowPlaying)
        .catch(console.error);
  },
};
