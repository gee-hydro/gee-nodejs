const ee = require('@google/earthengine');
const fs = require('fs');
var { google } = require('googleapis');


var HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
// USERPROFILE = process.env.USERPROFILE // .replace(/\\/g, "/")

var DIR = {
  HOME: HOME,
  GEE: HOME + "/gee",
  CREDENTIALS: HOME + '/.config/earthengine/credentials',
  PRIVATE_KEY: HOME + "/.config/earthengine/.private-key.json",
}


global.ee_init = function () {
  var o2 = JSON.parse(fs.readFileSync(DIR.CREDENTIALS, 'utf8'));
  var client = new google.auth.OAuth2(o2.client_id, o2.client_secret); // 
  client.setCredentials({ refresh_token: o2.refresh_token });
  client.refreshAccessToken(function (err, tokens) {
    ee.apiclient.setAuthToken('', 'Bearer', tokens['access_token'], 3600, [], undefined, false);
    ee.initialize();
  });
}

global.ee_init_key = function() {
  var private_key = require(DIR.PRIVATE_KEY);
  ee.data.authenticateViaPrivateKey(private_key, () => {
    ee.initialize();
  });
}

// var pkg = {
//   DIR: DIR,
//   ee_init: ee_init,
//   ee_init_key: ee_init_key, 
// };

// exports = pkg;
// if (typeof module !== "undefined") module.exports = exports;
