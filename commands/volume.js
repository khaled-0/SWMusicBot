const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

module.exports = {
  name: "volume",
  aliases: ["v"],
  description: i18n.__("volume.description"),
  commandOption: [{
                name: "target",
                description: "Update Volume To Or Show Current Volume",
                type: 4,
                required: false
              }],
  execute(client, message, interaction, args) {
    const queue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);

    if (!queue) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("volume.errorNotQueue")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("volume.errorNotQueue"))
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


    if (!args[0]){
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__mf("volume.currentVolume", { volume: queue.volume })
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("volume.currentVolume", { volume: queue.volume }))
        .catch(console.error);
    }

    if (isNaN(args[0]) || Number(args[0]) > 100 || Number(args[0]) < 0) return;

    queue.volume = args[0];
    queue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
    return queue.textChannel
      .send(i18n.__mf("volume.result", { arg: args[0] }))
      .catch(console.error);
  }
};
