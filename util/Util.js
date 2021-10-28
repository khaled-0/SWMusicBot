exports.canModifyQueue = (member) => member.voice.channelID === member.guild.voice.channelID;

let config;

try {
  config = require("../config.json");
} catch (error) {
  config = null;
}

exports.TOKEN = process.env.['discordToken'];
exports.SOUNDCLOUD_CLIENT_ID = process.env.['SOUNDCLOUD_CLIENT_ID'];
exports.PREFIX = (config ? config.PREFIX : process.env.PREFIX) || "_");
exports.MAX_PLAYLIST_SIZE = (config ? config.MAX_PLAYLIST_SIZE : 10);
exports.PRUNING = (config ? config.PRUNING : false));
exports.STAY_TIME = (config ? config.STAY_TIME : 30);
exports.DEFAULT_VOLUME = (config ? config.DEFAULT_VOLUME : 100);
exports.LOCALE = (config ? config.LOCALE : "en");
