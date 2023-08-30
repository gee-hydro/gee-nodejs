// var pkgs = require('users/kongdd/public:pkgs.js');
// var pkgs = require('users/kongdd/public:pkg_trend.js');
// var pkg_trend = require('users/kongdd/pkgs:pkg_date.js');
var pkg_export = require('users/kongdd/pkgs:pkg_export.js');
var pkgs = {};

pkgs.copyProperties = function (source, destination, properties) {
    // properties = properties || ['system:time_start']; // , 'system:id'
    properties = properties || destination.propertyNames();
    var ans = source.copyProperties(destination)
        .copyProperties(destination, properties);
    return ee.Image(ans);
};

/**
 * bandList -> reducerList
 * 
 * - 1 -> N : e.g. Tair to Tavg, Tmax, Tmin
 * - N -> 1 : 
 * - N -> N : N reduce corresponding to N List
 * 
 * @param {*} reducerList 
 * @param {*} bandList 
 * @param {*} ImgCol 
 */
pkgs.check_aggregate = function(bandList, reducerList, ImgCol) {
    function check_list(x) {
        if (!Array.isArray(x)) x = [x];
        return x;
    }

    reducerList = reducerList || ['mean'];
    bandList   = bandList || ImgCol.first().bandNames();

    reducerList = check_list(reducerList);
    bandList   = check_list(bandList);

    if (bandList.length === 1 && reducerList.length > 1) {
        var temp = bandList[0];
        bandList = [];
        reducerList.forEach(function (reducer, i) {
            bandList.push(temp);
        });
    }
    return { bandList: bandList, reducerList: reducerList };
}

/**
 * aggregate_prop
 *
 * @param  {[type]} ImgCol  [description]
 * @param  {[type]} prop    The value of "prop" should be string.
 * @param  {[type]} reducer [description]
 * @param  {boolean} delta  If true, reducer will be ignore, and return
 *                          Just deltaY = y_end - y_begin. (for dataset like GRACE)
 * @return {[type]}         [description]
 */
pkgs.aggregate_process = function (imgcol, bandList, reducerList) {
    var first = ee.Image(imgcol.first());
    var nreducer = reducerList.length;
    // print(bandList, reducerList, nreducer);
    var ans = ee.Image([]);
    for (var i = 0; i < nreducer; i++) {
        var bands = bandList[i];
        var reducer = reducerList[i];
        var img_new = imgcol.select(bands).reduce(reducer);
        ans = ans.addBands(img_new);
    }
    return ee.Image(pkgs.copyProperties(ee.Image(ans), first));;
};

// examples
// pkgs.aggregate_prop(ImgCol, prop, "sum", null, options_export)
pkgs.aggregate_prop = function (ImgCol, prop, reducerList, bandList, options_export) {
    // if (delta === undefined) { delta = false; }
    var dates = ee.Dictionary(ImgCol.aggregate_histogram(prop)).keys();
    var options = pkgs.check_aggregate(bandList, reducerList, ImgCol);
    var bands = ee.List(options.bandList).flatten();

    // print(dates, options);
    function process(prop_val) {
        var imgcol = ImgCol.filterMetadata(prop, 'equals', prop_val).sort('system:time_start');
        // var first = ee.Image(imgcol.first());
        // var last  = pkgs.imgcol_last(imgcol);
        // ans = last.subtract(first);
        var n = imgcol.size();
        var ans = pkgs.aggregate_process(imgcol, options.bandList, options.reducerList)
            .set('n', n);
        
        if (options_export) {
            prop_val.evaluate(function (prop_val){
                var prefix = options_export.prefix || "";
                var task = prefix + prop_val;
                pkg_export.ExportImg(ans, task, options_export);
            })
        }
        // print(prop_val, imgcol, ans);
        return ans;
    }
    // if (options_export) dates = dates.getInfo(); // get info will
    var ImgCol_new = dates.map(process);
    var out = ee.ImageCollection(ImgCol_new);
    if (options.reducerList.length === 1) {
        out = out.select(ee.List.sequence(0, bands.length().subtract(1)), bands);
    }
    return out;
};

exports = pkgs;
