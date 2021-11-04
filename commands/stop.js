const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "stop",
  description: i18n.__("stop.description"),
  commandOption: undefined,
  execute(client, message, interaction, args) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);

    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("stop.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("stop.errorNotQueue"))
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

    queue.songs = [];
    queue.connection.dispatcher.end();
    queue.textChannel
      .send(i18n.__mf("stop.result", { author: interaction ? interaction.member.user.id : message.author }))
      .catch(console.error);
  },
};
