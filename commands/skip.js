const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "skip",
  aliases: ["s"],
  commandOption: undefined,
  description: i18n.__("skip.description"),
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

    queue.playing = true;
    queue.connection.dispatcher.end();
    queue.textChannel
      .send(i18n.__mf("skip.result", { author: interaction ? interaction.member.user.id : message.author }))
      .catch(console.error);
  },
};
