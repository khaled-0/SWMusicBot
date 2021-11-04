const GuildID = process.env["GUILD_ID"];

/**
 * Register Slash Commands
 */

module.exports = {
  registerSlashCommands(client) {
//return;
    /**
     * Get all old slash commands
     */
    var oldCommands = {};
    client.api.applications(client.user.id).guilds(GuildID).commands.get().then((slashCmd) => {
      slashCmd.forEach((data) => {
        oldCommands[data.name] = data.id;
      })
    }).then(function() {
      //return console.log(oldCommands['pause'])
      let commands = client.commands.array();
      commands.forEach((cmd) => {
        if (cmd.name in oldCommands) {

          console.log(`Updating Slash Command: ${cmd.name}`)
          var oldCommandId = oldCommands[cmd.name];
          if(!cmd.commandOption) {
             client.api
            .applications(client.user.id)
            .guilds(GuildID)
            .commands(oldCommandId).patch({
              data: {
                name: cmd.name,
                description: cmd.description
              }
            }).catch(console.error);
          } else {
             client.api
            .applications(client.user.id)
            .guilds(GuildID)
            .commands(oldCommandId).patch({
              data: {
                name: cmd.name,
                description: cmd.description,
                options: cmd.commandOption
              }
            }).catch(console.error);
          }
          
        } else {
          console.log(`Adding Slash Command: ${cmd.name}`)
          if(!cmd.commandOption) {
          client.api
            .applications(client.user.id)
            .guilds(GuildID)
            .commands.post({
              data: {
                name: cmd.name,
                description: cmd.description
              }
            }).catch(console.error);
          } else {
            client.api
            .applications(client.user.id)
            .guilds(GuildID)
            .commands.post({
              data: {
                name: cmd.name,
                description: cmd.description,
                options: cmd.commandOption
              }
            }).catch(console.error);
          }

        }

      });
      console.log("Done Updating Slash Commands")
    });
  }
}