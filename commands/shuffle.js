const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");

module.exports = {
  name: "shuffle",
  description: i18n.__("shuffle.description"),
  commandOption: undefined,
  execute(client, message, interaction, args) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);

    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("shuffle.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("shuffle.errorNotQueue"))
        .catch(console.error);
    }

    let authorVc, clientVc;
    try {
      authorVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(interaction ? interaction.member.user.id : message.author.id).voice.channel.id;
    } catch (error) { authorVc = undefined };
    try {
      clientVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(client.user.id).voice.channel.id
    } catch (error) { clientVc = undefined };

    if  (!clientVc && (!channel && channel != clientVc)) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("common.errorNotChannel")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("common.errorNotChannel"))
        .catch(console.error);
    }

    let songs = queue.songs;
    for (let i = songs.length - 1; i > 1; i--) {
      let j = 1 + Math.floor(Math.random() * i);
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    queue.songs = songs;
    client.queue.set(interaction ? interaction.guild_id : message.guild.id, queue);

    if (interaction) {
      return client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: i18n.__mf("shuffle.result", { author: interaction ? interaction.member.user.id : message.author })
          }
        }
      });
    }
    queue.textChannel.send(i18n.__mf("shuffle.result", { author: interaction ? interaction.member.user.id : message.author })).catch(console.error);
  }
};
