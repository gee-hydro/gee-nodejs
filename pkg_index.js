/**
 * All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
// var pkg = require('users/kongdd/public:pkg.js');
// var pkg = require('users/kongdd/pkg:pkg_CMRSET.js');
var pkg = {};

/**
 * Soil-adjusted vegetation index
 * 
 * @param {[type]} img [description]
 * 
 * @references
 * 1. https://en.wikipedia.org/wiki/Soil-adjusted_vegetation_index
 * 2. Huete, A.R., (1988) 'A soil-adjusted vegetation index (SAVI)' 
 *     Remote Sensing of Environment, vol. 25, issue 3, pp. 259-309.
 *     DOI: 10.1016/0034-4257(88)90106-X
 */
pkg.SAVI = function (img) {
    // L is a canopy background adjustment factor.
    return img.expression("(b('nir') - b('red'))*(1 + L) / (b('nir') + b('red') + L)",
        { L: 0.5 }).rename('SAVI');
};

pkg.NDVI = function (img) {
    return img.expression(
        "NDVI = (b('nir') - b('red')) / (b('nir') + b('red'))")
        .max(ee.Image(0))
        .min(ee.Image(1));
};

pkg.EVI = function (img) {
    return img.expression(
        "EVI = 2.5*(b('nir') - b('red')) / (b('nir') + 6*b('red') - 7.5*b('blue') + 1)")
        .max(ee.Image(0))
        .min(ee.Image(1));
};

pkg.EVI2 = function (img) {
    // L is a canopy background adjustment factor.
    return img.expression(
        "EVI2 = 2.5*(b('nir') - b('red')) / (b('nir') + b('red')*2.4 + 1)")
        .max(ee.Image(0))
        .min(ee.Image(1));
};

/**
 * Global vegetation moisture index (GVMI) with SWIR1
 * @reference parameters Nill, Equation (3)
 */
pkg.GVMI = function (img, swir) {
    swir = swir || "swir1";
    var gvmi = swir == "swir1" ? "GVMI" : "GVMI2";
    return img.expression(
        "((b('nir') + 0.1) - (swir + 0.02)) / ((b('nir') + 0.1) + (swir + 0.02))", {
        swir: img.select(swir)
    }).rename(gvmi)
        .max(ee.Image(0))
        .min(ee.Image(1));
}
pkg.GVMI2 = function (img) { return pkg.GVMI(img, "swir2") }

/** 
 * Residual moisture index (RMI)
 * 
 * @author Tom Van Niel (CSIRO Land and Water)
 * Equations numberd as in Guerschman et al. (2009), Equation (5)
 */
pkg.RMI = function (img, gvmi) {
    var gvmi = gvmi || "GVMI";
    var rmi = gvmi == "GVMI" ? "RMI" : "RMI2";
    return img.expression(
        "GVMI - (Krmi * b('EVI') + Crmi)", {
        GVMI: img.select(gvmi),
        Krmi: 0.775, Crmi: -0.076
    }).rename(rmi)
    .max(ee.Image(0))
    .min(ee.Image(1));
}
pkg.RMI2 = function (img) { return pkg.RMI(img, "GVMI2") }

pkg.LSWI = function (img) {
    return img.expression("(b('nir') - swir) / (b('nir') + swir)")
        .rename('LSWI');
};

exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
