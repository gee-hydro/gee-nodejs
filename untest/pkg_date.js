/**
 * Copyright (c) 2019 Dongdong Kong. All rights reserved.
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */
var pkg_date = {};


// this function can't be removed.
pkg_date.merge_dict = function () {
  var ans = {};
  var obj;
  for (var i = 0; i < arguments.length; ++i) {
    obj = arguments[i];
    for (var j in obj) {
      ans[j] = obj[j];
    }
  }
  return ans;
};

pkg_date.seq = function (from, to, by) {
  by = by || 1;
  var res = [];
  for (var i = from; i <= to; i += by) { res.push(i); }
  return res;
};

pkg_date.seq_len = function (n) {
  return Array(n).join().split(',').map(function (e, i) { return i; });
};

pkg_date.seq_date = function (date_begin, date_end, by) {
  var day_secs = 86400000
  by = by * day_secs || day_secs;
  return ee.List.sequence(date_begin.millis(), date_end.millis(), by)
    .map(function (x) { return ee.Date(x); });
}

/**
 * get empty imgcol by `seq.Date()`
 * @param {*} date_begin 
 * @param {*} date_end 
 * @param {*} by 
 */
pkg_date.seq_date_imgcol = function (date_begin, date_end, by) {
  var dates = pkg_trend.seq_date(date_begin, date_end, by);
  /** blank ImgCol used to select the nearest Imgs */
  return dates.map(function (date) {
    return pkg_date.add_dn_date(ee.Image(0), date);
  });
}

// by: in day
pkg_date.seq_yeardate = function (year, by) {
  var date_begin = ee.Date.fromYMD(year, 1, 1);
  var date_end = ee.Date.fromYMD(year, 12, 31);

  var day_secs = 86400000; // milliseconds
  by = by * day_secs || day_secs;
  return ee.List.sequence(date_begin.millis(), date_end.millis(), by)
    .map(function (x) { return ee.Date(x); });
}

pkg_date.leapYear = function (year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
};

pkg_date.date_format = function (date) {
  return ee.Date(date).format('yyyy-MM-dd');
};

pkg_date.set_date = function (img) {
  return img.set('date', img.date().format('YYYY-MM-dd'));
}

pkg_date.min_date = function (x, y) {
  return ee.Date(ee.Algorithms.If(x.millis().gt(y.millis()), y, x));
};

pkg_date.max_date = function (x, y) {
  return ee.Date(ee.Algorithms.If(x.millis().gt(y.millis()), x, y));
};

pkg_date.mday = function (date) {
  date = ee.Date(date);
  // var date = ee.Date(img.get('system:time_start'));
  var year = date.get("year");
  var month = date.get("month");
  var monthDateBegin = ee.Date.fromYMD(year, month, 1);
  return monthDateBegin.advance(1, 'month').advance(-1, 'day').get('day');
};

pkg_date.yday = function (date) {
  date = ee.Date(date);
  // var date = ee.Date(img.get('system:time_start'));
  var year = date.get("year");
  // var month = date.get("month");
  var date_begin = ee.Date.fromYMD(year, 1, 1);
  var date_end = ee.Date.fromYMD(year.add(1), 1, 1);
  return date_end.difference(date_begin, 'day');
};

pkg_date.days_in_month = pkg_date.mday;
pkg_date.days_in_year = pkg_date.yday;

/** parse `2020-02` to `2020-01-09` */
pkg_date.dndate_start = function (year, di, dn) {
  dn = dn || 8;
  var doy = ee.Number(di).subtract(1).multiply(dn).add(1);
  var date = ee.Number(year).format('%d').cat(doy.format('%03d'));
  return ee.Date.parse('YYYYDDD', date);
}

// add the date_end of dn
pkg_date.dndate_end = function (date_start, dn) {
  dn = dn || 8;
  var year = date_start.get("year");
  // var month = date.get("month");
  // var date_begin = date;
  var date_max = ee.Date.fromYMD(year, 12, 31);
  var date_end = date_start.advance(dn - 1, "day");
  return pkg_date.min_date(date_end, date_max);
};

// untest function
pkg_date.YearDn2date = function (x, n) {
  x = ee.String(x);
  n = n || 8;
  // var year = ee.Number.parse(x.slice(0,4));
  var i = ee.Number.parse(x.slice(5, 7));
  var doy = i.subtract(1).multiply(n).add(1);
  var datestr = x.slice(0, 5).cat(doy);
  return ee.Date.parse('Y-D', datestr);
};

pkg_date.time_end = function (img, dn) {
  dn = dn || 8;
  var date = ee.Date(img.get('system:time_start'));
  var date_end = pkg_date.dndate_end(date, dn);
  return img.set('system:time_end', date_end.millis());
};

pkg_date.days_of_coverage = function (img, dn) {
  var date = ee.Date(img.get('system:time_start'));
  var date_end = pkg_date.dndate_end(date, dn);
  var days = date_end.difference(date, "day").add(1);
  return img.set("days_coverage", days);
};

/**
 * Add season, year, month, yearmonth, year-ingrow, ingrow,
 * 
 * add seasonal variables into img before regression
 * @param {[type]} img [description]
 * @param {boolean} pheno If true, 4-10 as growing season, spring:4-5, summer: 6-8, autumn:9-10
 *                        If false, just as traditional seasons.
 */
pkg_date.addSeasonProb = function (img, pheno) {
  if (pheno === undefined) { pheno = false; }
  var date = ee.Date(img.get('system:time_start'));
  var month = date.get('month');
  var year = date.get('year');
  var season;
  // year.subtract(1).multiply(10).add(4)
  var ingrow = ee.Algorithms.If(month.gte(4).and(month.lte(10)), "true", "false");

  if (pheno) {
    /** 4-10 as growing season */
    season = ee.Algorithms.If(month.lte(3), ee.String(year.subtract(1)).cat("_winter"), season);
    season = ee.Algorithms.If(month.gte(4).and(month.lte(5)), ee.String(year).cat("_spring"), season);
    season = ee.Algorithms.If(month.gte(6).and(month.lte(8)), ee.String(year).cat("_summer"), season);
    season = ee.Algorithms.If(month.gte(9).and(month.lte(10)), ee.String(year).cat("_autumn"), season);
    season = ee.Algorithms.If(month.gte(11), ee.String(year).cat("_winter"), season);
  } else {
    /**traditional seasons*/
    season = ee.Algorithms.If(month.lte(2), ee.String(year.subtract(1)).cat("_winter"), season);
    season = ee.Algorithms.If(month.gte(3).and(month.lte(5)), ee.String(year).cat("_spring"), season);
    season = ee.Algorithms.If(month.gte(6).and(month.lte(8)), ee.String(year).cat("_summer"), season);
    season = ee.Algorithms.If(month.gte(9).and(month.lte(11)), ee.String(year).cat("_autumn"), season);
    season = ee.Algorithms.If(month.gte(12), ee.String(year).cat("_winter"), season);
  }

  return img.set('season', season)
    .set('ingrow', ingrow)
    .set('year-ingrow', year.format().cat('-').cat(ingrow))
    .set('date', date.format('yyyy-MM-dd'))
    .set('year', date.format("YYYY"))
    .set('month', date.format('MM'))
    .set('yearmonth', date.format('YYYY-MM')); //seasons.get(month.subtract(1))
}

pkg_date.addDate = pkg_date.addSeasonProb;

/** add dn prop to every img */
pkg_date.add_dn_date = function (img, beginDate, IncludeYear, dn) {
  beginDate = beginDate || img.get('system:time_start');
  if (IncludeYear === undefined) { IncludeYear = true; }
  dn = dn || 8;

  beginDate = ee.Date(beginDate);
  // var month = beginDate.get('month');
  var year = beginDate.get('year');
  var yearstr = year.format('%d'); //ee.String(year);

  var diff = beginDate.difference(ee.Date.fromYMD(year, 1, 1), 'day').add(1);
  var di = diff.subtract(1).divide(dn).floor().add(1).int();
  var dndate = pkg_date.dndate_start(year, di, dn).format('yyyy-MM-dd');
  di = di.format('%02d'); //ee.String(di);
  di = ee.Algorithms.If(IncludeYear, yearstr.cat("-").cat(di), di);

  return ee.Image(img)
    .set('system:time_start', beginDate.millis())
    // .set('system:time_end', beginDate.advance(1, 'day').millis())
    .set('date', beginDate.format('yyyy-MM-dd')) // system:id
    .set('year', yearstr)
    .set('month', beginDate.format('MM'))
    .set('yearmonth', beginDate.format('YYYY-MM'))
    .set('dndate', dndate) // string
    .set('dn', di); //add dn for aggregated into 8days
}

/**
 * return a function used to add dn property
 * @param {boolean} IncludeYear [description]
 */
pkg_date.add_dn = function (IncludeYear, n) {
  if (typeof IncludeYear === 'undefined') { IncludeYear = true; }
  if (typeof n === 'undefined') { n = 8; }
  return function (img) {
    return pkg_date.add_dn_date(img, img.get('system:time_start'), IncludeYear, n);
  };
}

pkg_date.imgcol_addSeasonProb = function (imgcol) {
  return imgcol.map(function (img) { return pkg_date.addSeasonProb(img, false); });
}

pkg_date.imgcol_last = function (imgcol, n) {
  n = n || 1;
  // ee.Image(imgcol_grace.reduce(ee.Reducer.last())); properties are missing
  var res = imgcol.toList(n, imgcol.size().subtract(n));
  if (n <= 1) { res = ee.Image(res.get(0)); }
  return res;
}

/**
 * overlaped days
 * 
 * @param {*} period1 [date_begin, date_end]
 * @param {*} period2 [monthDate_begin, monthDate_end]
 */
pkg_date.overlap_days = function (period1, period2) {
  var date_begin = pkg_date.max_date(period1[0], period2[0]);
  var date_end = pkg_date.min_date(period1[1], period2[1]);
  return date_end.difference(date_begin, "day").add(1); // days
};

pkg_date.overlapDaysInMonth = function (img, period2, dn) {
  var date = ee.Date(img.get('system:time_start'));
  var year = date.get("year");

  var date_end = pkg_date.dndate_end(date, dn);
  var period1 = [date, date_end];
  // var period2 = [ee.Date.fromYMD(year, month, 1),
  //     ee.Date.fromYMD(year, month, days_in_month(date))];
  return img.set("overlap_days", pkg_date.overlap_days(period1, period2))
    .set('date_start', pkg_date.date_format(date))
    .set('date_end', pkg_date.date_format(date_end))
    .set('date_end_org', ee.Date(img.get('system:time_end')));
};

/**
 * aggregate dn (e.g. 8-day) to monthly
 * 
 * @param {*} imgcol 
 * @param {*} year_begin 
 * @param {*} year_end 
 * @param {*} scale_factor 
 * @param {*} dn 
 * 
 * @returns
 * - `bandName`      : sum of overlaped day
 * - `days_coverage` : days of overlaped 
 * - `bandNamesum`   : ET / ETsum * days_in_month
 */
pkg_date.dn2mon = function (imgcol, year_begin, year_end, scale_factor, dn, toyearly) {
  // if (toyearly === undefined || toyearly == null) toyearly = false;
  dn = dn || 8;
  year_end = year_end || year_begin;
  scale_factor = scale_factor || 1;
  // in the debug mode
  var years = pkg_date.seq(year_begin, year_end);
  var months = pkg_date.seq(1, 12);
  var first = imgcol.first();
  var bands = first.bandNames();
  // var bandnew = ee.String(first.select(0).bandNames().get(0)).cat("sum");

  var res = years.map(function (year) {
    var imgcol_year = imgcol.filter(ee.Filter.calendarRange(year, year, "year"));
    return months.map(function (month) {
      var dateMonth_begin = ee.Date.fromYMD(year, month, 1);
      var days_month = pkg_date.days_in_month(dateMonth_begin);
      var dateMonth_end = ee.Date.fromYMD(year, month, days_month);
      var period2 = [dateMonth_begin, dateMonth_end];

      // print(dateMonth_begin, days_in_month(dateMonth_begin), dateMonth_end);
      // var filter = ee.Filter.calendarRange(month, month, "month");
      var filter = ee.Filter.and(
        ee.Filter.lte("system:time_start", dateMonth_end.millis()),
        ee.Filter.gte("system:time_end", dateMonth_begin.millis()));

      var imgcoli = imgcol_year.filter(filter);
      imgcoli = imgcoli.map(function (img) {
        img = pkg_date.overlapDaysInMonth(img, period2, dn);
        var days = img.select(0).mask().multiply(ee.Number(img.get("overlap_days")))
          .rename('days_coverage').toInt();
        return ee.Image(img).toFloat()
          .multiply(days.multiply(scale_factor))
          .addBands(days)
          .copyProperties(img, img.propertyNames());
      });

      var img = imgcoli.sum();
      var days_coverage = img.select('days_coverage');
      var img_sum = img.select(bands)
        .divide(days_coverage).multiply(days_month)
        .addBands(days_coverage)
        .set('system:time_start', dateMonth_begin.millis())
        .set('system:time_end', dateMonth_end.millis())
        .set('date_start', pkg_date.date_format(dateMonth_begin))
        .set('date_end', pkg_date.date_format(dateMonth_end))
        .set('system:id', pkg_date.date_format(dateMonth_begin)); //;
      return img_sum;
    });
  });
  if (toyearly) {
    res = ee.ImageCollection(res.map(function (imgcol) {
      imgcol = ee.ImageCollection(imgcol);
      var first = imgcol.first();
      return imgcol.mean().multiply(12)
        .copyProperties(first, ['date_start', 'system:time_start'])
        .set('system:id', first.get('system:id'));
    }));
  } else {
    res = ee.ImageCollection(ee.List(res).flatten());
  }
  return res;
};

pkg_date.dn2year = function (imgcol, year_begin, year_end, scale_factor, dn) {
  dn = dn || 8;
  year_end = year_end || year_begin;
  scale_factor = scale_factor || 1;
  // in the debug mode
  var years = pkg_date.seq(year_begin, year_end);
  var bandnew = ee.String(imgcol.first().select(0).bandNames().get(0)).cat("sum")

  var res = years.map(function (year) {
    var imgcoli = imgcol.filter(ee.Filter.calendarRange(year, year, "year"));

    imgcoli = imgcoli.map(function (img) {
      img = pkg_date.days_of_coverage(img, dn);
      var days = ee.Number(img.get("days_coverage"));
      days = img.mask().multiply(days).rename('days_coverage');
      return ee.Image(img).toFloat()
        .multiply(days.multiply(scale_factor))
        .addBands(days)
        .copyProperties(img, img.propertyNames());
    });

    var date = ee.Date.fromYMD(year, 1, 1);
    var date_end = ee.Date.fromYMD(year, 12, 31);
    var img = imgcoli.sum()
      .set('system:time_start', date.millis())
      .set('system:time_end', date_end.millis())
      .set('date_start', pkg_date.date_format(date))
      .set('date_end', pkg_date.date_format(date_end))
      .set('system:id', pkg_date.date_format(date)); // 
    var img_sum = img.expression("b(0)/b('days_coverage') * days",
      { days: pkg_date.leapYear(year) + 365 }).rename(bandnew);
    return img.addBands(img_sum);
  });
  return ee.ImageCollection(ee.List(res).flatten());
};

exports = pkg_date;
