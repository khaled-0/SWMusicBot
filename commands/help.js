const { MessageEmbed } = require("discord.js");
const i18n = require("../util/i18n");

module.exports = {
  name: "help",
  aliases: ["h"],
  description: i18n.__("help.description"),
  commandOption: undefined,
  execute(client, message, interaction) {
     
    let commands = client.commands.array();

    let helpEmbed = new MessageEmbed()
      .setTitle(i18n.__mf("help.embedTitle", { botname: client.user.username }))
      .setDescription(i18n.__("help.embedDescription"))
      .setColor("#F8AA2A");

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `**${client.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
        `${cmd.description}`,
        true
      );
    });

    helpEmbed.setTimestamp();

    if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              embeds: [helpEmbed]
            }
          }
        });
      }

      return message
        .inlineReply(helpEmbed)
        .catch(console.error);
  }
};
