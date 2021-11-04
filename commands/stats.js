const { MessageEmbed } = require("discord.js");
require("moment-duration-format");
const cpuStat = require("cpu-stat");
const moment = require("moment");

module.exports = {
  name: "stats",
  description: "Get information about the bot",
  usage: "",
  permissions: {
    channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
    member: [],
  },
  aliases: ["ping", "inf"],
  commandOption: undefined,

  execute (client, message, interaction, args) {
    const { version } = require("discord.js");
    cpuStat.usagePercent(async function (err, percent, seconds) {
      if (err) {
        return console.log(err);
      }
      const duration = moment
        .duration(client.uptime)
        .format(" D[d], H[h], m[m]");

      const embed = new MessageEmbed();
      embed.setColor('#2fa132');
      embed.setTitle(`\`${client.user.username}\` Stats`);
      embed.addFields(
        {
          name: "Ping",
          value: `┕\`${Math.round(client.ws.ping)}ms\``,
          inline: true,
        },
        {
          name: "Uptime",
          value: `┕\`${duration}\``,
          inline: true,
        },
        {
          name: "Memory",
          value: `┕\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
            2
          )} Mb\``,
          inline: true,
        }
      );

      embed.addFields(
        {
          name: "API Latency",
          value: `┕\`${client.ws.ping}ms\``,
          inline: true,
        },
        {
          name: "Discord.js",
          value: `┕\`v${version}\``,
          inline: true,
        },
        {
          name: "Node.Js",
          value: `┕\`${process.version}\``,
          inline: true,
        }
      );

      if (interaction) {
      return client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [embed]
          }
        }
      });
    }

    return message
      .inlineReply(embed)
      .catch(console.error);
    });
  }
};