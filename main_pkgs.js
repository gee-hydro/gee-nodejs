// var requireFromUrl = require('require-from-url/sync');
var ee = require('@google/earthengine');
var exec = require('child_process').exec;
var path = require("path")


USERPROFILE = process.env.USERPROFILE // .replace(/\\/g, "/")
DIR = {
  PRIVATE_KEY: USERPROFILE + "/.config/earthengine/.private-key.json",
  GEE: USERPROFILE + "/gee"
}


print = console.log;

function ee_init() {
  var private_key = require(DIR.PRIVATE_KEY);
  ee.data.authenticateViaPrivateKey(private_key, () => {
    ee.initialize();
  });  
}

function run_exec(cmd) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
    if (stderr) console.log(`stderr: ${stderr}`);
    if (stdout) console.log(`stdout: ${stdout}`);
  })
}

function ee_require(url, dir_gee) {
  dir_gee = dir_gee || DIR.GEE
  var info = url.split(":");
  var _repo = info[0]
  var _path = info[1]

  odir = dir_gee + "/" + path.basename(_repo)
  cmd = "git clone https://earthengine.googlesource.com/" + _repo + " " + odir

  console.log(_repo); // "users/kongdd/pkgs"
  // console.log(path); // "pkg_vis.js"
  run_exec(cmd)
  run_exec(`cd ${odir} && git pull`)

  require(odir + "/" + _path)
}

// ee.initialize();
module.exports = {
  DIR: DIR, 
  print: print,
  ee_init: ee_init, 
  run_exec: run_exec, 
  ee_require: ee_require
}
