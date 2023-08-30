/**
 * Copyright (c) 2023 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */

var pkg = {};

// https://code.earthengine.google.com/1df3b3d8534f277000f59aab03eecca6
pkg.extract = function (col, fc, task, options) {
  var img = col.first().select(0);
  var prj = img.projection();
  var scale = prj.nominalScale();

  options = options || {};
  options.region = fc;

  options.projection = options.projection || prj;
  options.scale = options.scale || scale;
  var ans = col.map(function (x) { return x.unmask(-99); })
    .toArray().sample(options);
  var val = ans.toList(ans.size()).map(function (i) { return ee.Feature(i).get('array') });

  val = ee.Algorithms.If(ee.Algorithms.ObjectType(fc).equals("FeatureCollection"), val, val.get(0));
  if (task) print(task, val);
  return val;
};

pkg.guess_reduce_option = function (col) {
  var img = ee.Image(col.first()).select(0);
  var prj = img.projection();
  var scale = prj.nominalScale();
  return { reducer: "first", crs: prj, scale: scale, tileScale: 16 };
};

/**
 * ee_extract_img(img, fc, options)
 * 
 * # Arguments
 * - `options`: 
 * 
 * + `filterBounds`: If true, `fc = fc.filterBounds(img.geometry());`
 * 
 * + `reducer` (Reducer): The reducer to apply.
 *
 * + `scale` (Float, default: null): A nominal scale in meters of the projection
 * to work in.
 * 
 * + `crs` (Projection, default: null): The projection to work in. If unspecified,
 * the projection of the image's first band is used. If specified in addition to
 * scale, rescaled to the specified scale.
 *
 * + `tileScale` (Float, default: 1): A scaling factor used to reduce aggregation
 * tile size; using a larger tileScale (e.g. 2 or 4) may enable computations
 * that run out of memory with the default.
 */
pkg.ee_extract_img = function(img, fc, options) {
  options = options || {};
  options.reducer = options.reducer || "first";
  // var prj = img.select(0).projection();
  // options.scale = options.scale || prj.nominalScale();
  // options.crs = options.crs || prj;
  options.collection = fc;
  if (options.filterBounds) fc = fc.filterBounds(img.geometry());

  var data = img.reduceRegions(options);
  data = data.map(function (f) {
    return ee.Feature(null).copyProperties(f)
      .set('date', ee.Date(img.get('system:time_start')).format('yyyy-MM-dd'));
  });
  return data;
};


pkg._extract_col = function (col, fc, options) {
  return col.map(function (img) {
    return pkg.ee_extract_img(img, fc, options);
  }, true).flatten();
};

pkg.ee_extract_col = function (col, fc, options) {
  options = options || {};
  options.reducer = options.reducer || "first";
  options.collection = fc;

  if (options.filterBounds) col = col.filterBounds(fs);
  var data;

  if (!options.nchunk) {
    data = pkg._extract_col(col, fc, options);
  } else {
    var nchunk = options.nchunk;
    var n = fc.size();
    var chunksize = n.divide(nchunk).ceil();
    fc = fc.toList(n);

    for (var i = 1; i <= nchunk; i++) {
      var i_begin = chunksize.multiply(i - 1);
      var i_end = chunksize.multiply(i);

      var fc_i = ee.FeatureCollection(fc.slice(i_begin, i_end));
      var task = file.concat("_").concat(i);

      data = pkg._extract_col(col, fc_i, options);
      // pkg_buffer.Export_Table(data, save, task, folder, fileFormat);
    }
  }
  return data;
};

pkg.st_drop_geometry = function (f) {
  return ee.Feature(null).copyProperties(f);
};

// return list of dict
pkg.sf_to_dict = function (data, drop_index) {
  var props = data.first().propertyNames();
  if (drop_index) props = props.slice(1, props.size());
  return data.toList(data.size()).map(function (x) { return ee.Feature(x).toDictionary(props); });
};


exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
