/**
 * Copyright (c) 2021 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
// var pkgs = require('users/kongdd/pkg:pkgs.js');
var pkgs = {};

pkgs.rename_s2 = function (img) {
    var bands_qc = ['SCL', 'QA60'];
    var bands_old = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
    var bands_new = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'];
    var bands_all = bands_new.concat(bands_qc);

    var img_main = img.select(bands_old, bands_new).multiply(0.0001);
    return img.select(bands_qc).addBands([img_main])
        .select(bands_all);
};


/***
 * Copyright (c) 2018 Gennadii Donchyts. All rights reserved.
 * 
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size.
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time.    
 */
pkgs.mosaicByTime = function (images) {
    var TIME_FIELD = 'system:time_start';
    var distinct = images.distinct([TIME_FIELD]);

    var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
    var join = ee.Join.saveAll('matches');
    var results = join.apply(distinct, images, filter);

    // mosaic
    results = results.map(function (i) {
        var matchedImages = ee.ImageCollection.fromImages(i.get('matches'))
        var mosaic = matchedImages.sort('system:index').mosaic().set({ 
            'system:footprint': matchedImages.geometry() })
        return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
    });
    return ee.ImageCollection(results);
}

/***
 * Copyright (c) 2018 Gennadii Donchyts. All rights reserved.
 * 
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size.
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by Date. 
 */
pkgs.composeByDate = function (images, opt_reducer) {
    var reducer = opt_reducer || ee.Reducer.firstNonNull();
    images = images.map(function (i) {
        return i.set({ date: i.date().format('YYYY-MM-dd') });
    });
    var TIME_FIELD = 'date';
    var distinct = images.distinct([TIME_FIELD]);

    var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
    var join = ee.Join.saveAll('matches');
    var results = join.apply(distinct, images, filter);

    // compose
    var bandNames = ee.Image(images.first()).bandNames();
    results = results.map(function (i) {
        var mosaic = ee.ImageCollection.fromImages(i.get('matches'))
            .sort('system:index').reduce(reducer).rename(bandNames);
        return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
            .set('system:time_start', ee.Date(i.get(TIME_FIELD)).millis());
    });
    return ee.ImageCollection(results);
};

exports = pkgs;
// B2	Blue			10 meters		496.6nm(S2A) / 492.1nm(S2B)	0.0001
// B3	Green			10 meters		560nm(S2A) / 559nm(S2B)	0.0001
// B4	Red			10 meters		664.5nm(S2A) / 665nm(S2B)	0.0001
// B8	NIR			10 meters		835.1nm(S2A) / 833nm(S2B)	0.0001
// B11	SWIR 1			20 meters		1613.7nm(S2A) / 1610.4nm(S2B)	0.0001
// B12	SWIR 2			20 meters		2202.4nm(S2A) / 2185.7nm(S2B)	0.0001
// SCL	Scene Classification Map(The "No Data" value of 0 is masked out)	1	11	20 meters	0
// QA60 Bitmask	

// Name	Description	Min	Max	Resolution	Units	Wavelength	Scale
// B1	Aerosols			60 meters		443.9nm(S2A) / 442.3nm(S2B)	0.0001
// B2	Blue			10 meters		496.6nm(S2A) / 492.1nm(S2B)	0.0001
// B3	Green			10 meters		560nm(S2A) / 559nm(S2B)	0.0001
// B4	Red			10 meters		664.5nm(S2A) / 665nm(S2B)	0.0001
// B5	Red Edge 1			20 meters		703.9nm(S2A) / 703.8nm(S2B)	0.0001
// B6	Red Edge 2			20 meters		740.2nm(S2A) / 739.1nm(S2B)	0.0001
// B7	Red Edge 3			20 meters		782.5nm(S2A) / 779.7nm(S2B)	0.0001
// B8	NIR			10 meters		835.1nm(S2A) / 833nm(S2B)	0.0001
// B8A	Red Edge 4			20 meters		864.8nm(S2A) / 864nm(S2B)	0.0001
// B9	Water vapor			60 meters		945nm(S2A) / 943.2nm(S2B)	0.0001
// B11	SWIR 1			20 meters		1613.7nm(S2A) / 1610.4nm(S2B)	0.0001
// B12	SWIR 2			20 meters		2202.4nm(S2A) / 2185.7nm(S2B)	0.0001
// AOT	Aerosol Optical Thickness			10 meters			0.001
// WVP	Water Vapor Pressure.The height the water would occupy if the vapor were condensed into liquid and spread evenly across the column.			10 meters	cm		0.001
// SCL	Scene Classification Map(The "No Data" value of 0 is masked out)	1	11	20 meters			0
// TCI_R	True Color Image, Red channel			10 meters			0
// TCI_G	True Color Image, Green channel			10 meters			0
// TCI_B	True Color Image, Blue channel			10 meters			0
// MSK_CLDPRB	Cloud Probability Map(missing in some products)	0	100	20 meters			0
// MSK_SNWPRB	Snow Probability Map(missing in some products)	0	100	10 meters			0
// QA10	Always empty			10 meters			0
// QA20	Always empty			20 meters			0
// QA60	Cloud mask			60 meters			0
// QA60 Bitmask	
//     Bit 10: Opaque clouds
//         0: No opaque clouds
//         1: Opaque clouds present
//     Bit 11: Cirrus clouds
//         0: No cirrus clouds
//         1: Cirrus clouds present
