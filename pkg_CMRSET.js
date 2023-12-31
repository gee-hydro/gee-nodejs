/**
 * All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
// CMRSET indices
var pkg = {};

// EVI rescaled
pkg.rescaled_evi = function (img) {
    // Re-scaled EVI parameter, Equation (8)
    var EVImin = 0;
    var EVImax = 0.90;
    return img.expression(
        'EVIr = (b("EVI") - EVImin) / (EVImax - EVImin)', {
        EVImin: EVImin, EVImax: EVImax,
    }).max(ee.Image(0))
      .min(ee.Image(1));
}

pkg.PInterception = function (img) {
    // Rainfall interception parameters, Equation (10)
    var KE_max = 0.229;
    return ee.Image(KE_max).multiply(img.select('EVIr')).rename('KE');
}

// the crop coefficent Kc, // Equation (11)
pkg.Kc = function (img, rmi) {
    rmi = rmi || "RMI";
    var name = rmi == "RMI" ? "Kc" : "Kc2";
    var Kc_max = 0.680;
    var a      = 14.12;
    var b      = 7.991;
    var alpha  = 2.482;
    var beta   = 0.890;
    return img.expression(
        'Kc_max * (1 - exp(-a* b("EVIr")**alpha - b * RMI **beta ))', {
        RMI: img.select(rmi),
        Kc_max: Kc_max,
        a: a, alpha: alpha,
        b: b, beta: beta
    }).rename(name);
}
// Kc with GVMI computed with SWIR2 (Kc2)
pkg.Kc2 = function (img) { return pkg.Kc(img, "RMI2") }

// Kc for Kamble (Kc_Kamble)
pkg.Kc_kamble = function (img) {
    // Table 3. Bretreger et al. (2020)
    return img.expression('Kc_kamble = a + b*NDVI', {
        NDVI: img.select('NDVI'),
        a: -0.086, b: 1.37
    }).max(ee.Image(0));
}

// Kc for Kamble (Kc_Kamble)
pkg.Kc_irrisat = function (img) {
    // Crop coefficient parameters, Table 3. Bretreger et al. (2020)
    return img.expression('Kc_irrisat = a + b*b("NDVI")', {
        a: -0.1725, b: 1.4571
    }).max(ee.Image(0));
}

/**
 * calculate Actual evapotranspiration (ETa) using Kc with SWIR1
 * @note In ERA (mm/d) negative values indicate evaporation hence multply by -1 Equation (9)
 */
pkg.ETa_swir1 = function (img, Kc) {
    Kc = Kc || "Kc"
    var name = Kc == "Kc" ? "ETa_swir1" : "ETa_swir2";
    return img.expression(
        'Kc * (PET*(-1)*1000*30.25) + KE * (P*1000)', {
        Kc: img.select(Kc),
        PET: img.select('potential_evaporation'),
        KE: img.select('KE'),
        P: img.select('total_precipitation'),
    }).rename(name);
}
// ETa using Kc with SWIR2 
pkg.ETa_swir2 = function  (img) { return pkg.ETa_swir1(img, "Kc2") };

// ETa using Kc with Kamble 
pkg.ETa_irrisat = function (img) {
    // Actual evapotranspiration
    // In ERA (mm/d) negative values indicate evaporation hence multply by -1
    return img.expression(
        'ETa_irrisat = Kc_irrisat * (PET*(-1)*1000*30.25)', {
        Kc_irrisat: img.select('Kc_irrisat'),
        PET: img.select('potential_evaporation'),
    });
}

// ETa using Kc with Kamble 
pkg.ETa_kamble = function (img) {
    // Actual evapotranspiration
    // In ERA (mm/d) negative values indicate evaporation hence multply by -1
    return img.expression(
        'ETa_kamble = Kc_Kamble * (PET*(-1)*1000*30.25)', {
        Kc_Kamble: img.select('Kc_kamble'),
        PET: img.select('potential_evaporation'),
    });
}

// Irrest using ETa with SWIR1
pkg.irrest_swir1 = function (img, ETa) {
    ETa = ETa || "ETa_swir1";
    var name = ETa == "ETa_swir1" ? "irrest_swir1" : "irrest_swir2";
    // Equation (2) in Bretreger et al (2020)
    return img.expression(
        'ETa - (P*1000)', {
        ETa: img.select(ETa),
        P: img.select('total_precipitation')
    }).rename(name)
    .max(ee.Image(0))
}
// Irrest using ETa with SWIR2
pkg.irrest_swir2 = function (img) { return pkg.irrest_swir1(img, "ETa_swir2") };

// Irrest using Kamble
pkg.irrest_kamble = function (img) {
    // Equation (2) in Bretreger et al (2020)
    return img.expression(
        'irrest_kamble = b("ETa_kamble") - (P*1000)', {
        P: img.select('total_precipitation'),
    }).max(ee.Image(0));
}

// Irrest using Irrisat
pkg.irrest_irrisat = function (img) {
    // Equation (2) in Bretreger et al (2020)
    return img.expression(
        'irrest_irrisat = b("ETa_irrisat") - (P*1000)', {
        P: img.select('total_precipitation'),
    }).max(ee.Image(0));
}

exports = pkg;
if (typeof module !== "undefined") module.exports = exports;
