/**
 * Copyright (c) 2023 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */

function guess_reduce_option(col) {
  var img = ee.Image(col.first()).select(0);
  var prj = img.projection();
  var scale = prj.nominalScale();
  return { reducer: "first", crs: prj, scale: scale, tileScale: 16 };
}

function st_drop_geometry(f) {
  return ee.Feature(null).copyProperties(f);
}

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
function ee_extract_img(img, fc, options) {
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
}


function _extract_col(col, fc, options) {
  return col.map(function (img) {
    return ee_extract_img(img, fc, options);
  }, true).flatten();
}

function ee_extract_col(col, fc, options) {
  options = options || {};
  options.reducer = options.reducer || "first";
  options.collection = fc;

  if (options.filterBounds) col = col.filterBounds(fs);
  var data;

  if (!options.nchunk) {
    data = _extract_col(col, fc, options);
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

      data = _extract_col(col, fc_i, options);
      // pkg_buffer.Export_Table(data, save, task, folder, fileFormat);
    }
  }
  return data;
}

// return list of dict
function sf_to_dict(data, drop_index) {
  var props = data.first().propertyNames();
  if (drop_index) props = props.slice(1, props.size());
  return data.toList(data.size()).map(function (x) { return ee.Feature(x).toDictionary(props); });
}

var pkgs = {
  sf_to_dict: sf_to_dict,
  st_drop_geometry: st_drop_geometry,
  ee_extract_img: ee_extract_img,
  ee_extract_col: ee_extract_col, 
  guess_reduce_option: guess_reduce_option
}

exports = pkgs;
if (typeof module !== "undefined") module.exports = exports;
