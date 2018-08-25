define("./update.js",['exports'], function (exports) { 'use strict';

  /**
   * @category Common Helpers
   * @summary Is the given argument an instance of Date?
   *
   * @description
   * Is the given argument an instance of Date?
   *
   * @param {*} argument - the argument to check
   * @returns {Boolean} the given argument is an instance of Date
   *
   * @example
   * // Is 'mayonnaise' a Date?
   * var result = isDate('mayonnaise')
   * //=> false
   */
  function isDate (argument) {
    return argument instanceof Date
  }

  var is_date = isDate;

  var MILLISECONDS_IN_HOUR = 3600000;
  var MILLISECONDS_IN_MINUTE = 60000;
  var DEFAULT_ADDITIONAL_DIGITS = 2;

  var parseTokenDateTimeDelimeter = /[T ]/;
  var parseTokenPlainTime = /:/;

  // year tokens
  var parseTokenYY = /^(\d{2})$/;
  var parseTokensYYY = [
    /^([+-]\d{2})$/, // 0 additional digits
    /^([+-]\d{3})$/, // 1 additional digit
    /^([+-]\d{4})$/ // 2 additional digits
  ];

  var parseTokenYYYY = /^(\d{4})/;
  var parseTokensYYYYY = [
    /^([+-]\d{4})/, // 0 additional digits
    /^([+-]\d{5})/, // 1 additional digit
    /^([+-]\d{6})/ // 2 additional digits
  ];

  // date tokens
  var parseTokenMM = /^-(\d{2})$/;
  var parseTokenDDD = /^-?(\d{3})$/;
  var parseTokenMMDD = /^-?(\d{2})-?(\d{2})$/;
  var parseTokenWww = /^-?W(\d{2})$/;
  var parseTokenWwwD = /^-?W(\d{2})-?(\d{1})$/;

  // time tokens
  var parseTokenHH = /^(\d{2}([.,]\d*)?)$/;
  var parseTokenHHMM = /^(\d{2}):?(\d{2}([.,]\d*)?)$/;
  var parseTokenHHMMSS = /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/;

  // timezone tokens
  var parseTokenTimezone = /([Z+-].*)$/;
  var parseTokenTimezoneZ = /^(Z)$/;
  var parseTokenTimezoneHH = /^([+-])(\d{2})$/;
  var parseTokenTimezoneHHMM = /^([+-])(\d{2}):?(\d{2})$/;

  /**
   * @category Common Helpers
   * @summary Convert the given argument to an instance of Date.
   *
   * @description
   * Convert the given argument to an instance of Date.
   *
   * If the argument is an instance of Date, the function returns its clone.
   *
   * If the argument is a number, it is treated as a timestamp.
   *
   * If an argument is a string, the function tries to parse it.
   * Function accepts complete ISO 8601 formats as well as partial implementations.
   * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
   *
   * If all above fails, the function passes the given argument to Date constructor.
   *
   * @param {Date|String|Number} argument - the value to convert
   * @param {Object} [options] - the object with options
   * @param {0 | 1 | 2} [options.additionalDigits=2] - the additional number of digits in the extended year format
   * @returns {Date} the parsed date in the local time zone
   *
   * @example
   * // Convert string '2014-02-11T11:30:30' to date:
   * var result = parse('2014-02-11T11:30:30')
   * //=> Tue Feb 11 2014 11:30:30
   *
   * @example
   * // Parse string '+02014101',
   * // if the additional number of digits in the extended year format is 1:
   * var result = parse('+02014101', {additionalDigits: 1})
   * //=> Fri Apr 11 2014 00:00:00
   */
  function parse (argument, dirtyOptions) {
    if (is_date(argument)) {
      // Prevent the date to lose the milliseconds when passed to new Date() in IE10
      return new Date(argument.getTime())
    } else if (typeof argument !== 'string') {
      return new Date(argument)
    }

    var options = dirtyOptions || {};
    var additionalDigits = options.additionalDigits;
    if (additionalDigits == null) {
      additionalDigits = DEFAULT_ADDITIONAL_DIGITS;
    } else {
      additionalDigits = Number(additionalDigits);
    }

    var dateStrings = splitDateString(argument);

    var parseYearResult = parseYear(dateStrings.date, additionalDigits);
    var year = parseYearResult.year;
    var restDateString = parseYearResult.restDateString;

    var date = parseDate(restDateString, year);

    if (date) {
      var timestamp = date.getTime();
      var time = 0;
      var offset;

      if (dateStrings.time) {
        time = parseTime(dateStrings.time);
      }

      if (dateStrings.timezone) {
        offset = parseTimezone(dateStrings.timezone);
      } else {
        // get offset accurate to hour in timezones that change offset
        offset = new Date(timestamp + time).getTimezoneOffset();
        offset = new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE).getTimezoneOffset();
      }

      return new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE)
    } else {
      return new Date(argument)
    }
  }

  function splitDateString (dateString) {
    var dateStrings = {};
    var array = dateString.split(parseTokenDateTimeDelimeter);
    var timeString;

    if (parseTokenPlainTime.test(array[0])) {
      dateStrings.date = null;
      timeString = array[0];
    } else {
      dateStrings.date = array[0];
      timeString = array[1];
    }

    if (timeString) {
      var token = parseTokenTimezone.exec(timeString);
      if (token) {
        dateStrings.time = timeString.replace(token[1], '');
        dateStrings.timezone = token[1];
      } else {
        dateStrings.time = timeString;
      }
    }

    return dateStrings
  }

  function parseYear (dateString, additionalDigits) {
    var parseTokenYYY = parseTokensYYY[additionalDigits];
    var parseTokenYYYYY = parseTokensYYYYY[additionalDigits];

    var token;

    // YYYY or ±YYYYY
    token = parseTokenYYYY.exec(dateString) || parseTokenYYYYY.exec(dateString);
    if (token) {
      var yearString = token[1];
      return {
        year: parseInt(yearString, 10),
        restDateString: dateString.slice(yearString.length)
      }
    }

    // YY or ±YYY
    token = parseTokenYY.exec(dateString) || parseTokenYYY.exec(dateString);
    if (token) {
      var centuryString = token[1];
      return {
        year: parseInt(centuryString, 10) * 100,
        restDateString: dateString.slice(centuryString.length)
      }
    }

    // Invalid ISO-formatted year
    return {
      year: null
    }
  }

  function parseDate (dateString, year) {
    // Invalid ISO-formatted year
    if (year === null) {
      return null
    }

    var token;
    var date;
    var month;
    var week;

    // YYYY
    if (dateString.length === 0) {
      date = new Date(0);
      date.setUTCFullYear(year);
      return date
    }

    // YYYY-MM
    token = parseTokenMM.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;
      date.setUTCFullYear(year, month);
      return date
    }

    // YYYY-DDD or YYYYDDD
    token = parseTokenDDD.exec(dateString);
    if (token) {
      date = new Date(0);
      var dayOfYear = parseInt(token[1], 10);
      date.setUTCFullYear(year, 0, dayOfYear);
      return date
    }

    // YYYY-MM-DD or YYYYMMDD
    token = parseTokenMMDD.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;
      var day = parseInt(token[2], 10);
      date.setUTCFullYear(year, month, day);
      return date
    }

    // YYYY-Www or YYYYWww
    token = parseTokenWww.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;
      return dayOfISOYear(year, week)
    }

    // YYYY-Www-D or YYYYWwwD
    token = parseTokenWwwD.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;
      var dayOfWeek = parseInt(token[2], 10) - 1;
      return dayOfISOYear(year, week, dayOfWeek)
    }

    // Invalid ISO-formatted date
    return null
  }

  function parseTime (timeString) {
    var token;
    var hours;
    var minutes;

    // hh
    token = parseTokenHH.exec(timeString);
    if (token) {
      hours = parseFloat(token[1].replace(',', '.'));
      return (hours % 24) * MILLISECONDS_IN_HOUR
    }

    // hh:mm or hhmm
    token = parseTokenHHMM.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseFloat(token[2].replace(',', '.'));
      return (hours % 24) * MILLISECONDS_IN_HOUR +
        minutes * MILLISECONDS_IN_MINUTE
    }

    // hh:mm:ss or hhmmss
    token = parseTokenHHMMSS.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseInt(token[2], 10);
      var seconds = parseFloat(token[3].replace(',', '.'));
      return (hours % 24) * MILLISECONDS_IN_HOUR +
        minutes * MILLISECONDS_IN_MINUTE +
        seconds * 1000
    }

    // Invalid ISO-formatted time
    return null
  }

  function parseTimezone (timezoneString) {
    var token;
    var absoluteOffset;

    // Z
    token = parseTokenTimezoneZ.exec(timezoneString);
    if (token) {
      return 0
    }

    // ±hh
    token = parseTokenTimezoneHH.exec(timezoneString);
    if (token) {
      absoluteOffset = parseInt(token[2], 10) * 60;
      return (token[1] === '+') ? -absoluteOffset : absoluteOffset
    }

    // ±hh:mm or ±hhmm
    token = parseTokenTimezoneHHMM.exec(timezoneString);
    if (token) {
      absoluteOffset = parseInt(token[2], 10) * 60 + parseInt(token[3], 10);
      return (token[1] === '+') ? -absoluteOffset : absoluteOffset
    }

    return 0
  }

  function dayOfISOYear (isoYear, week, day) {
    week = week || 0;
    day = day || 0;
    var date = new Date(0);
    date.setUTCFullYear(isoYear, 0, 4);
    var fourthOfJanuaryDay = date.getUTCDay() || 7;
    var diff = week * 7 + day + 1 - fourthOfJanuaryDay;
    date.setUTCDate(date.getUTCDate() + diff);
    return date
  }

  var parse_1 = parse;

  /**
   * @category Year Helpers
   * @summary Return the start of a year for the given date.
   *
   * @description
   * Return the start of a year for the given date.
   * The result will be in the local timezone.
   *
   * @param {Date|String|Number} date - the original date
   * @returns {Date} the start of a year
   *
   * @example
   * // The start of a year for 2 September 2014 11:55:00:
   * var result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
   * //=> Wed Jan 01 2014 00:00:00
   */
  function startOfYear (dirtyDate) {
    var cleanDate = parse_1(dirtyDate);
    var date = new Date(0);
    date.setFullYear(cleanDate.getFullYear(), 0, 1);
    date.setHours(0, 0, 0, 0);
    return date
  }

  var start_of_year = startOfYear;

  /**
   * @category Day Helpers
   * @summary Return the start of a day for the given date.
   *
   * @description
   * Return the start of a day for the given date.
   * The result will be in the local timezone.
   *
   * @param {Date|String|Number} date - the original date
   * @returns {Date} the start of a day
   *
   * @example
   * // The start of a day for 2 September 2014 11:55:00:
   * var result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Tue Sep 02 2014 00:00:00
   */
  function startOfDay (dirtyDate) {
    var date = parse_1(dirtyDate);
    date.setHours(0, 0, 0, 0);
    return date
  }

  var start_of_day = startOfDay;

  var MILLISECONDS_IN_MINUTE$1 = 60000;
  var MILLISECONDS_IN_DAY = 86400000;

  /**
   * @category Day Helpers
   * @summary Get the number of calendar days between the given dates.
   *
   * @description
   * Get the number of calendar days between the given dates.
   *
   * @param {Date|String|Number} dateLeft - the later date
   * @param {Date|String|Number} dateRight - the earlier date
   * @returns {Number} the number of calendar days
   *
   * @example
   * // How many calendar days are between
   * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
   * var result = differenceInCalendarDays(
   *   new Date(2012, 6, 2, 0, 0),
   *   new Date(2011, 6, 2, 23, 0)
   * )
   * //=> 366
   */
  function differenceInCalendarDays (dirtyDateLeft, dirtyDateRight) {
    var startOfDayLeft = start_of_day(dirtyDateLeft);
    var startOfDayRight = start_of_day(dirtyDateRight);

    var timestampLeft = startOfDayLeft.getTime() -
      startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE$1;
    var timestampRight = startOfDayRight.getTime() -
      startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE$1;

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a day is not constant
    // (e.g. it's different in the day of the daylight saving time clock shift)
    return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY)
  }

  var difference_in_calendar_days = differenceInCalendarDays;

  /**
   * @category Day Helpers
   * @summary Get the day of the year of the given date.
   *
   * @description
   * Get the day of the year of the given date.
   *
   * @param {Date|String|Number} date - the given date
   * @returns {Number} the day of year
   *
   * @example
   * // Which day of the year is 2 July 2014?
   * var result = getDayOfYear(new Date(2014, 6, 2))
   * //=> 183
   */
  function getDayOfYear (dirtyDate) {
    var date = parse_1(dirtyDate);
    var diff = difference_in_calendar_days(date, start_of_year(date));
    var dayOfYear = diff + 1;
    return dayOfYear
  }

  var get_day_of_year = getDayOfYear;

  /**
   * @category Week Helpers
   * @summary Return the start of a week for the given date.
   *
   * @description
   * Return the start of a week for the given date.
   * The result will be in the local timezone.
   *
   * @param {Date|String|Number} date - the original date
   * @param {Object} [options] - the object with options
   * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
   * @returns {Date} the start of a week
   *
   * @example
   * // The start of a week for 2 September 2014 11:55:00:
   * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Sun Aug 31 2014 00:00:00
   *
   * @example
   * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
   * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), {weekStartsOn: 1})
   * //=> Mon Sep 01 2014 00:00:00
   */
  function startOfWeek (dirtyDate, dirtyOptions) {
    var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0;

    var date = parse_1(dirtyDate);
    var day = date.getDay();
    var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date
  }

  var start_of_week = startOfWeek;

  /**
   * @category ISO Week Helpers
   * @summary Return the start of an ISO week for the given date.
   *
   * @description
   * Return the start of an ISO week for the given date.
   * The result will be in the local timezone.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param {Date|String|Number} date - the original date
   * @returns {Date} the start of an ISO week
   *
   * @example
   * // The start of an ISO week for 2 September 2014 11:55:00:
   * var result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Mon Sep 01 2014 00:00:00
   */
  function startOfISOWeek (dirtyDate) {
    return start_of_week(dirtyDate, {weekStartsOn: 1})
  }

  var start_of_iso_week = startOfISOWeek;

  /**
   * @category ISO Week-Numbering Year Helpers
   * @summary Get the ISO week-numbering year of the given date.
   *
   * @description
   * Get the ISO week-numbering year of the given date,
   * which always starts 3 days before the year's first Thursday.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param {Date|String|Number} date - the given date
   * @returns {Number} the ISO week-numbering year
   *
   * @example
   * // Which ISO-week numbering year is 2 January 2005?
   * var result = getISOYear(new Date(2005, 0, 2))
   * //=> 2004
   */
  function getISOYear (dirtyDate) {
    var date = parse_1(dirtyDate);
    var year = date.getFullYear();

    var fourthOfJanuaryOfNextYear = new Date(0);
    fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
    fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
    var startOfNextYear = start_of_iso_week(fourthOfJanuaryOfNextYear);

    var fourthOfJanuaryOfThisYear = new Date(0);
    fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
    fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
    var startOfThisYear = start_of_iso_week(fourthOfJanuaryOfThisYear);

    if (date.getTime() >= startOfNextYear.getTime()) {
      return year + 1
    } else if (date.getTime() >= startOfThisYear.getTime()) {
      return year
    } else {
      return year - 1
    }
  }

  var get_iso_year = getISOYear;

  /**
   * @category ISO Week-Numbering Year Helpers
   * @summary Return the start of an ISO week-numbering year for the given date.
   *
   * @description
   * Return the start of an ISO week-numbering year,
   * which always starts 3 days before the year's first Thursday.
   * The result will be in the local timezone.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param {Date|String|Number} date - the original date
   * @returns {Date} the start of an ISO year
   *
   * @example
   * // The start of an ISO week-numbering year for 2 July 2005:
   * var result = startOfISOYear(new Date(2005, 6, 2))
   * //=> Mon Jan 03 2005 00:00:00
   */
  function startOfISOYear (dirtyDate) {
    var year = get_iso_year(dirtyDate);
    var fourthOfJanuary = new Date(0);
    fourthOfJanuary.setFullYear(year, 0, 4);
    fourthOfJanuary.setHours(0, 0, 0, 0);
    var date = start_of_iso_week(fourthOfJanuary);
    return date
  }

  var start_of_iso_year = startOfISOYear;

  var MILLISECONDS_IN_WEEK = 604800000;

  /**
   * @category ISO Week Helpers
   * @summary Get the ISO week of the given date.
   *
   * @description
   * Get the ISO week of the given date.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param {Date|String|Number} date - the given date
   * @returns {Number} the ISO week
   *
   * @example
   * // Which week of the ISO-week numbering year is 2 January 2005?
   * var result = getISOWeek(new Date(2005, 0, 2))
   * //=> 53
   */
  function getISOWeek (dirtyDate) {
    var date = parse_1(dirtyDate);
    var diff = start_of_iso_week(date).getTime() - start_of_iso_year(date).getTime();

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a week is not constant
    // (e.g. it's different in the week of the daylight saving time clock shift)
    return Math.round(diff / MILLISECONDS_IN_WEEK) + 1
  }

  var get_iso_week = getISOWeek;

  /**
   * @category Common Helpers
   * @summary Is the given date valid?
   *
   * @description
   * Returns false if argument is Invalid Date and true otherwise.
   * Invalid Date is a Date, whose time value is NaN.
   *
   * Time value of Date: http://es5.github.io/#x15.9.1.1
   *
   * @param {Date} date - the date to check
   * @returns {Boolean} the date is valid
   * @throws {TypeError} argument must be an instance of Date
   *
   * @example
   * // For the valid date:
   * var result = isValid(new Date(2014, 1, 31))
   * //=> true
   *
   * @example
   * // For the invalid date:
   * var result = isValid(new Date(''))
   * //=> false
   */
  function isValid (dirtyDate) {
    if (is_date(dirtyDate)) {
      return !isNaN(dirtyDate)
    } else {
      throw new TypeError(toString.call(dirtyDate) + ' is not an instance of Date')
    }
  }

  var is_valid = isValid;

  function buildDistanceInWordsLocale () {
    var distanceInWordsLocale = {
      lessThanXSeconds: {
        one: 'less than a second',
        other: 'less than {{count}} seconds'
      },

      xSeconds: {
        one: '1 second',
        other: '{{count}} seconds'
      },

      halfAMinute: 'half a minute',

      lessThanXMinutes: {
        one: 'less than a minute',
        other: 'less than {{count}} minutes'
      },

      xMinutes: {
        one: '1 minute',
        other: '{{count}} minutes'
      },

      aboutXHours: {
        one: 'about 1 hour',
        other: 'about {{count}} hours'
      },

      xHours: {
        one: '1 hour',
        other: '{{count}} hours'
      },

      xDays: {
        one: '1 day',
        other: '{{count}} days'
      },

      aboutXMonths: {
        one: 'about 1 month',
        other: 'about {{count}} months'
      },

      xMonths: {
        one: '1 month',
        other: '{{count}} months'
      },

      aboutXYears: {
        one: 'about 1 year',
        other: 'about {{count}} years'
      },

      xYears: {
        one: '1 year',
        other: '{{count}} years'
      },

      overXYears: {
        one: 'over 1 year',
        other: 'over {{count}} years'
      },

      almostXYears: {
        one: 'almost 1 year',
        other: 'almost {{count}} years'
      }
    };

    function localize (token, count, options) {
      options = options || {};

      var result;
      if (typeof distanceInWordsLocale[token] === 'string') {
        result = distanceInWordsLocale[token];
      } else if (count === 1) {
        result = distanceInWordsLocale[token].one;
      } else {
        result = distanceInWordsLocale[token].other.replace('{{count}}', count);
      }

      if (options.addSuffix) {
        if (options.comparison > 0) {
          return 'in ' + result
        } else {
          return result + ' ago'
        }
      }

      return result
    }

    return {
      localize: localize
    }
  }

  var build_distance_in_words_locale = buildDistanceInWordsLocale;

  var commonFormatterKeys = [
    'M', 'MM', 'Q', 'D', 'DD', 'DDD', 'DDDD', 'd',
    'E', 'W', 'WW', 'YY', 'YYYY', 'GG', 'GGGG',
    'H', 'HH', 'h', 'hh', 'm', 'mm',
    's', 'ss', 'S', 'SS', 'SSS',
    'Z', 'ZZ', 'X', 'x'
  ];

  function buildFormattingTokensRegExp (formatters) {
    var formatterKeys = [];
    for (var key in formatters) {
      if (formatters.hasOwnProperty(key)) {
        formatterKeys.push(key);
      }
    }

    var formattingTokens = commonFormatterKeys
      .concat(formatterKeys)
      .sort()
      .reverse();
    var formattingTokensRegExp = new RegExp(
      '(\\[[^\\[]*\\])|(\\\\)?' + '(' + formattingTokens.join('|') + '|.)', 'g'
    );

    return formattingTokensRegExp
  }

  var build_formatting_tokens_reg_exp = buildFormattingTokensRegExp;

  function buildFormatLocale () {
    // Note: in English, the names of days of the week and months are capitalized.
    // If you are making a new locale based on this one, check if the same is true for the language you're working on.
    // Generally, formatted dates should look like they are in the middle of a sentence,
    // e.g. in Spanish language the weekdays and months should be in the lowercase.
    var months3char = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var weekdays2char = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    var weekdays3char = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var meridiemUppercase = ['AM', 'PM'];
    var meridiemLowercase = ['am', 'pm'];
    var meridiemFull = ['a.m.', 'p.m.'];

    var formatters = {
      // Month: Jan, Feb, ..., Dec
      'MMM': function (date) {
        return months3char[date.getMonth()]
      },

      // Month: January, February, ..., December
      'MMMM': function (date) {
        return monthsFull[date.getMonth()]
      },

      // Day of week: Su, Mo, ..., Sa
      'dd': function (date) {
        return weekdays2char[date.getDay()]
      },

      // Day of week: Sun, Mon, ..., Sat
      'ddd': function (date) {
        return weekdays3char[date.getDay()]
      },

      // Day of week: Sunday, Monday, ..., Saturday
      'dddd': function (date) {
        return weekdaysFull[date.getDay()]
      },

      // AM, PM
      'A': function (date) {
        return (date.getHours() / 12) >= 1 ? meridiemUppercase[1] : meridiemUppercase[0]
      },

      // am, pm
      'a': function (date) {
        return (date.getHours() / 12) >= 1 ? meridiemLowercase[1] : meridiemLowercase[0]
      },

      // a.m., p.m.
      'aa': function (date) {
        return (date.getHours() / 12) >= 1 ? meridiemFull[1] : meridiemFull[0]
      }
    };

    // Generate ordinal version of formatters: M -> Mo, D -> Do, etc.
    var ordinalFormatters = ['M', 'D', 'DDD', 'd', 'Q', 'W'];
    ordinalFormatters.forEach(function (formatterToken) {
      formatters[formatterToken + 'o'] = function (date, formatters) {
        return ordinal(formatters[formatterToken](date))
      };
    });

    return {
      formatters: formatters,
      formattingTokensRegExp: build_formatting_tokens_reg_exp(formatters)
    }
  }

  function ordinal (number) {
    var rem100 = number % 100;
    if (rem100 > 20 || rem100 < 10) {
      switch (rem100 % 10) {
        case 1:
          return number + 'st'
        case 2:
          return number + 'nd'
        case 3:
          return number + 'rd'
      }
    }
    return number + 'th'
  }

  var build_format_locale = buildFormatLocale;

  /**
   * @category Locales
   * @summary English locale.
   */
  var en = {
    distanceInWords: build_distance_in_words_locale(),
    format: build_format_locale()
  };

  /**
   * @category Common Helpers
   * @summary Format the date.
   *
   * @description
   * Return the formatted date string in the given format.
   *
   * Accepted tokens:
   * | Unit                    | Token | Result examples                  |
   * |-------------------------|-------|----------------------------------|
   * | Month                   | M     | 1, 2, ..., 12                    |
   * |                         | Mo    | 1st, 2nd, ..., 12th              |
   * |                         | MM    | 01, 02, ..., 12                  |
   * |                         | MMM   | Jan, Feb, ..., Dec               |
   * |                         | MMMM  | January, February, ..., December |
   * | Quarter                 | Q     | 1, 2, 3, 4                       |
   * |                         | Qo    | 1st, 2nd, 3rd, 4th               |
   * | Day of month            | D     | 1, 2, ..., 31                    |
   * |                         | Do    | 1st, 2nd, ..., 31st              |
   * |                         | DD    | 01, 02, ..., 31                  |
   * | Day of year             | DDD   | 1, 2, ..., 366                   |
   * |                         | DDDo  | 1st, 2nd, ..., 366th             |
   * |                         | DDDD  | 001, 002, ..., 366               |
   * | Day of week             | d     | 0, 1, ..., 6                     |
   * |                         | do    | 0th, 1st, ..., 6th               |
   * |                         | dd    | Su, Mo, ..., Sa                  |
   * |                         | ddd   | Sun, Mon, ..., Sat               |
   * |                         | dddd  | Sunday, Monday, ..., Saturday    |
   * | Day of ISO week         | E     | 1, 2, ..., 7                     |
   * | ISO week                | W     | 1, 2, ..., 53                    |
   * |                         | Wo    | 1st, 2nd, ..., 53rd              |
   * |                         | WW    | 01, 02, ..., 53                  |
   * | Year                    | YY    | 00, 01, ..., 99                  |
   * |                         | YYYY  | 1900, 1901, ..., 2099            |
   * | ISO week-numbering year | GG    | 00, 01, ..., 99                  |
   * |                         | GGGG  | 1900, 1901, ..., 2099            |
   * | AM/PM                   | A     | AM, PM                           |
   * |                         | a     | am, pm                           |
   * |                         | aa    | a.m., p.m.                       |
   * | Hour                    | H     | 0, 1, ... 23                     |
   * |                         | HH    | 00, 01, ... 23                   |
   * |                         | h     | 1, 2, ..., 12                    |
   * |                         | hh    | 01, 02, ..., 12                  |
   * | Minute                  | m     | 0, 1, ..., 59                    |
   * |                         | mm    | 00, 01, ..., 59                  |
   * | Second                  | s     | 0, 1, ..., 59                    |
   * |                         | ss    | 00, 01, ..., 59                  |
   * | 1/10 of second          | S     | 0, 1, ..., 9                     |
   * | 1/100 of second         | SS    | 00, 01, ..., 99                  |
   * | Millisecond             | SSS   | 000, 001, ..., 999               |
   * | Timezone                | Z     | -01:00, +00:00, ... +12:00       |
   * |                         | ZZ    | -0100, +0000, ..., +1200         |
   * | Seconds timestamp       | X     | 512969520                        |
   * | Milliseconds timestamp  | x     | 512969520900                     |
   *
   * The characters wrapped in square brackets are escaped.
   *
   * The result may vary by locale.
   *
   * @param {Date|String|Number} date - the original date
   * @param {String} [format='YYYY-MM-DDTHH:mm:ss.SSSZ'] - the string of tokens
   * @param {Object} [options] - the object with options
   * @param {Object} [options.locale=enLocale] - the locale object
   * @returns {String} the formatted date string
   *
   * @example
   * // Represent 11 February 2014 in middle-endian format:
   * var result = format(
   *   new Date(2014, 1, 11),
   *   'MM/DD/YYYY'
   * )
   * //=> '02/11/2014'
   *
   * @example
   * // Represent 2 July 2014 in Esperanto:
   * var eoLocale = require('date-fns/locale/eo')
   * var result = format(
   *   new Date(2014, 6, 2),
   *   'Do [de] MMMM YYYY',
   *   {locale: eoLocale}
   * )
   * //=> '2-a de julio 2014'
   */
  function format (dirtyDate, dirtyFormatStr, dirtyOptions) {
    var formatStr = dirtyFormatStr ? String(dirtyFormatStr) : 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    var options = dirtyOptions || {};

    var locale = options.locale;
    var localeFormatters = en.format.formatters;
    var formattingTokensRegExp = en.format.formattingTokensRegExp;
    if (locale && locale.format && locale.format.formatters) {
      localeFormatters = locale.format.formatters;

      if (locale.format.formattingTokensRegExp) {
        formattingTokensRegExp = locale.format.formattingTokensRegExp;
      }
    }

    var date = parse_1(dirtyDate);

    if (!is_valid(date)) {
      return 'Invalid Date'
    }

    var formatFn = buildFormatFn(formatStr, localeFormatters, formattingTokensRegExp);

    return formatFn(date)
  }

  var formatters = {
    // Month: 1, 2, ..., 12
    'M': function (date) {
      return date.getMonth() + 1
    },

    // Month: 01, 02, ..., 12
    'MM': function (date) {
      return addLeadingZeros(date.getMonth() + 1, 2)
    },

    // Quarter: 1, 2, 3, 4
    'Q': function (date) {
      return Math.ceil((date.getMonth() + 1) / 3)
    },

    // Day of month: 1, 2, ..., 31
    'D': function (date) {
      return date.getDate()
    },

    // Day of month: 01, 02, ..., 31
    'DD': function (date) {
      return addLeadingZeros(date.getDate(), 2)
    },

    // Day of year: 1, 2, ..., 366
    'DDD': function (date) {
      return get_day_of_year(date)
    },

    // Day of year: 001, 002, ..., 366
    'DDDD': function (date) {
      return addLeadingZeros(get_day_of_year(date), 3)
    },

    // Day of week: 0, 1, ..., 6
    'd': function (date) {
      return date.getDay()
    },

    // Day of ISO week: 1, 2, ..., 7
    'E': function (date) {
      return date.getDay() || 7
    },

    // ISO week: 1, 2, ..., 53
    'W': function (date) {
      return get_iso_week(date)
    },

    // ISO week: 01, 02, ..., 53
    'WW': function (date) {
      return addLeadingZeros(get_iso_week(date), 2)
    },

    // Year: 00, 01, ..., 99
    'YY': function (date) {
      return addLeadingZeros(date.getFullYear(), 4).substr(2)
    },

    // Year: 1900, 1901, ..., 2099
    'YYYY': function (date) {
      return addLeadingZeros(date.getFullYear(), 4)
    },

    // ISO week-numbering year: 00, 01, ..., 99
    'GG': function (date) {
      return String(get_iso_year(date)).substr(2)
    },

    // ISO week-numbering year: 1900, 1901, ..., 2099
    'GGGG': function (date) {
      return get_iso_year(date)
    },

    // Hour: 0, 1, ... 23
    'H': function (date) {
      return date.getHours()
    },

    // Hour: 00, 01, ..., 23
    'HH': function (date) {
      return addLeadingZeros(date.getHours(), 2)
    },

    // Hour: 1, 2, ..., 12
    'h': function (date) {
      var hours = date.getHours();
      if (hours === 0) {
        return 12
      } else if (hours > 12) {
        return hours % 12
      } else {
        return hours
      }
    },

    // Hour: 01, 02, ..., 12
    'hh': function (date) {
      return addLeadingZeros(formatters['h'](date), 2)
    },

    // Minute: 0, 1, ..., 59
    'm': function (date) {
      return date.getMinutes()
    },

    // Minute: 00, 01, ..., 59
    'mm': function (date) {
      return addLeadingZeros(date.getMinutes(), 2)
    },

    // Second: 0, 1, ..., 59
    's': function (date) {
      return date.getSeconds()
    },

    // Second: 00, 01, ..., 59
    'ss': function (date) {
      return addLeadingZeros(date.getSeconds(), 2)
    },

    // 1/10 of second: 0, 1, ..., 9
    'S': function (date) {
      return Math.floor(date.getMilliseconds() / 100)
    },

    // 1/100 of second: 00, 01, ..., 99
    'SS': function (date) {
      return addLeadingZeros(Math.floor(date.getMilliseconds() / 10), 2)
    },

    // Millisecond: 000, 001, ..., 999
    'SSS': function (date) {
      return addLeadingZeros(date.getMilliseconds(), 3)
    },

    // Timezone: -01:00, +00:00, ... +12:00
    'Z': function (date) {
      return formatTimezone(date.getTimezoneOffset(), ':')
    },

    // Timezone: -0100, +0000, ... +1200
    'ZZ': function (date) {
      return formatTimezone(date.getTimezoneOffset())
    },

    // Seconds timestamp: 512969520
    'X': function (date) {
      return Math.floor(date.getTime() / 1000)
    },

    // Milliseconds timestamp: 512969520900
    'x': function (date) {
      return date.getTime()
    }
  };

  function buildFormatFn (formatStr, localeFormatters, formattingTokensRegExp) {
    var array = formatStr.match(formattingTokensRegExp);
    var length = array.length;

    var i;
    var formatter;
    for (i = 0; i < length; i++) {
      formatter = localeFormatters[array[i]] || formatters[array[i]];
      if (formatter) {
        array[i] = formatter;
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }

    return function (date) {
      var output = '';
      for (var i = 0; i < length; i++) {
        if (array[i] instanceof Function) {
          output += array[i](date, formatters);
        } else {
          output += array[i];
        }
      }
      return output
    }
  }

  function removeFormattingTokens (input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|]$/g, '')
    }
    return input.replace(/\\/g, '')
  }

  function formatTimezone (offset, delimeter) {
    delimeter = delimeter || '';
    var sign = offset > 0 ? '-' : '+';
    var absOffset = Math.abs(offset);
    var hours = Math.floor(absOffset / 60);
    var minutes = absOffset % 60;
    return sign + addLeadingZeros(hours, 2) + delimeter + addLeadingZeros(minutes, 2)
  }

  function addLeadingZeros (number, targetLength) {
    var output = Math.abs(number).toString();
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return output
  }

  var format_1 = format;

  var span = document.querySelector('#time-now');

  function update() {
  	span.textContent = format_1(new Date(), 'h:mm:ssa');
  	setTimeout(update, 1000);
  }

  exports.update = update;

  Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=update.js.map
