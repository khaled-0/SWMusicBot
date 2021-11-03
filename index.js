const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX, botChannelId } = require("./util/Util");
const i18n = require("./util/i18n");
const config = require("./config.json");
require("./util/ExtendedMessage");
const { registerSlashCommands } = require("./util/RegisterSlashCommands");

const client = new Client({
  disableMentions: "everyone",
  restTimeOffset: 0,
  allowedMentions: {
    repliedUser: false
  }
});

client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Client Events
 */
client.on("ready", () => {
  client.user.setActivity(`${PREFIX}help and ${PREFIX}play`, { type: "LISTENING" });
  registerSlashCommands(client);
  console.log(`${client.user.username} ready!`);
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (message.channel.id != botChannelId) {
    var PRUNING = config ? config.PRUNING : false;
    if (PRUNING) {
      return message.inlineReply(`Use <#${botChannelId}> else Nub`).then(msg => {
        msg.delete({ timeout: 12000 });
      });
    }
    return message.inlineReply(`Use <#${botChannelId}> else Nub`);
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.inlineReply(
        i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name })
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.inlineReply(i18n.__("common.errorCommand")).catch(console.error);
  }
});

/**
 *Listen And Execute Slash Commands
 */
client.ws.on("INTERACTION_CREATE", async (interaction) => {
 if (!interaction.isCommand()) return;
  //return console.log(interaction) //JSON.stringify(interaction.data.options, null, 4))
  const commandName = interaction.data.name.toLowerCase();
  const args = interaction.data.options;

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  console.log("Executing " + command.name)
  if (interaction.channel_id != botChannelId) {
    return client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          ephemeral: true,
          content: `Use <#${botChannelId}> else Nub`
        }
      }
    });

  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(interaction.member.user.id)) {
    const expirationTime = timestamps.get(interaction.member.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            ephemeral: true,
            content: i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name })
          }
        }
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(interaction, args);
  } catch (error) {
    console.error(error);
    client.api.interactions(interaction.id, interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          ephemeral: true,
          content: i18n.__("common.errorCommand")
        }
      }
    });
  }








});

//Keep Alive
require("http").createServer((_, res) => res.end("Alive")).listen(8080)