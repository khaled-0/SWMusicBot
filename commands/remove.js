const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
require("../util/ExtendedMessage");

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;

module.exports = {
  name: "remove",
  aliases: ["rm"],
  description: i18n.__("remove.description"),
  commandOption: [{
                name: "number",
                description: "From Position Of Queue",
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
              content: i18n.__("remove.errorNotQueue")
             }
          }
        });
      }

      return message
        .inlineReply(i18n.__("remove.errorNotQueue"))
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
              content: i18n.__mf("remove.usageReply", { prefix: client.prefix })
             }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("remove.usageReply", { prefix: client.prefix }))
        .catch(console.error);

    }

    const arguments = args.join("");
    const songs = arguments.split(",").map((arg) => parseInt(arg));
    let removed = [];

    if (pattern.test(arguments)) {
      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex) => songIndex - 1 === index)) removed.push(item);
        else return true;
      });

      queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: removed.map((song) => song.title).join("\n"),
          author: interaction ? interaction.member.user.id : message.author.id
        })
      );
    } else if (!isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
      return queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: queue.songs.splice(args[0] - 1, 1)[0].title,
          author: interaction ? interaction.member.user.id : message.author
        })
      );
    } else {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__mf("remove.usageReply", { prefix: client.prefix })
             }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("remove.usageReply", { prefix: client.prefix }))
        .catch(console.error);
    }
  }
};
