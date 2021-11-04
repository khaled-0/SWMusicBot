const i18n = require("../util/i18n");
const SoundCloudSearch = require("../util/SoundCloudSearch");
const { play } = require("../include/play");
const ytdl = require("ytdl-core");
const YouTube = require("youtube-sr").default;
const scdl = require("soundcloud-downloader").default;
const https = require("https");
const { SOUNDCLOUD_CLIENT_ID, DEFAULT_VOLUME } = require("../util/Util");
require("../util/ExtendedMessage");

let config;

try {
  config = require("../config.json");
} catch (error) {
  config = null;
}

const PRUNING = config ? config.PRUNING : false;
const SC_SEARCH_EXT = config ? config.SOUNDCLOUD_SEARCH_EXT : "-sc";

module.exports = {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: i18n.__("play.description"),
  commandOption: [{
    name: "query",
    description: "Video Title Or Url (End with -sc To Use SoundCloud)",
    type: 3,
    required: true
  }],
  async execute(client, message, interaction, args) {

    const serverQueue = client.queue.get(interaction ? interaction.guild_id : message.guild.id);

    let channel, clientVc;
    try {
      channel = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(interaction ? interaction.member.user.id : message.author.id).voice.channel;
    } catch (error) { channel = undefined }; //authorVc
    try {
      clientVc = client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).members.cache.get(client.user.id).voice.channel;
    } catch (error) { clientVc = undefined };

    if (!channel) {
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__("play.errorNotChannel")
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__("play.errorNotChannel"))
        .catch(console.error);
    }

    if (!clientVc && (!channel && channel != clientVc)) {
      console.log(clientVc); console.log(channel)
      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: i18n.__mf("play.errorNotInSameChannel", { user: client.user })
            }
          }
        });
      }

      return message
        .inlineReply(i18n.__mf("play.errorNotInSameChannel", { user: client.user }))
        .catch(console.error);
    }

    if (!args.length)
      return message
        .inlineReply(
          i18n.__mf("play.usageReply", { prefix: client.prefix })
        )
        .catch(console.error);


    const search = args.join(" ");
    const videoPattern =
      /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
    const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return client.commands.get("playlist").execute(message, args);
    } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
      return client.commands.get("playlist").execute(message, args);
    }

    if (mobileScRegex.test(url)) {
      try {
        https.get(url, function(res) {
          if (res.statusCode == "302") {
            return client.commands
              .get("play")
              .execute(client, message, interaction, [res.headers.location]);
          } else {
            if (interaction) {
              return client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                  type: 4,
                  data: {
                    content: i18n.__("play.songNotFound")
                  }
                }
              });
            }

            return message
              .inlineReply(i18n.__("play.songNotFound"))
              .catch(console.error);

          }
        });
      } catch (error) {
        console.error(error);
        if (interaction) {
          return client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: error.message
              }
            }
          });
        }

        return message
          .inlineReply(error.message)
          .catch(console.error);
      }

      if (interaction) {
        return client.api.interactions(interaction.id, interaction.token).callback.post({
          data: {
            type: 4,
            data: {
              content: "Following url redirection..."
            }
          }
        });
      }

      return message
        .inlineReply("Following url redirection...")
        .catch(console.error);
    }

    const queueConstruct = {
      textChannel: interaction ? client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).channels.cache.get(interaction.channel_id) : message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: DEFAULT_VOLUME,
      muted: false,
      playing: true,
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds,
        };
      } catch (error) {
        console.error(error);
        if (interaction) {
          return client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: error.message
              }
            }
          });
        }

        return message
          .inlineReply(error.message)
          .catch(console.error);
      }
    } else if (scRegex.test(url)) {
      try {
        const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
        song = {
          title: trackInfo.title,
          url: trackInfo.permalink_url,
          duration: Math.ceil(trackInfo.duration / 1000),
        };
      } catch (error) {
        console.error(error);
        if (interaction) {
          return client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: error.message
              }
            }
          });
        }

        return message
          .inlineReply(error.message)
          .catch(console.error);
      }
    } else {
      try {
        var query = interaction ? args[0] : message.content;
        var SC_SEARCH = query.endsWith(SC_SEARCH_EXT) ? true : false;
        var searchingReplyMsg = SC_SEARCH
          ? "Searching ```" +
          search.replace(SC_SEARCH_EXT, "") +
          "``` In SoundCloud"
          : "Searching ```" + search + "```";
        let results;

        if (!interaction) {

          let searchingMsg = await message.inlineReply(searchingReplyMsg);
          results = SC_SEARCH
            ? await SoundCloudSearch.searchFor(
              search.replace(SC_SEARCH_EXT, ""),
              1
            )
            : await YouTube.search(search, { limit: 1 });
          if (results === undefined ||
            (results != undefined && !results.length)) {
            message
              .inlineReply(i18n.__("play.songNotFound"))
              .catch(console.error);
            if (PRUNING) setTimeout(() => searchingMsg.delete(), 5000);
            return;
          }

          if (PRUNING) setTimeout(() => searchingMsg.delete(), 5000);
        } else {

          client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: searchingReplyMsg
              }
            }
          });

          results = SC_SEARCH
            ? await SoundCloudSearch.searchFor(
              search.replace(SC_SEARCH_EXT, ""),
              1
            )
            : await YouTube.search(search, { limit: 1 });
          if (results === undefined ||
            (results != undefined && !results.length)) {
            return client.api.interactions(interaction.id, interaction.token).callback.post({
              data: {
                type: 4,
                data: {
                  content: i18n.__("play.songNotFound")
                }
              }
            });
          }
        }

        if (SC_SEARCH) {
          trackInfo = await scdl.getInfo(results, SOUNDCLOUD_CLIENT_ID);
          song = {
            title: trackInfo.title,
            url: trackInfo.permalink_url,
            duration: Math.ceil(trackInfo.duration / 1000),
          };
        } else {
          songInfo = await ytdl.getInfo(results[0].url);
          song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            duration: songInfo.videoDetails.lengthSeconds,
          };
        }


      } catch (error) {
        console.error(error);
        if (interaction) {
          return client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
              type: 4,
              data: {
                content: error.message
              }
            }
          });
        }

        return message
          .inlineReply(error.message)
          .catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(
          i18n.__mf("play.queueAdded", {
            title: song.title,
            author: interaction ? interaction.member.user.id : message.author,
          })
        )
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    client.queue.set(interaction ? interaction.guild_id : message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message, interaction, client);
    } catch (error) {
      console.error(error);
      client.queue.delete(interaction ? interaction.guild_id : message.guild.id);
      await channel.leave();
      const msgChannel = interaction ? client.guilds.cache.get(interaction ? interaction.guild_id : message.guild.id).channels.cache.get(interaction.channel_id) : message.channel;
      return msgChannel
        .send(i18n.__mf("play.cantJoinChannel", { error: error }))
        .catch(console.error);
    }
  },
};
