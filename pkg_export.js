/**
 * Copyright (c) 2023 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
var pkg = {};


/**
 * ExportTable(fc, fname, options)
 * 
 * @param fc 
 * @param fname 
 * @param options 
 * + `fileFormat`: "GeoJSON", "KML", "KMZ", or "SHP", or "TFRecord".
 * 
 * @example
 * ```js
 * var fc = ee.FeatureCollection("users/kongdd/shp/flux-212").select(['site', 'IGBP']).limit(10);
 * pkg.ExportTable(fc, "flux212", { fileFormat: "SHP"})
 * ```
 */
pkg.ExportTable = function(fc, fname, options) {
  // 根据后缀推文件类型
  options = options || {}
  options.fileFormat = options.fileFormat || "GeoJSON";

  options.type = "EXPORT_FEATURES"
  options.element = fc;
  options.description = fname + "." + options.fileFormat;
  options.driveFileNamePrefix = fname;

  return ee.data.startProcessing(ee.data.newTaskId(), options);
}


exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
