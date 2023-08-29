// var requireFromUrl = require('require-from-url/sync');
const ee = require('@google/earthengine');
const exec = require('child_process').exec;
const path = require("path")
const fs = require('fs');


USERPROFILE = process.env.USERPROFILE // .replace(/\\/g, "/")
DIR = {
  PRIVATE_KEY: USERPROFILE + "/.config/earthengine/.private-key.json",
  GEE: USERPROFILE + "/gee"
}

function write_disk(x, f) {
  fs.writeFile(f, x, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function write_json(x, f) {
  json = JSON.stringify(x);
  write_disk(json, f)
}

async function ee_write_json(x, f) {
  return new Promise((resolve) => {
    setTimeout(() => {
      var x2 = x.getInfo();
      pkg.write_json(x2, f);
      // console.log(`Doing something with ${f}`);
      resolve();
    }, 100);
  });
}

// // 实现了一个异步保存函数
// async function ee_write_json(x, f) {
//   // var x_promise = new Promise((resolve, reject) => {
//   //   resolve(x.getInfo());
//   // });
//   // Promise.all([x_promise])
//   //   .then(([x]) => {
//   //     write_json(x, f);
//   //   })
//   var x2 = await x.getInfo()
//   write_json(x2, f)
// }

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

var pkg_root = {
  DIR: DIR,
  write_json: write_json,
  write_disk: write_disk,
  ee_write_json: ee_write_json, 
  ee_init: ee_init,
  run_exec: run_exec,
  ee_require: ee_require
}

var pkg_main = require("./pkg_main.js");
var pkg_export = require("./pkg_export.js");
var pkg_extract = require("./pkg_extract.js");

var pkg = pkg_main.merge_dict(pkg_root, pkg_main, pkg_extract, pkg_export);

exports = pkg;
if (typeof module !== "undefined") module.exports = exports;