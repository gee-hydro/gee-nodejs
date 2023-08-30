var IS_LOCAL = (typeof module !== "undefined")

function require2(repo) {
  if (IS_LOCAL) repo = repo.replace(/.*:/, './');
  // print(IS_LOCAL, repo);
  return require(repo);
}


var pkg_root = require("./src/ee_root.js");
var pkg_main = require2("users/kongdd/pkg:pkg_main.js");

var pkg = pkg_main.merge_dict(
  pkg_root, 
  pkg_main,
  require2("users/kongdd/pkg:pkg_extract.js"),
  require2("users/kongdd/pkg:pkg_export.js")
);

pkg.index = require2("users/kongdd/pkg:pkg_index.js");
pkg.CMRSET = require2("users/kongdd/pkg:pkg_CMRSET.js");

exports = pkg;
module.exports = exports;
