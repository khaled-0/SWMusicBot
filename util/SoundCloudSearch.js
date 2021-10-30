const fetch = require('node-fetch');
const { SOUNDCLOUD_CLIENT_ID } = require("../util/Util");
const scSrcRegex = new RegExp('\"permalink_url\":\"(.*?)\"');

module.exports = {
  searchFor: async function(keyword, limit) {
    var pathUri = "https://api-v2.soundcloud.com/search/tracks?q=" + keyword + "&client_id=" + SOUNDCLOUD_CLIENT_ID + "&limit=" + limit;

    return await fetch(pathUri)
      .then((response) => response.json()).then((data)=> {
        var chunk = JSON.stringify(data);
        var match = scSrcRegex.exec(chunk)
        return (match[1]);
      }).catch((error) => console.log(error));
  }
}
