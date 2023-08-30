/**
 * Copyright (c) 2023 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
var pkg = {};


pkg.getDimensions = function (range, cellsize) {
  if (!range || !cellsize) return undefined;

  // var step = cellsize; // degrees
  var sizeX = (range[2] - range[0]) / cellsize;
  var sizeY = (range[3] - range[1]) / cellsize;
  sizeX = Math.round(sizeX);
  sizeY = Math.round(sizeY);

  var dimensions = sizeX.toString() + 'x' + sizeY.toString(); //[sizeX, ]
  return dimensions;
}

/**
 * @param options 
 * - range: [xmin, ymin, xmax, ymax]
 * - cellsize: 0.05
 */
pkg.set_image_range = function (options) {
  options = options || {}
  if (options.range) {
    options.region = ee.Geometry.Rectangle(options.range)
    if (options.cellsize)
      options.dimensions = pkg.getDimensions(options.range, options.cellsize)
  }
  return options;
  // options是一个全局变量，因此不用返回
}

/**
 * ExportTable(fc, task, options)
 * 
 * @param fc 
 * @param task 
 * @param options 
 * + `fileFormat`: "GeoJSON", "KML", "KMZ", or "SHP", or "TFRecord".
 * 
 * @example
 * ```js
 * var fc = ee.FeatureCollection("users/kongdd/shp/flux-212").select(['site', 'IGBP']).limit(10);
 * pkg.ExportTable(fc, "flux212", { fileFormat: "SHP"})
 * ```
 */
pkg.ExportTable = function (fc, task, options) {
  // 根据后缀推文件类型
  options = options || {}
  options.fileFormat = options.fileFormat || "GeoJSON";

  options.type = "EXPORT_FEATURES"
  options.element = fc;
  options.description = task + "." + options.fileFormat;
  options.driveFileNamePrefix = task;
  
  return ee.data.startProcessing(ee.data.newTaskId(), options);
}

/**
 * @param {*} img 
 * @param {*} task 
 * @param {*} options 
 * - `type`             : one of "drive", "asset", "cloud"
 * - `range`            : [xmin, ymin, xmax, ymax]
 * - `cellsize`         : 0.05
 * - `dimensions`       : "100x100"
 * - `pyramidingPolicy` : e.g., `{"B1": "MEAN"}`, optional, one of MEAN, SAMPLE,
 *   MIN, MAX, or MODE per band
 * @returns 
 *
 * @reference
 * <https://developers.google.com/earth-engine/apidocs/ee-image-getdownloadurl#code-editor-javascript>
 */
pkg.ExportImage = function (img, task, options) {
  // by range, cellsize, this is a global variable
  options = pkg.set_image_range(options)

  options.type = options.type || "drive";  

  options.element = img;
  options.fileFormat = "GEO_TIFF"
  options.description = task;

  options.folder = options.folder || "."

  if (options.verbose) print(options)

  switch (options.type) {
    case 'drive':
      options.driveFolder = options.folder;
      options.driveFileNamePrefix = task;
      // options.skipEmptyTiles = true;
      // Export.image.toDrive(options);
      break;
    case 'asset':
      options.assetId = options.folder + "/" + task; //projects/pml_evapotranspiration/;
      // Export.image.toAsset(options);
      break;
    case 'cloud':
      options.bucket = options.bucket;
      options.fileNamePrefix = task;
      options.skipEmptyTiles = true;
      // Export.image.toCloudStorage(options);
      break;
  }
  options.type = "EXPORT_IMAGE"
  return ee.data.startProcessing(ee.data.newTaskId(), options)  
  // pyramidingPolicy: '{"B1": "MEAN"}',  // optional, one of MEAN, SAMPLE, MIN, MAX, or MODE per band
  // unused parameters will be droped automatically
}


/**
 * Get a download URL for small chunks of image data in GeoTIFF or NumPy format.
 * 
 * Maximum request size is 32 MB, maximum grid dimension is 10000.
 * 
 * @param {*} img 
 * @param {*} task 
 * @param {*} options 
 * @returns 
 */
pkg.getDownloadURL = function (img, task, options) {
  options = pkg.set_image_range(options)
  options.format = "GEO_TIFF"
  options.verbose && (print(options))

  var url = img.getDownloadURL(options);
  download(url, task + ".tif");
  return url;
}


exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
