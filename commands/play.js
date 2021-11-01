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
  async execute(message, args) {
    const { channel } = message.member.voice;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (!channel)
      return message
        .inlineReply(i18n.__("play.errorNotChannel"))
        .catch(console.error);

    if (false)
      //(serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .inlineReply(
          i18n.__mf("play.errorNotInSameChannel", { user: message.client.user })
        )
        .catch(console.error);

    if (!args.length)
      return message
        .inlineReply(
          i18n.__mf("play.usageReply", { prefix: message.client.prefix })
        )
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.inlineReply(i18n.__("play.missingPermissionConnect"));
    if (!permissions.has("SPEAK"))
      return message.inlineReply(i18n.__("play.missingPermissionSpeak"));

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
      return message.client.commands.get("playlist").execute(message, args);
    } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    if (mobileScRegex.test(url)) {
      try {
        https.get(url, function (res) {
          if (res.statusCode == "302") {
            return message.client.commands
              .get("play")
              .execute(message, [res.headers.location]);
          } else {
            return message
              .inlineReply(i18n.__("play.songNotFound"))
              .catch(console.error);
          }
        });
      } catch (error) {
        console.error(error);
        return message.inlineReply(error.message).catch(console.error);
      }
      return message
        .inlineReply("Following url redirection...")
        .catch(console.error);
    }

    const queueConstruct = {
      textChannel: message.channel,
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
        return message.inlineReply(error.message).catch(console.error);
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
        return message.inlineReply(error.message).catch(console.error);
      }
    } else {
      try {
        var SC_SEARCH = message.content.endsWith(SC_SEARCH_EXT) ? true : false;
        var searchingReplyMsg = SC_SEARCH
          ? "Searching ```" +
            search.replace(SC_SEARCH_EXT, "") +
            "``` In SoundCloud"
          : "Searching ```" + search + "```";
        let searchingMsg = await message.inlineReply(searchingReplyMsg);

        const results = SC_SEARCH
          ? await SoundCloudSearch.searchFor(
              search.replace(SC_SEARCH_EXT, ""),
              1
            )
          : await YouTube.search(search, { limit: 1 });
        if (
          results === undefined ||
          (results != undefined && !results.length)
        ) {
          message
            .inlineReply(i18n.__("play.songNotFound"))
            .catch(console.error);
          if (PRUNING) setTimeout(() => searchingMsg.delete(), 5000);
          return;
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

        if (PRUNING) setTimeout(() => searchingMsg.delete(), 5000);
      } catch (error) {
        console.error(error);
        return message.inlineReply(error.message).catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(
          i18n.__mf("play.queueAdded", {
            title: song.title,
            author: message.author,
          })
        )
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id);
      await channel.leave();
      return message.channel
        .send(i18n.__mf("play.cantJoinChannel", { error: error }))
        .catch(console.error);
    }
  },
};
