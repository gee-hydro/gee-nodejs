/**
 * Copyright (c) 2023 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
var pkg = {};


pkg.merge_dict = function() {
  var ans = {};
  var obj;
  for (var i = 0; i < arguments.length; ++i) {
    obj = arguments[i];
    for (var j in obj) {
      ans[j] = obj[j];
    }
  }
  return ans;
}

pkg.default_true = function(x) {
  return (typeof x === "undefined") ? true : x;
}

// global not work in online mode
exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
