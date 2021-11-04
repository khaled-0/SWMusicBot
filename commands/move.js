const move = require("array-move");
const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "move",
  aliases: ["mv"],
  description: i18n.__("move.description"),
  commandOption: [{
                name: "position",
                description: "Target Video Position In Queue",
                type: 4,
                required: true
              }],
  execute(client, message, interaction, args) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);
    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("move.errorNotQueue")
             }
          }
        });
      }

      return message
        .inlineReply(i18n.__("move.errorNotQueue"))
        .catch(console.error);
    }

    let authorVc, clientVc;
    try {
      authorVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(interaction ? interaction.member.user.id : message.author.id).voice.channel.id;
    } catch (error) { authorVc = undefined };
    try {
      clientVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(client.user.id).voice.channel.id
    } catch (error) { clientVc = undefined };
    if (!clientVc && (!channel && channel != clientVc)) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              ephemeral: true,
              content: i18n.__("common.errorNotChannel")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("common.errorNotChannel"))
        .catch(console.error);
    }

    if (!args.length) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__mf("move.usagesReply", { prefix: client.prefix })
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("move.usagesReply", { prefix: client.prefix }))
        .catch(console.error);
    }
  

    if (isNaN(args[0]) || args[0] <= 1) {
            if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__mf("move.usagesReply", { prefix: client.prefix })
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("move.usagesReply", { prefix: client.prefix }))
        .catch(console.error);
    }

    let song = queue.songs[args[0] - 1];

    queue.songs = move(
      queue.songs,
      args[0] - 1,
      args[1] <= 2 || isNaN(args[1]) ? 1 : args[1] - 1
    );
    queue.textChannel.send(
      i18n.__mf("move.result", {
        author: interaction ? interaction.member.user.id : message.author,
        title: song.title,
        index: args[1] <= 2 || isNaN(args[1]) ? 2 : args[1],
      })
    );
  },
};
