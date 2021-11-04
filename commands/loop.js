const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "loop",
  aliases: ["l"],
  description: i18n.__("loop.description"),
  commandOption: undefined,
  execute(client, message, interaction) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);
    if (!queue) {
       if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              ephemeral: true,
              content: i18n.__("loop.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("loop.errorNotQueue"))
        .catch(console.error);
    }

    let authorVc, clientVc;
    try {
      authorVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(interaction ? interaction.member.user.id : message.author.id).voice.channel.id;
    } catch (error) { authorVc = undefined };
    try {
      clientVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(client.user.id).voice.channel.id
    } catch (error) { clientVc = undefined };

    if (!authorVc || !clientVc || clientVc != authorVc) {
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
    // toggle from false to true and reverse
    queue.loop = !queue.loop;
    return queue.textChannel
      .send(
        i18n.__mf("loop.result", {
          loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off"),
        })
      )
      .catch(console.error);
  },
};
