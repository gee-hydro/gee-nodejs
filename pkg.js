var pkg_root = {};
var pkg_main = require("users/kongdd/pkg:pkg_main.js");

var pkg = pkg_main.merge_dict(
  pkg_root, 
  pkg_main,
  require("users/kongdd/pkg:pkg_extract.js"),
  require("users/kongdd/pkg:pkg_export.js")
);

pkg.index = require("users/kongdd/pkg:pkg_index.js");
pkg.CMRSET = require("users/kongdd/pkg:pkg_CMRSET.js");


exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
