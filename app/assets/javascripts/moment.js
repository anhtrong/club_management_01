(function(undefined) {
  var moment, VERSION = "2.9.0",
    globalScope = typeof global !== "undefined" && (typeof window === "undefined" || window === global.window) ? global : this,
    oldGlobalMoment, round = Math.round,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    i, YEAR = 0,
    MONTH = 1,
    DATE = 2,
    HOUR = 3,
    MINUTE = 4,
    SECOND = 5,
    MILLISECOND = 6,
    locales = {},
    momentProperties = [],
    hasModule = typeof module !== "undefined" && module && module.exports,
    aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
    aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,
    isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,
    formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
    localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
    parseTokenOneOrTwoDigits = /\d\d?/,
    parseTokenOneToThreeDigits = /\d{1,3}/,
    parseTokenOneToFourDigits = /\d{1,4}/,
    parseTokenOneToSixDigits =
    /[+\-]?\d{1,6}/,
    parseTokenDigits = /\d+/,
    parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
    parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi,
    parseTokenT = /T/i,
    parseTokenOffsetMs = /[\+\-]?\d+/,
    parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/,
    parseTokenOneDigit = /\d/,
    parseTokenTwoDigits = /\d\d/,
    parseTokenThreeDigits = /\d{3}/,
    parseTokenFourDigits = /\d{4}/,
    parseTokenSixDigits = /[+-]?\d{6}/,
    parseTokenSignedNumber = /[+-]?\d+/,
    isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
    isoFormat = "YYYY-MM-DDTHH:mm:ssZ",
    isoDates = [
      ["YYYYYY-MM-DD", /[+-]\d{6}-\d{2}-\d{2}/],
      ["YYYY-MM-DD", /\d{4}-\d{2}-\d{2}/],
      ["GGGG-[W]WW-E", /\d{4}-W\d{2}-\d/],
      ["GGGG-[W]WW", /\d{4}-W\d{2}/],
      ["YYYY-DDD", /\d{4}-\d{3}/]
    ],
    isoTimes = [
      ["HH:mm:ss.SSSS", /(T| )\d\d:\d\d:\d\d\.\d+/],
      ["HH:mm:ss", /(T| )\d\d:\d\d:\d\d/],
      ["HH:mm", /(T| )\d\d:\d\d/],
      ["HH", /(T| )\d\d/]
    ],
    parseTimezoneChunker = /([\+\-]|\d\d)/gi,
    proxyGettersAndSetters = "Date|Hours|Minutes|Seconds|Milliseconds".split("|"),
    unitMillisecondFactors = {
      "Milliseconds": 1,
      "Seconds": 1E3,
      "Minutes": 6E4,
      "Hours": 36E5,
      "Days": 864E5,
      "Months": 2592E6,
      "Years": 31536E6
    },
    unitAliases = {
      ms: "millisecond",
      s: "second",
      m: "minute",
      h: "hour",
      d: "day",
      D: "date",
      w: "week",
      W: "isoWeek",
      M: "month",
      Q: "quarter",
      y: "year",
      DDD: "dayOfYear",
      e: "weekday",
      E: "isoWeekday",
      gg: "weekYear",
      GG: "isoWeekYear"
    },
    camelFunctions = {
      dayofyear: "dayOfYear",
      isoweekday: "isoWeekday",
      isoweek: "isoWeek",
      weekyear: "weekYear",
      isoweekyear: "isoWeekYear"
    },
    formatFunctions = {},
    relativeTimeThresholds = {
      s: 45,
      m: 45,
      h: 22,
      d: 26,
      M: 11
    },
    ordinalizeTokens =
    "DDD w W M D d".split(" "),
    paddedTokens = "M D H h m s w W".split(" "),
    formatTokenFunctions = {
      M: function() {
        return this.month() + 1
      },
      MMM: function(format) {
        return this.localeData().monthsShort(this, format)
      },
      MMMM: function(format) {
        return this.localeData().months(this, format)
      },
      D: function() {
        return this.date()
      },
      DDD: function() {
        return this.dayOfYear()
      },
      d: function() {
        return this.day()
      },
      dd: function(format) {
        return this.localeData().weekdaysMin(this, format)
      },
      ddd: function(format) {
        return this.localeData().weekdaysShort(this,
          format)
      },
      dddd: function(format) {
        return this.localeData().weekdays(this, format)
      },
      w: function() {
        return this.week()
      },
      W: function() {
        return this.isoWeek()
      },
      YY: function() {
        return leftZeroFill(this.year() % 100, 2)
      },
      YYYY: function() {
        return leftZeroFill(this.year(), 4)
      },
      YYYYY: function() {
        return leftZeroFill(this.year(), 5)
      },
      YYYYYY: function() {
        var y = this.year(),
          sign = y >= 0 ? "+" : "-";
        return sign + leftZeroFill(Math.abs(y), 6)
      },
      gg: function() {
        return leftZeroFill(this.weekYear() % 100, 2)
      },
      gggg: function() {
        return leftZeroFill(this.weekYear(),
          4)
      },
      ggggg: function() {
        return leftZeroFill(this.weekYear(), 5)
      },
      GG: function() {
        return leftZeroFill(this.isoWeekYear() % 100, 2)
      },
      GGGG: function() {
        return leftZeroFill(this.isoWeekYear(), 4)
      },
      GGGGG: function() {
        return leftZeroFill(this.isoWeekYear(), 5)
      },
      e: function() {
        return this.weekday()
      },
      E: function() {
        return this.isoWeekday()
      },
      a: function() {
        return this.localeData().meridiem(this.hours(), this.minutes(), true)
      },
      A: function() {
        return this.localeData().meridiem(this.hours(), this.minutes(), false)
      },
      H: function() {
        return this.hours()
      },
      h: function() {
        return this.hours() % 12 || 12
      },
      m: function() {
        return this.minutes()
      },
      s: function() {
        return this.seconds()
      },
      S: function() {
        return toInt(this.milliseconds() / 100)
      },
      SS: function() {
        return leftZeroFill(toInt(this.milliseconds() / 10), 2)
      },
      SSS: function() {
        return leftZeroFill(this.milliseconds(), 3)
      },
      SSSS: function() {
        return leftZeroFill(this.milliseconds(), 3)
      },
      Z: function() {
        var a = this.utcOffset(),
          b = "+";
        if (a < 0) {
          a = -a;
          b = "-"
        }
        return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2)
      },
      ZZ: function() {
        var a =
          this.utcOffset(),
          b = "+";
        if (a < 0) {
          a = -a;
          b = "-"
        }
        return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2)
      },
      z: function() {
        return this.zoneAbbr()
      },
      zz: function() {
        return this.zoneName()
      },
      x: function() {
        return this.valueOf()
      },
      X: function() {
        return this.unix()
      },
      Q: function() {
        return this.quarter()
      }
    },
    deprecations = {},
    lists = ["months", "monthsShort", "weekdays", "weekdaysShort", "weekdaysMin"],
    updateInProgress = false;

  function dfl(a, b, c) {
    switch (arguments.length) {
      case 2:
        return a != null ? a : b;
      case 3:
        return a != null ? a : b != null ?
          b : c;
      default:
        throw new Error("Implement me");
    }
  }

  function hasOwnProp(a, b) {
    return hasOwnProperty.call(a, b)
  }

  function defaultParsingFlags() {
    return {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    }
  }

  function printMsg(msg) {
    if (moment.suppressDeprecationWarnings === false && typeof console !== "undefined" && console.warn) console.warn("Deprecation warning: " + msg)
  }

  function deprecate(msg, fn) {
    var firstTime = true;
    return extend(function() {
      if (firstTime) {
        printMsg(msg);
        firstTime = false
      }
      return fn.apply(this, arguments)
    }, fn)
  }

  function deprecateSimple(name, msg) {
    if (!deprecations[name]) {
      printMsg(msg);
      deprecations[name] = true
    }
  }

  function padToken(func, count) {
    return function(a) {
      return leftZeroFill(func.call(this, a), count)
    }
  }

  function ordinalizeToken(func, period) {
    return function(a) {
      return this.localeData().ordinal(func.call(this, a), period)
    }
  }

  function monthDiff(a, b) {
    var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
      anchor = a.clone().add(wholeMonthDiff, "months"),
      anchor2,
      adjust;
    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, "months");
      adjust = (b - anchor) / (anchor - anchor2)
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, "months");
      adjust = (b - anchor) / (anchor2 - anchor)
    }
    return -(wholeMonthDiff + adjust)
  }
  while (ordinalizeTokens.length) {
    i = ordinalizeTokens.pop();
    formatTokenFunctions[i + "o"] = ordinalizeToken(formatTokenFunctions[i], i)
  }
  while (paddedTokens.length) {
    i = paddedTokens.pop();
    formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2)
  }
  formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD,
    3);

  function meridiemFixWrap(locale, hour, meridiem) {
    var isPm;
    if (meridiem == null) return hour;
    if (locale.meridiemHour != null) return locale.meridiemHour(hour, meridiem);
    else if (locale.isPM != null) {
      isPm = locale.isPM(meridiem);
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
      return hour
    } else return hour
  }

  function Locale() {}

  function Moment(config, skipOverflow) {
    if (skipOverflow !== false) checkOverflow(config);
    copyConfig(this, config);
    this._d = new Date(+config._d);
    if (updateInProgress === false) {
      updateInProgress = true;
      moment.updateOffset(this);
      updateInProgress = false
    }
  }

  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration),
      years = normalizedInput.year || 0,
      quarters = normalizedInput.quarter || 0,
      months = normalizedInput.month || 0,
      weeks = normalizedInput.week || 0,
      days = normalizedInput.day || 0,
      hours = normalizedInput.hour || 0,
      minutes = normalizedInput.minute || 0,
      seconds = normalizedInput.second || 0,
      milliseconds = normalizedInput.millisecond || 0;
    this._milliseconds = +milliseconds + seconds * 1E3 + minutes * 6E4 + hours * 36E5;
    this._days = +days + weeks * 7;
    this._months = +months + quarters * 3 + years * 12;
    this._data = {};
    this._locale = moment.localeData();
    this._bubble()
  }

  function extend(a, b) {
    for (var i in b)
      if (hasOwnProp(b, i)) a[i] = b[i];
    if (hasOwnProp(b, "toString")) a.toString = b.toString;
    if (hasOwnProp(b, "valueOf")) a.valueOf = b.valueOf;
    return a
  }

  function copyConfig(to, from) {
    var i, prop, val;
    if (typeof from._isAMomentObject !== "undefined") to._isAMomentObject = from._isAMomentObject;
    if (typeof from._i !== "undefined") to._i = from._i;
    if (typeof from._f !== "undefined") to._f =
      from._f;
    if (typeof from._l !== "undefined") to._l = from._l;
    if (typeof from._strict !== "undefined") to._strict = from._strict;
    if (typeof from._tzm !== "undefined") to._tzm = from._tzm;
    if (typeof from._isUTC !== "undefined") to._isUTC = from._isUTC;
    if (typeof from._offset !== "undefined") to._offset = from._offset;
    if (typeof from._pf !== "undefined") to._pf = from._pf;
    if (typeof from._locale !== "undefined") to._locale = from._locale;
    if (momentProperties.length > 0)
      for (i in momentProperties) {
        prop = momentProperties[i];
        val = from[prop];
        if (typeof val !==
          "undefined") to[prop] = val
      }
    return to
  }

  function absRound(number) {
    if (number < 0) return Math.ceil(number);
    else return Math.floor(number)
  }

  function leftZeroFill(number, targetLength, forceSign) {
    var output = "" + Math.abs(number),
      sign = number >= 0;
    while (output.length < targetLength) output = "0" + output;
    return (sign ? forceSign ? "+" : "" : "-") + output
  }

  function positiveMomentsDifference(base, other) {
    var res = {
      milliseconds: 0,
      months: 0
    };
    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, "M").isAfter(other)) --res.months;
    res.milliseconds = +other - +base.clone().add(res.months, "M");
    return res
  }

  function momentsDifference(base, other) {
    var res;
    other = makeAs(other, base);
    if (base.isBefore(other)) res = positiveMomentsDifference(base, other);
    else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months
    }
    return res
  }

  function createAdder(direction, name) {
    return function(val, period) {
      var dur, tmp;
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, "moment()." + name + "(period, number) is deprecated. Please use moment()." +
          name + "(number, period).");
        tmp = val;
        val = period;
        period = tmp
      }
      val = typeof val === "string" ? +val : val;
      dur = moment.duration(val, period);
      addOrSubtractDurationFromMoment(this, dur, direction);
      return this
    }
  }

  function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
      days = duration._days,
      months = duration._months;
    updateOffset = updateOffset == null ? true : updateOffset;
    if (milliseconds) mom._d.setTime(+mom._d + milliseconds * isAdding);
    if (days) rawSetter(mom, "Date", rawGetter(mom,
      "Date") + days * isAdding);
    if (months) rawMonthSetter(mom, rawGetter(mom, "Month") + months * isAdding);
    if (updateOffset) moment.updateOffset(mom, days || months)
  }

  function isArray(input) {
    return Object.prototype.toString.call(input) === "[object Array]"
  }

  function isDate(input) {
    return Object.prototype.toString.call(input) === "[object Date]" || input instanceof Date
  }

  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
      lengthDiff = Math.abs(array1.length - array2.length),
      diffs = 0,
      i;
    for (i =
      0; i < len; i++)
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) diffs++;
    return diffs + lengthDiff
  }

  function normalizeUnits(units) {
    if (units) {
      var lowered = units.toLowerCase().replace(/(.)s$/, "$1");
      units = unitAliases[units] || camelFunctions[lowered] || lowered
    }
    return units
  }

  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
      normalizedProp, prop;
    for (prop in inputObject)
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) normalizedInput[normalizedProp] =
          inputObject[prop]
      }
    return normalizedInput
  }

  function makeList(field) {
    var count, setter;
    if (field.indexOf("week") === 0) {
      count = 7;
      setter = "day"
    } else if (field.indexOf("month") === 0) {
      count = 12;
      setter = "month"
    } else return;
    moment[field] = function(format, index) {
      var i, getter, method = moment._locale[field],
        results = [];
      if (typeof format === "number") {
        index = format;
        format = undefined
      }
      getter = function(i) {
        var m = moment().utc().set(setter, i);
        return method.call(moment._locale, m, format || "")
      };
      if (index != null) return getter(index);
      else {
        for (i =
          0; i < count; i++) results.push(getter(i));
        return results
      }
    }
  }

  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
      value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber))
      if (coercedNumber >= 0) value = Math.floor(coercedNumber);
      else value = Math.ceil(coercedNumber);
    return value
  }

  function daysInMonth(year, month) {
    return (new Date(Date.UTC(year, month + 1, 0))).getUTCDate()
  }

  function weeksInYear(year, dow, doy) {
    return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week
  }

  function daysInYear(year) {
    return isLeapYear(year) ?
      366 : 365
  }

  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0
  }

  function checkOverflow(m) {
    var overflow;
    if (m._a && m._pf.overflow === -2) {
      overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH : m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE : m._a[HOUR] < 0 || m._a[HOUR] > 24 || m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 || m._a[SECOND] !== 0 || m._a[MILLISECOND] !== 0) ? HOUR : m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE : m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND : m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
        -1;
      if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) overflow = DATE;
      m._pf.overflow = overflow
    }
  }

  function isValid(m) {
    if (m._isValid == null) {
      m._isValid = !isNaN(m._d.getTime()) && m._pf.overflow < 0 && !m._pf.empty && !m._pf.invalidMonth && !m._pf.nullInput && !m._pf.invalidFormat && !m._pf.userInvalidated;
      if (m._strict) m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0 && m._pf.bigHour === undefined
    }
    return m._isValid
  }

  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace("_",
      "-") : key
  }

  function chooseLocale(names) {
    var i = 0,
      j, next, locale, split;
    while (i < names.length) {
      split = normalizeLocale(names[i]).split("-");
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split("-") : null;
      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join("-"));
        if (locale) return locale;
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) break;
        j--
      }
      i++
    }
    return null
  }

  function loadLocale(name) {
    var oldLocale = null;
    if (!locales[name] && hasModule) try {
      oldLocale = moment.locale();
      require("./locale/" +
        name);
      moment.locale(oldLocale)
    } catch (e) {}
    return locales[name]
  }

  function makeAs(input, model) {
    var res, diff;
    if (model._isUTC) {
      res = model.clone();
      diff = (moment.isMoment(input) || isDate(input) ? +input : +moment(input)) - +res;
      res._d.setTime(+res._d + diff);
      moment.updateOffset(res, false);
      return res
    } else return moment(input).local()
  }
  extend(Locale.prototype, {
    set: function(config) {
      var prop, i;
      for (i in config) {
        prop = config[i];
        if (typeof prop === "function") this[i] = prop;
        else this["_" + i] = prop
      }
      this._ordinalParseLenient = new RegExp(this._ordinalParse.source +
        "|" + /\d{1,2}/.source)
    },
    _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
    months: function(m) {
      return this._months[m.month()]
    },
    _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
    monthsShort: function(m) {
      return this._monthsShort[m.month()]
    },
    monthsParse: function(monthName, format, strict) {
      var i, mom, regex;
      if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = []
      }
      for (i = 0; i < 12; i++) {
        mom = moment.utc([2E3,
          i
        ]);
        if (strict && !this._longMonthsParse[i]) {
          this._longMonthsParse[i] = new RegExp("^" + this.months(mom, "").replace(".", "") + "$", "i");
          this._shortMonthsParse[i] = new RegExp("^" + this.monthsShort(mom, "").replace(".", "") + "$", "i")
        }
        if (!strict && !this._monthsParse[i]) {
          regex = "^" + this.months(mom, "") + "|^" + this.monthsShort(mom, "");
          this._monthsParse[i] = new RegExp(regex.replace(".", ""), "i")
        }
        if (strict && format === "MMMM" && this._longMonthsParse[i].test(monthName)) return i;
        else if (strict && format === "MMM" && this._shortMonthsParse[i].test(monthName)) return i;
        else if (!strict && this._monthsParse[i].test(monthName)) return i
      }
    },
    _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
    weekdays: function(m) {
      return this._weekdays[m.day()]
    },
    _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
    weekdaysShort: function(m) {
      return this._weekdaysShort[m.day()]
    },
    _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
    weekdaysMin: function(m) {
      return this._weekdaysMin[m.day()]
    },
    weekdaysParse: function(weekdayName) {
      var i, mom, regex;
      if (!this._weekdaysParse) this._weekdaysParse = [];
      for (i = 0; i < 7; i++) {
        if (!this._weekdaysParse[i]) {
          mom = moment([2E3, 1]).day(i);
          regex = "^" + this.weekdays(mom, "") + "|^" + this.weekdaysShort(mom, "") + "|^" + this.weekdaysMin(mom, "");
          this._weekdaysParse[i] = new RegExp(regex.replace(".", ""), "i")
        }
        if (this._weekdaysParse[i].test(weekdayName)) return i
      }
    },
    _longDateFormat: {
      LTS: "h:mm:ss A",
      LT: "h:mm A",
      L: "MM/DD/YYYY",
      LL: "MMMM D, YYYY",
      LLL: "MMMM D, YYYY LT",
      LLLL: "dddd, MMMM D, YYYY LT"
    },
    longDateFormat: function(key) {
      var output = this._longDateFormat[key];
      if (!output && this._longDateFormat[key.toUpperCase()]) {
        output =
          this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function(val) {
            return val.slice(1)
          });
        this._longDateFormat[key] = output
      }
      return output
    },
    isPM: function(input) {
      return (input + "").toLowerCase().charAt(0) === "p"
    },
    _meridiemParse: /[ap]\.?m?\.?/i,
    meridiem: function(hours, minutes, isLower) {
      if (hours > 11) return isLower ? "pm" : "PM";
      else return isLower ? "am" : "AM"
    },
    _calendar: {
      sameDay: "[Today at] LT",
      nextDay: "[Tomorrow at] LT",
      nextWeek: "dddd [at] LT",
      lastDay: "[Yesterday at] LT",
      lastWeek: "[Last] dddd [at] LT",
      sameElse: "L"
    },
    calendar: function(key, mom, now) {
      var output = this._calendar[key];
      return typeof output === "function" ? output.apply(mom, [now]) : output
    },
    _relativeTime: {
      future: "in %s",
      past: "%s ago",
      s: "a few seconds",
      m: "a minute",
      mm: "%d minutes",
      h: "an hour",
      hh: "%d hours",
      d: "a day",
      dd: "%d days",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years"
    },
    relativeTime: function(number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return typeof output === "function" ? output(number, withoutSuffix, string,
        isFuture) : output.replace(/%d/i, number)
    },
    pastFuture: function(diff, output) {
      var format = this._relativeTime[diff > 0 ? "future" : "past"];
      return typeof format === "function" ? format(output) : format.replace(/%s/i, output)
    },
    ordinal: function(number) {
      return this._ordinal.replace("%d", number)
    },
    _ordinal: "%d",
    _ordinalParse: /\d{1,2}/,
    preparse: function(string) {
      return string
    },
    postformat: function(string) {
      return string
    },
    week: function(mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week
    },
    _week: {
      dow: 0,
      doy: 6
    },
    firstDayOfWeek: function() {
      return this._week.dow
    },
    firstDayOfYear: function() {
      return this._week.doy
    },
    _invalidDate: "Invalid date",
    invalidDate: function() {
      return this._invalidDate
    }
  });

  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) return input.replace(/^\[|\]$/g, "");
    return input.replace(/\\/g, "")
  }

  function makeFormatFunction(format) {
    var array = format.match(formattingTokens),
      i, length;
    for (i = 0, length = array.length; i < length; i++)
      if (formatTokenFunctions[array[i]]) array[i] = formatTokenFunctions[array[i]];
      else array[i] = removeFormattingTokens(array[i]);
    return function(mom) {
      var output = "";
      for (i = 0; i < length; i++) output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
      return output
    }
  }

  function formatMoment(m, format) {
    if (!m.isValid()) return m.localeData().invalidDate();
    format = expandFormat(format, m.localeData());
    if (!formatFunctions[format]) formatFunctions[format] = makeFormatFunction(format);
    return formatFunctions[format](m)
  }

  function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) ||
        input
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1
    }
    return format
  }

  function getParseRegexForToken(token, config) {
    var a, strict = config._strict;
    switch (token) {
      case "Q":
        return parseTokenOneDigit;
      case "DDDD":
        return parseTokenThreeDigits;
      case "YYYY":
      case "GGGG":
      case "gggg":
        return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
      case "Y":
      case "G":
      case "g":
        return parseTokenSignedNumber;
      case "YYYYYY":
      case "YYYYY":
      case "GGGGG":
      case "ggggg":
        return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
      case "S":
        if (strict) return parseTokenOneDigit;
      case "SS":
        if (strict) return parseTokenTwoDigits;
      case "SSS":
        if (strict) return parseTokenThreeDigits;
      case "DDD":
        return parseTokenOneToThreeDigits;
      case "MMM":
      case "MMMM":
      case "dd":
      case "ddd":
      case "dddd":
        return parseTokenWord;
      case "a":
      case "A":
        return config._locale._meridiemParse;
      case "x":
        return parseTokenOffsetMs;
      case "X":
        return parseTokenTimestampMs;
      case "Z":
      case "ZZ":
        return parseTokenTimezone;
      case "T":
        return parseTokenT;
      case "SSSS":
        return parseTokenDigits;
      case "MM":
      case "DD":
      case "YY":
      case "GG":
      case "gg":
      case "HH":
      case "hh":
      case "mm":
      case "ss":
      case "ww":
      case "WW":
        return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
      case "M":
      case "D":
      case "d":
      case "H":
      case "h":
      case "m":
      case "s":
      case "w":
      case "W":
      case "e":
      case "E":
        return parseTokenOneOrTwoDigits;
      case "Do":
        return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
      default:
        a =
          new RegExp(regexpEscape(unescapeFormat(token.replace("\\", "")), "i"));
        return a
    }
  }

  function utcOffsetFromString(string) {
    string = string || "";
    var possibleTzMatches = string.match(parseTokenTimezone) || [],
      tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
      parts = (tzChunk + "").match(parseTimezoneChunker) || ["-", 0, 0],
      minutes = +(parts[1] * 60) + toInt(parts[2]);
    return parts[0] === "+" ? minutes : -minutes
  }

  function addTimeToArrayFromToken(token, input, config) {
    var a, datePartArray = config._a;
    switch (token) {
      case "Q":
        if (input !=
          null) datePartArray[MONTH] = (toInt(input) - 1) * 3;
        break;
      case "M":
      case "MM":
        if (input != null) datePartArray[MONTH] = toInt(input) - 1;
        break;
      case "MMM":
      case "MMMM":
        a = config._locale.monthsParse(input, token, config._strict);
        if (a != null) datePartArray[MONTH] = a;
        else config._pf.invalidMonth = input;
        break;
      case "D":
      case "DD":
        if (input != null) datePartArray[DATE] = toInt(input);
        break;
      case "Do":
        if (input != null) datePartArray[DATE] = toInt(parseInt(input.match(/\d{1,2}/)[0], 10));
        break;
      case "DDD":
      case "DDDD":
        if (input != null) config._dayOfYear =
          toInt(input);
        break;
      case "YY":
        datePartArray[YEAR] = moment.parseTwoDigitYear(input);
        break;
      case "YYYY":
      case "YYYYY":
      case "YYYYYY":
        datePartArray[YEAR] = toInt(input);
        break;
      case "a":
      case "A":
        config._meridiem = input;
        break;
      case "h":
      case "hh":
        config._pf.bigHour = true;
      case "H":
      case "HH":
        datePartArray[HOUR] = toInt(input);
        break;
      case "m":
      case "mm":
        datePartArray[MINUTE] = toInt(input);
        break;
      case "s":
      case "ss":
        datePartArray[SECOND] = toInt(input);
        break;
      case "S":
      case "SS":
      case "SSS":
      case "SSSS":
        datePartArray[MILLISECOND] =
          toInt(("0." + input) * 1E3);
        break;
      case "x":
        config._d = new Date(toInt(input));
        break;
      case "X":
        config._d = new Date(parseFloat(input) * 1E3);
        break;
      case "Z":
      case "ZZ":
        config._useUTC = true;
        config._tzm = utcOffsetFromString(input);
        break;
      case "dd":
      case "ddd":
      case "dddd":
        a = config._locale.weekdaysParse(input);
        if (a != null) {
          config._w = config._w || {};
          config._w["d"] = a
        } else config._pf.invalidWeekday = input;
        break;
      case "w":
      case "ww":
      case "W":
      case "WW":
      case "d":
      case "e":
      case "E":
        token = token.substr(0, 1);
      case "gggg":
      case "GGGG":
      case "GGGGG":
        token =
          token.substr(0, 2);
        if (input) {
          config._w = config._w || {};
          config._w[token] = toInt(input)
        }
        break;
      case "gg":
      case "GG":
        config._w = config._w || {};
        config._w[token] = moment.parseTwoDigitYear(input)
    }
  }

  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp;
    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;
      weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
      week = dfl(w.W, 1);
      weekday = dfl(w.E, 1)
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;
      weekYear = dfl(w.gg,
        config._a[YEAR], weekOfYear(moment(), dow, doy).year);
      week = dfl(w.w, 1);
      if (w.d != null) {
        weekday = w.d;
        if (weekday < dow) ++week
      } else if (w.e != null) weekday = w.e + dow;
      else weekday = dow
    }
    temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);
    config._a[YEAR] = temp.year;
    config._dayOfYear = temp.dayOfYear
  }

  function dateFromConfig(config) {
    var i, date, input = [],
      currentDate, yearToUse;
    if (config._d) return;
    currentDate = currentDateArray(config);
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) dayOfYearFromWeekInfo(config);
    if (config._dayOfYear) {
      yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);
      if (config._dayOfYear > daysInYear(yearToUse)) config._pf._overflowDayOfYear = true;
      date = makeUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate()
    }
    for (i = 0; i < 3 && config._a[i] == null; ++i) config._a[i] = input[i] = currentDate[i];
    for (; i < 7; i++) config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] ===
      0) {
      config._nextDay = true;
      config._a[HOUR] = 0
    }
    config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    if (config._tzm != null) config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    if (config._nextDay) config._a[HOUR] = 24
  }

  function dateFromObject(config) {
    var normalizedInput;
    if (config._d) return;
    normalizedInput = normalizeObjectUnits(config._i);
    config._a = [normalizedInput.year, normalizedInput.month, normalizedInput.day || normalizedInput.date, normalizedInput.hour, normalizedInput.minute, normalizedInput.second,
      normalizedInput.millisecond
    ];
    dateFromConfig(config)
  }

  function currentDateArray(config) {
    var now = new Date;
    if (config._useUTC) return [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
    else return [now.getFullYear(), now.getMonth(), now.getDate()]
  }

  function makeDateFromStringAndFormat(config) {
    if (config._f === moment.ISO_8601) {
      parseISO(config);
      return
    }
    config._a = [];
    config._pf.empty = true;
    var string = "" + config._i,
      i, parsedInput, tokens, token, skipped, stringLength = string.length,
      totalParsedInputLength = 0;
    tokens = expandFormat(config._f,
      config._locale).match(formattingTokens) || [];
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) config._pf.unusedInput.push(skipped);
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length
      }
      if (formatTokenFunctions[token]) {
        if (parsedInput) config._pf.empty = false;
        else config._pf.unusedTokens.push(token);
        addTimeToArrayFromToken(token, parsedInput, config)
      } else if (config._strict && !parsedInput) config._pf.unusedTokens.push(token)
    }
    config._pf.charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) config._pf.unusedInput.push(string);
    if (config._pf.bigHour === true && config._a[HOUR] <= 12) config._pf.bigHour = undefined;
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);
    dateFromConfig(config);
    checkOverflow(config)
  }

  function unescapeFormat(s) {
    return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
      function(matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4
      })
  }

  function regexpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
  }

  function makeDateFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;
    if (config._f.length === 0) {
      config._pf.invalidFormat = true;
      config._d = new Date(NaN);
      return
    }
    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) tempConfig._useUTC = config._useUTC;
      tempConfig._pf = defaultParsingFlags();
      tempConfig._f =
        config._f[i];
      makeDateFromStringAndFormat(tempConfig);
      if (!isValid(tempConfig)) continue;
      currentScore += tempConfig._pf.charsLeftOver;
      currentScore += tempConfig._pf.unusedTokens.length * 10;
      tempConfig._pf.score = currentScore;
      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig
      }
    }
    extend(config, bestMoment || tempConfig)
  }

  function parseISO(config) {
    var i, l, string = config._i,
      match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 0, l = isoDates.length; i < l; i++)
        if (isoDates[i][1].exec(string)) {
          config._f =
            isoDates[i][0] + (match[6] || " ");
          break
        }
      for (i = 0, l = isoTimes.length; i < l; i++)
        if (isoTimes[i][1].exec(string)) {
          config._f += isoTimes[i][0];
          break
        }
      if (string.match(parseTokenTimezone)) config._f += "Z";
      makeDateFromStringAndFormat(config)
    } else config._isValid = false
  }

  function makeDateFromString(config) {
    parseISO(config);
    if (config._isValid === false) {
      delete config._isValid;
      moment.createFromInputFallback(config)
    }
  }

  function map(arr, fn) {
    var res = [],
      i;
    for (i = 0; i < arr.length; ++i) res.push(fn(arr[i], i));
    return res
  }

  function makeDateFromInput(config) {
    var input =
      config._i,
      matched;
    if (input === undefined) config._d = new Date;
    else if (isDate(input)) config._d = new Date(+input);
    else if ((matched = aspNetJsonRegex.exec(input)) !== null) config._d = new Date(+matched[1]);
    else if (typeof input === "string") makeDateFromString(config);
    else if (isArray(input)) {
      config._a = map(input.slice(0), function(obj) {
        return parseInt(obj, 10)
      });
      dateFromConfig(config)
    } else if (typeof input === "object") dateFromObject(config);
    else if (typeof input === "number") config._d = new Date(input);
    else moment.createFromInputFallback(config)
  }

  function makeDate(y, m, d, h, M, s, ms) {
    var date = new Date(y, m, d, h, M, s, ms);
    if (y < 1970) date.setFullYear(y);
    return date
  }

  function makeUTCDate(y) {
    var date = new Date(Date.UTC.apply(null, arguments));
    if (y < 1970) date.setUTCFullYear(y);
    return date
  }

  function parseWeekday(input, locale) {
    if (typeof input === "string")
      if (!isNaN(input)) input = parseInt(input, 10);
      else {
        input = locale.weekdaysParse(input);
        if (typeof input !== "number") return null
      }
    return input
  }

  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number ||
      1, !!withoutSuffix, string, isFuture)
  }

  function relativeTime(posNegDuration, withoutSuffix, locale) {
    var duration = moment.duration(posNegDuration).abs(),
      seconds = round(duration.as("s")),
      minutes = round(duration.as("m")),
      hours = round(duration.as("h")),
      days = round(duration.as("d")),
      months = round(duration.as("M")),
      years = round(duration.as("y")),
      args = seconds < relativeTimeThresholds.s && ["s", seconds] || minutes === 1 && ["m"] || minutes < relativeTimeThresholds.m && ["mm", minutes] || hours === 1 && ["h"] || hours < relativeTimeThresholds.h && ["hh", hours] || days === 1 && ["d"] || days < relativeTimeThresholds.d && ["dd", days] || months === 1 && ["M"] || months < relativeTimeThresholds.M && ["MM", months] || years === 1 && ["y"] || ["yy", years];
    args[2] = withoutSuffix;
    args[3] = +posNegDuration > 0;
    args[4] = locale;
    return substituteTimeAgo.apply({}, args)
  }

  function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
    var end = firstDayOfWeekOfYear - firstDayOfWeek,
      daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
      adjustedMoment;
    if (daysToDayOfWeek > end) daysToDayOfWeek -= 7;
    if (daysToDayOfWeek <
      end - 7) daysToDayOfWeek += 7;
    adjustedMoment = moment(mom).add(daysToDayOfWeek, "d");
    return {
      week: Math.ceil(adjustedMoment.dayOfYear() / 7),
      year: adjustedMoment.year()
    }
  }

  function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
    var d = makeUTCDate(year, 0, 1).getUTCDay(),
      daysToAdd, dayOfYear;
    d = d === 0 ? 7 : d;
    weekday = weekday != null ? weekday : firstDayOfWeek;
    daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
    dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
    return {
      year: dayOfYear >
        0 ? year : year - 1,
      dayOfYear: dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
    }
  }

  function makeMoment(config) {
    var input = config._i,
      format = config._f,
      res;
    config._locale = config._locale || moment.localeData(config._l);
    if (input === null || format === undefined && input === "") return moment.invalid({
      nullInput: true
    });
    if (typeof input === "string") config._i = input = config._locale.preparse(input);
    if (moment.isMoment(input)) return new Moment(input, true);
    else if (format)
      if (isArray(format)) makeDateFromStringAndArray(config);
      else makeDateFromStringAndFormat(config);
    else makeDateFromInput(config);
    res = new Moment(config);
    if (res._nextDay) {
      res.add(1, "d");
      res._nextDay = undefined
    }
    return res
  }
  moment = function(input, format, locale, strict) {
    var c;
    if (typeof locale === "boolean") {
      strict = locale;
      locale = undefined
    }
    c = {};
    c._isAMomentObject = true;
    c._i = input;
    c._f = format;
    c._l = locale;
    c._strict = strict;
    c._isUTC = false;
    c._pf = defaultParsingFlags();
    return makeMoment(c)
  };
  moment.suppressDeprecationWarnings = false;
  moment.createFromInputFallback = deprecate("moment construction falls back to js Date. This is " +
    "discouraged and will be removed in upcoming major " + "release. Please refer to " + "https://github.com/moment/moment/issues/1407 for more info.",
    function(config) {
      config._d = new Date(config._i + (config._useUTC ? " UTC" : ""))
    });

  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) moments = moments[0];
    if (!moments.length) return moment();
    res = moments[0];
    for (i = 1; i < moments.length; ++i)
      if (moments[i][fn](res)) res = moments[i];
    return res
  }
  moment.min = function() {
    var args = [].slice.call(arguments,
      0);
    return pickBy("isBefore", args)
  };
  moment.max = function() {
    var args = [].slice.call(arguments, 0);
    return pickBy("isAfter", args)
  };
  moment.utc = function(input, format, locale, strict) {
    var c;
    if (typeof locale === "boolean") {
      strict = locale;
      locale = undefined
    }
    c = {};
    c._isAMomentObject = true;
    c._useUTC = true;
    c._isUTC = true;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;
    c._pf = defaultParsingFlags();
    return makeMoment(c).utc()
  };
  moment.unix = function(input) {
    return moment(input * 1E3)
  };
  moment.duration = function(input, key) {
    var duration =
      input,
      match = null,
      sign, ret, parseIso, diffRes;
    if (moment.isDuration(input)) duration = {
      ms: input._milliseconds,
      d: input._days,
      M: input._months
    };
    else if (typeof input === "number") {
      duration = {};
      if (key) duration[key] = input;
      else duration.milliseconds = input
    } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
      sign = match[1] === "-" ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      }
    } else if (!!(match = isoDurationRegex.exec(input))) {
      sign =
        match[1] === "-" ? -1 : 1;
      parseIso = function(inp) {
        var res = inp && parseFloat(inp.replace(",", "."));
        return (isNaN(res) ? 0 : res) * sign
      };
      duration = {
        y: parseIso(match[2]),
        M: parseIso(match[3]),
        d: parseIso(match[4]),
        h: parseIso(match[5]),
        m: parseIso(match[6]),
        s: parseIso(match[7]),
        w: parseIso(match[8])
      }
    } else if (duration == null) duration = {};
    else if (typeof duration === "object" && ("from" in duration || "to" in duration)) {
      diffRes = momentsDifference(moment(duration.from), moment(duration.to));
      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months
    }
    ret = new Duration(duration);
    if (moment.isDuration(input) && hasOwnProp(input, "_locale")) ret._locale = input._locale;
    return ret
  };
  moment.version = VERSION;
  moment.defaultFormat = isoFormat;
  moment.ISO_8601 = function() {};
  moment.momentProperties = momentProperties;
  moment.updateOffset = function() {};
  moment.relativeTimeThreshold = function(threshold, limit) {
    if (relativeTimeThresholds[threshold] === undefined) return false;
    if (limit === undefined) return relativeTimeThresholds[threshold];
    relativeTimeThresholds[threshold] =
      limit;
    return true
  };
  moment.lang = deprecate("moment.lang is deprecated. Use moment.locale instead.", function(key, value) {
    return moment.locale(key, value)
  });
  moment.locale = function(key, values) {
    var data;
    if (key) {
      if (typeof values !== "undefined") data = moment.defineLocale(key, values);
      else data = moment.localeData(key);
      if (data) moment.duration._locale = moment._locale = data
    }
    return moment._locale._abbr
  };
  moment.defineLocale = function(name, values) {
    if (values !== null) {
      values.abbr = name;
      if (!locales[name]) locales[name] = new Locale;
      locales[name].set(values);
      moment.locale(name);
      return locales[name]
    } else {
      delete locales[name];
      return null
    }
  };
  moment.langData = deprecate("moment.langData is deprecated. Use moment.localeData instead.", function(key) {
    return moment.localeData(key)
  });
  moment.localeData = function(key) {
    var locale;
    if (key && key._locale && key._locale._abbr) key = key._locale._abbr;
    if (!key) return moment._locale;
    if (!isArray(key)) {
      locale = loadLocale(key);
      if (locale) return locale;
      key = [key]
    }
    return chooseLocale(key)
  };
  moment.isMoment = function(obj) {
    return obj instanceof
    Moment || obj != null && hasOwnProp(obj, "_isAMomentObject")
  };
  moment.isDuration = function(obj) {
    return obj instanceof Duration
  };
  for (i = lists.length - 1; i >= 0; --i) makeList(lists[i]);
  moment.normalizeUnits = function(units) {
    return normalizeUnits(units)
  };
  moment.invalid = function(flags) {
    var m = moment.utc(NaN);
    if (flags != null) extend(m._pf, flags);
    else m._pf.userInvalidated = true;
    return m
  };
  moment.parseZone = function() {
    return moment.apply(null, arguments).parseZone()
  };
  moment.parseTwoDigitYear = function(input) {
    return toInt(input) +
      (toInt(input) > 68 ? 1900 : 2E3)
  };
  moment.isDate = isDate;
  extend(moment.fn = Moment.prototype, {
    clone: function() {
      return moment(this)
    },
    valueOf: function() {
      return +this._d - (this._offset || 0) * 6E4
    },
    unix: function() {
      return Math.floor(+this / 1E3)
    },
    toString: function() {
      return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")
    },
    toDate: function() {
      return this._offset ? new Date(+this) : this._d
    },
    toISOString: function() {
      var m = moment(this).utc();
      if (0 < m.year() && m.year() <= 9999)
        if ("function" === typeof Date.prototype.toISOString) return this.toDate().toISOString();
        else return formatMoment(m, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
      else return formatMoment(m, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
    },
    toArray: function() {
      var m = this;
      return [m.year(), m.month(), m.date(), m.hours(), m.minutes(), m.seconds(), m.milliseconds()]
    },
    isValid: function() {
      return isValid(this)
    },
    isDSTShifted: function() {
      if (this._a) return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
      return false
    },
    parsingFlags: function() {
      return extend({}, this._pf)
    },
    invalidAt: function() {
      return this._pf.overflow
    },
    utc: function(keepLocalTime) {
      return this.utcOffset(0, keepLocalTime)
    },
    local: function(keepLocalTime) {
      if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;
        if (keepLocalTime) this.subtract(this._dateUtcOffset(), "m")
      }
      return this
    },
    format: function(inputString) {
      var output = formatMoment(this, inputString || moment.defaultFormat);
      return this.localeData().postformat(output)
    },
    add: createAdder(1, "add"),
    subtract: createAdder(-1, "subtract"),
    diff: function(input, units, asFloat) {
      var that = makeAs(input, this),
        zoneDiff =
        (that.utcOffset() - this.utcOffset()) * 6E4,
        anchor, diff, output, daysAdjust;
      units = normalizeUnits(units);
      if (units === "year" || units === "month" || units === "quarter") {
        output = monthDiff(this, that);
        if (units === "quarter") output = output / 3;
        else if (units === "year") output = output / 12
      } else {
        diff = this - that;
        output = units === "second" ? diff / 1E3 : units === "minute" ? diff / 6E4 : units === "hour" ? diff / 36E5 : units === "day" ? (diff - zoneDiff) / 864E5 : units === "week" ? (diff - zoneDiff) / 6048E5 : diff
      }
      return asFloat ? output : absRound(output)
    },
    from: function(time, withoutSuffix) {
      return moment.duration({
        to: this,
        from: time
      }).locale(this.locale()).humanize(!withoutSuffix)
    },
    fromNow: function(withoutSuffix) {
      return this.from(moment(), withoutSuffix)
    },
    calendar: function(time) {
      var now = time || moment(),
        sod = makeAs(now, this).startOf("day"),
        diff = this.diff(sod, "days", true),
        format = diff < -6 ? "sameElse" : diff < -1 ? "lastWeek" : diff < 0 ? "lastDay" : diff < 1 ? "sameDay" : diff < 2 ? "nextDay" : diff < 7 ? "nextWeek" : "sameElse";
      return this.format(this.localeData().calendar(format, this, moment(now)))
    },
    isLeapYear: function() {
      return isLeapYear(this.year())
    },
    isDST: function() {
      return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset()
    },
    day: function(input) {
      var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, "d")
      } else return day
    },
    month: makeAccessor("Month", true),
    startOf: function(units) {
      units = normalizeUnits(units);
      switch (units) {
        case "year":
          this.month(0);
        case "quarter":
        case "month":
          this.date(1);
        case "week":
        case "isoWeek":
        case "day":
          this.hours(0);
        case "hour":
          this.minutes(0);
        case "minute":
          this.seconds(0);
        case "second":
          this.milliseconds(0)
      }
      if (units === "week") this.weekday(0);
      else if (units === "isoWeek") this.isoWeekday(1);
      if (units === "quarter") this.month(Math.floor(this.month() / 3) * 3);
      return this
    },
    endOf: function(units) {
      units = normalizeUnits(units);
      if (units === undefined || units === "millisecond") return this;
      return this.startOf(units).add(1, units === "isoWeek" ? "week" : units).subtract(1, "ms")
    },
    isAfter: function(input, units) {
      var inputMs;
      units = normalizeUnits(typeof units !==
        "undefined" ? units : "millisecond");
      if (units === "millisecond") {
        input = moment.isMoment(input) ? input : moment(input);
        return +this > +input
      } else {
        inputMs = moment.isMoment(input) ? +input : +moment(input);
        return inputMs < +this.clone().startOf(units)
      }
    },
    isBefore: function(input, units) {
      var inputMs;
      units = normalizeUnits(typeof units !== "undefined" ? units : "millisecond");
      if (units === "millisecond") {
        input = moment.isMoment(input) ? input : moment(input);
        return +this < +input
      } else {
        inputMs = moment.isMoment(input) ? +input : +moment(input);
        return +this.clone().endOf(units) <
          inputMs
      }
    },
    isBetween: function(from, to, units) {
      return this.isAfter(from, units) && this.isBefore(to, units)
    },
    isSame: function(input, units) {
      var inputMs;
      units = normalizeUnits(units || "millisecond");
      if (units === "millisecond") {
        input = moment.isMoment(input) ? input : moment(input);
        return +this === +input
      } else {
        inputMs = +moment(input);
        return +this.clone().startOf(units) <= inputMs && inputMs <= +this.clone().endOf(units)
      }
    },
    min: deprecate("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",
      function(other) {
        other = moment.apply(null, arguments);
        return other < this ? this : other
      }),
    max: deprecate("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548", function(other) {
      other = moment.apply(null, arguments);
      return other > this ? this : other
    }),
    zone: deprecate("moment().zone is deprecated, use moment().utcOffset instead. " + "https://github.com/moment/moment/issues/1779", function(input, keepLocalTime) {
      if (input != null) {
        if (typeof input !== "string") input = -input;
        this.utcOffset(input,
          keepLocalTime);
        return this
      } else return -this.utcOffset()
    }),
    utcOffset: function(input, keepLocalTime) {
      var offset = this._offset || 0,
        localAdjust;
      if (input != null) {
        if (typeof input === "string") input = utcOffsetFromString(input);
        if (Math.abs(input) < 16) input = input * 60;
        if (!this._isUTC && keepLocalTime) localAdjust = this._dateUtcOffset();
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) this.add(localAdjust, "m");
        if (offset !== input)
          if (!keepLocalTime || this._changeInProgress) addOrSubtractDurationFromMoment(this, moment.duration(input -
            offset, "m"), 1, false);
          else if (!this._changeInProgress) {
          this._changeInProgress = true;
          moment.updateOffset(this, true);
          this._changeInProgress = null
        }
        return this
      } else return this._isUTC ? offset : this._dateUtcOffset()
    },
    isLocal: function() {
      return !this._isUTC
    },
    isUtcOffset: function() {
      return this._isUTC
    },
    isUtc: function() {
      return this._isUTC && this._offset === 0
    },
    zoneAbbr: function() {
      return this._isUTC ? "UTC" : ""
    },
    zoneName: function() {
      return this._isUTC ? "Coordinated Universal Time" : ""
    },
    parseZone: function() {
      if (this._tzm) this.utcOffset(this._tzm);
      else if (typeof this._i === "string") this.utcOffset(utcOffsetFromString(this._i));
      return this
    },
    hasAlignedHourOffset: function(input) {
      if (!input) input = 0;
      else input = moment(input).utcOffset();
      return (this.utcOffset() - input) % 60 === 0
    },
    daysInMonth: function() {
      return daysInMonth(this.year(), this.month())
    },
    dayOfYear: function(input) {
      var dayOfYear = round((moment(this).startOf("day") - moment(this).startOf("year")) / 864E5) + 1;
      return input == null ? dayOfYear : this.add(input - dayOfYear, "d")
    },
    quarter: function(input) {
      return input ==
        null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3)
    },
    weekYear: function(input) {
      var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
      return input == null ? year : this.add(input - year, "y")
    },
    isoWeekYear: function(input) {
      var year = weekOfYear(this, 1, 4).year;
      return input == null ? year : this.add(input - year, "y")
    },
    week: function(input) {
      var week = this.localeData().week(this);
      return input == null ? week : this.add((input - week) * 7, "d")
    },
    isoWeek: function(input) {
      var week = weekOfYear(this,
        1, 4).week;
      return input == null ? week : this.add((input - week) * 7, "d")
    },
    weekday: function(input) {
      var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
      return input == null ? weekday : this.add(input - weekday, "d")
    },
    isoWeekday: function(input) {
      return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7)
    },
    isoWeeksInYear: function() {
      return weeksInYear(this.year(), 1, 4)
    },
    weeksInYear: function() {
      var weekInfo = this.localeData()._week;
      return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy)
    },
    get: function(units) {
      units =
        normalizeUnits(units);
      return this[units]()
    },
    set: function(units, value) {
      var unit;
      if (typeof units === "object")
        for (unit in units) this.set(unit, units[unit]);
      else {
        units = normalizeUnits(units);
        if (typeof this[units] === "function") this[units](value)
      }
      return this
    },
    locale: function(key) {
      var newLocaleData;
      if (key === undefined) return this._locale._abbr;
      else {
        newLocaleData = moment.localeData(key);
        if (newLocaleData != null) this._locale = newLocaleData;
        return this
      }
    },
    lang: deprecate("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",
      function(key) {
        if (key === undefined) return this.localeData();
        else return this.locale(key)
      }),
    localeData: function() {
      return this._locale
    },
    _dateUtcOffset: function() {
      return -Math.round(this._d.getTimezoneOffset() / 15) * 15
    }
  });

  function rawMonthSetter(mom, value) {
    var dayOfMonth;
    if (typeof value === "string") {
      value = mom.localeData().monthsParse(value);
      if (typeof value !== "number") return mom
    }
    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d["set" + (mom._isUTC ? "UTC" : "") + "Month"](value, dayOfMonth);
    return mom
  }

  function rawGetter(mom, unit) {
    return mom._d["get" + (mom._isUTC ? "UTC" : "") + unit]()
  }

  function rawSetter(mom, unit, value) {
    if (unit === "Month") return rawMonthSetter(mom, value);
    else return mom._d["set" + (mom._isUTC ? "UTC" : "") + unit](value)
  }

  function makeAccessor(unit, keepTime) {
    return function(value) {
      if (value != null) {
        rawSetter(this, unit, value);
        moment.updateOffset(this, keepTime);
        return this
      } else return rawGetter(this, unit)
    }
  }
  moment.fn.millisecond = moment.fn.milliseconds = makeAccessor("Milliseconds", false);
  moment.fn.second =
    moment.fn.seconds = makeAccessor("Seconds", false);
  moment.fn.minute = moment.fn.minutes = makeAccessor("Minutes", false);
  moment.fn.hour = moment.fn.hours = makeAccessor("Hours", true);
  moment.fn.date = makeAccessor("Date", true);
  moment.fn.dates = deprecate("dates accessor is deprecated. Use date instead.", makeAccessor("Date", true));
  moment.fn.year = makeAccessor("FullYear", true);
  moment.fn.years = deprecate("years accessor is deprecated. Use year instead.", makeAccessor("FullYear", true));
  moment.fn.days = moment.fn.day;
  moment.fn.months =
    moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  moment.fn.quarters = moment.fn.quarter;
  moment.fn.toJSON = moment.fn.toISOString;
  moment.fn.isUTC = moment.fn.isUtc;

  function daysToYears(days) {
    return days * 400 / 146097
  }

  function yearsToDays(years) {
    return years * 146097 / 400
  }
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function() {
      var milliseconds = this._milliseconds,
        days = this._days,
        months = this._months,
        data = this._data,
        seconds, minutes, hours, years = 0;
      data.milliseconds = milliseconds %
        1E3;
      seconds = absRound(milliseconds / 1E3);
      data.seconds = seconds % 60;
      minutes = absRound(seconds / 60);
      data.minutes = minutes % 60;
      hours = absRound(minutes / 60);
      data.hours = hours % 24;
      days += absRound(hours / 24);
      years = absRound(daysToYears(days));
      days -= absRound(yearsToDays(years));
      months += absRound(days / 30);
      days %= 30;
      years += absRound(months / 12);
      months %= 12;
      data.days = days;
      data.months = months;
      data.years = years
    },
    abs: function() {
      this._milliseconds = Math.abs(this._milliseconds);
      this._days = Math.abs(this._days);
      this._months = Math.abs(this._months);
      this._data.milliseconds = Math.abs(this._data.milliseconds);
      this._data.seconds = Math.abs(this._data.seconds);
      this._data.minutes = Math.abs(this._data.minutes);
      this._data.hours = Math.abs(this._data.hours);
      this._data.months = Math.abs(this._data.months);
      this._data.years = Math.abs(this._data.years);
      return this
    },
    weeks: function() {
      return absRound(this.days() / 7)
    },
    valueOf: function() {
      return this._milliseconds + this._days * 864E5 + this._months % 12 * 2592E6 + toInt(this._months / 12) * 31536E6
    },
    humanize: function(withSuffix) {
      var output =
        relativeTime(this, !withSuffix, this.localeData());
      if (withSuffix) output = this.localeData().pastFuture(+this, output);
      return this.localeData().postformat(output)
    },
    add: function(input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds += dur._milliseconds;
      this._days += dur._days;
      this._months += dur._months;
      this._bubble();
      return this
    },
    subtract: function(input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds -= dur._milliseconds;
      this._days -= dur._days;
      this._months -= dur._months;
      this._bubble();
      return this
    },
    get: function(units) {
      units = normalizeUnits(units);
      return this[units.toLowerCase() + "s"]()
    },
    as: function(units) {
      var days, months;
      units = normalizeUnits(units);
      if (units === "month" || units === "year") {
        days = this._days + this._milliseconds / 864E5;
        months = this._months + daysToYears(days) * 12;
        return units === "month" ? months : months / 12
      } else {
        days = this._days + Math.round(yearsToDays(this._months / 12));
        switch (units) {
          case "week":
            return days / 7 + this._milliseconds / 6048E5;
          case "day":
            return days + this._milliseconds / 864E5;
          case "hour":
            return days *
              24 + this._milliseconds / 36E5;
          case "minute":
            return days * 24 * 60 + this._milliseconds / 6E4;
          case "second":
            return days * 24 * 60 * 60 + this._milliseconds / 1E3;
          case "millisecond":
            return Math.floor(days * 24 * 60 * 60 * 1E3) + this._milliseconds;
          default:
            throw new Error("Unknown unit " + units);
        }
      }
    },
    lang: moment.fn.lang,
    locale: moment.fn.locale,
    toIsoString: deprecate("toIsoString() is deprecated. Please use toISOString() instead " + "(notice the capitals)", function() {
      return this.toISOString()
    }),
    toISOString: function() {
      var years = Math.abs(this.years()),
        months = Math.abs(this.months()),
        days = Math.abs(this.days()),
        hours = Math.abs(this.hours()),
        minutes = Math.abs(this.minutes()),
        seconds = Math.abs(this.seconds() + this.milliseconds() / 1E3);
      if (!this.asSeconds()) return "P0D";
      return (this.asSeconds() < 0 ? "-" : "") + "P" + (years ? years + "Y" : "") + (months ? months + "M" : "") + (days ? days + "D" : "") + (hours || minutes || seconds ? "T" : "") + (hours ? hours + "H" : "") + (minutes ? minutes + "M" : "") + (seconds ? seconds + "S" : "")
    },
    localeData: function() {
      return this._locale
    },
    toJSON: function() {
      return this.toISOString()
    }
  });
  moment.duration.fn.toString = moment.duration.fn.toISOString;

  function makeDurationGetter(name) {
    moment.duration.fn[name] = function() {
      return this._data[name]
    }
  }
  for (i in unitMillisecondFactors)
    if (hasOwnProp(unitMillisecondFactors, i)) makeDurationGetter(i.toLowerCase());
  moment.duration.fn.asMilliseconds = function() {
    return this.as("ms")
  };
  moment.duration.fn.asSeconds = function() {
    return this.as("s")
  };
  moment.duration.fn.asMinutes = function() {
    return this.as("m")
  };
  moment.duration.fn.asHours = function() {
    return this.as("h")
  };
  moment.duration.fn.asDays = function() {
    return this.as("d")
  };
  moment.duration.fn.asWeeks = function() {
    return this.as("weeks")
  };
  moment.duration.fn.asMonths = function() {
    return this.as("M")
  };
  moment.duration.fn.asYears = function() {
    return this.as("y")
  };
  moment.locale("en", {
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function(number) {
      var b = number % 10,
        output = toInt(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
      return number + output
    }
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("af", {
      months: "Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember".split("_"),
      monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des".split("_"),
      weekdays: "Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag".split("_"),
      weekdaysShort: "Son_Maa_Din_Woe_Don_Vry_Sat".split("_"),
      weekdaysMin: "So_Ma_Di_Wo_Do_Vr_Sa".split("_"),
      meridiemParse: /vm|nm/i,
      isPM: function(input) {
        return /^nm$/i.test(input)
      },
      meridiem: function(hours, minutes, isLower) {
        if (hours < 12) return isLower ?
          "vm" : "VM";
        else return isLower ? "nm" : "NM"
      },
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Vandag om] LT",
        nextDay: "[M\u00f4re om] LT",
        nextWeek: "dddd [om] LT",
        lastDay: "[Gister om] LT",
        lastWeek: "[Laas] dddd [om] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "oor %s",
        past: "%s gelede",
        s: "'n paar sekondes",
        m: "'n minuut",
        mm: "%d minute",
        h: "'n uur",
        hh: "%d ure",
        d: "'n dag",
        dd: "%d dae",
        M: "'n maand",
        MM: "%d maande",
        y: "'n jaar",
        yy: "%d jaar"
      },
      ordinalParse: /\d{1,2}(ste|de)/,
      ordinal: function(number) {
        return number + (number === 1 || number === 8 || number >= 20 ? "ste" : "de")
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ar-ma", {
      months: "\u064a\u0646\u0627\u064a\u0631_\u0641\u0628\u0631\u0627\u064a\u0631_\u0645\u0627\u0631\u0633_\u0623\u0628\u0631\u064a\u0644_\u0645\u0627\u064a_\u064a\u0648\u0646\u064a\u0648_\u064a\u0648\u0644\u064a\u0648\u0632_\u063a\u0634\u062a_\u0634\u062a\u0646\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0646\u0628\u0631_\u062f\u062c\u0646\u0628\u0631".split("_"),
      monthsShort: "\u064a\u0646\u0627\u064a\u0631_\u0641\u0628\u0631\u0627\u064a\u0631_\u0645\u0627\u0631\u0633_\u0623\u0628\u0631\u064a\u0644_\u0645\u0627\u064a_\u064a\u0648\u0646\u064a\u0648_\u064a\u0648\u0644\u064a\u0648\u0632_\u063a\u0634\u062a_\u0634\u062a\u0646\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0646\u0628\u0631_\u062f\u062c\u0646\u0628\u0631".split("_"),
      weekdays: "\u0627\u0644\u0623\u062d\u062f_\u0627\u0644\u0625\u062a\u0646\u064a\u0646_\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621_\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621_\u0627\u0644\u062e\u0645\u064a\u0633_\u0627\u0644\u062c\u0645\u0639\u0629_\u0627\u0644\u0633\u0628\u062a".split("_"),
      weekdaysShort: "\u0627\u062d\u062f_\u0627\u062a\u0646\u064a\u0646_\u062b\u0644\u0627\u062b\u0627\u0621_\u0627\u0631\u0628\u0639\u0627\u0621_\u062e\u0645\u064a\u0633_\u062c\u0645\u0639\u0629_\u0633\u0628\u062a".split("_"),
      weekdaysMin: "\u062d_\u0646_\u062b_\u0631_\u062e_\u062c_\u0633".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u0627\u0644\u064a\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextDay: "[\u063a\u062f\u0627 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastDay: "[\u0623\u0645\u0633 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0641\u064a %s",
        past: "\u0645\u0646\u0630 %s",
        s: "\u062b\u0648\u0627\u0646",
        m: "\u062f\u0642\u064a\u0642\u0629",
        mm: "%d \u062f\u0642\u0627\u0626\u0642",
        h: "\u0633\u0627\u0639\u0629",
        hh: "%d \u0633\u0627\u0639\u0627\u062a",
        d: "\u064a\u0648\u0645",
        dd: "%d \u0623\u064a\u0627\u0645",
        M: "\u0634\u0647\u0631",
        MM: "%d \u0623\u0634\u0647\u0631",
        y: "\u0633\u0646\u0629",
        yy: "%d \u0633\u0646\u0648\u0627\u062a"
      },
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0661",
        2: "\u0662",
        3: "\u0663",
        4: "\u0664",
        5: "\u0665",
        6: "\u0666",
        7: "\u0667",
        8: "\u0668",
        9: "\u0669",
        0: "\u0660"
      },
      numberMap = {
        "\u0661": "1",
        "\u0662": "2",
        "\u0663": "3",
        "\u0664": "4",
        "\u0665": "5",
        "\u0666": "6",
        "\u0667": "7",
        "\u0668": "8",
        "\u0669": "9",
        "\u0660": "0"
      };
    return moment.defineLocale("ar-sa", {
      months: "\u064a\u0646\u0627\u064a\u0631_\u0641\u0628\u0631\u0627\u064a\u0631_\u0645\u0627\u0631\u0633_\u0623\u0628\u0631\u064a\u0644_\u0645\u0627\u064a\u0648_\u064a\u0648\u0646\u064a\u0648_\u064a\u0648\u0644\u064a\u0648_\u0623\u063a\u0633\u0637\u0633_\u0633\u0628\u062a\u0645\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0641\u0645\u0628\u0631_\u062f\u064a\u0633\u0645\u0628\u0631".split("_"),
      monthsShort: "\u064a\u0646\u0627\u064a\u0631_\u0641\u0628\u0631\u0627\u064a\u0631_\u0645\u0627\u0631\u0633_\u0623\u0628\u0631\u064a\u0644_\u0645\u0627\u064a\u0648_\u064a\u0648\u0646\u064a\u0648_\u064a\u0648\u0644\u064a\u0648_\u0623\u063a\u0633\u0637\u0633_\u0633\u0628\u062a\u0645\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0641\u0645\u0628\u0631_\u062f\u064a\u0633\u0645\u0628\u0631".split("_"),
      weekdays: "\u0627\u0644\u0623\u062d\u062f_\u0627\u0644\u0625\u062b\u0646\u064a\u0646_\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621_\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621_\u0627\u0644\u062e\u0645\u064a\u0633_\u0627\u0644\u062c\u0645\u0639\u0629_\u0627\u0644\u0633\u0628\u062a".split("_"),
      weekdaysShort: "\u0623\u062d\u062f_\u0625\u062b\u0646\u064a\u0646_\u062b\u0644\u0627\u062b\u0627\u0621_\u0623\u0631\u0628\u0639\u0627\u0621_\u062e\u0645\u064a\u0633_\u062c\u0645\u0639\u0629_\u0633\u0628\u062a".split("_"),
      weekdaysMin: "\u062d_\u0646_\u062b_\u0631_\u062e_\u062c_\u0633".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      meridiemParse: /\u0635|\u0645/,
      isPM: function(input) {
        return "\u0645" === input
      },
      meridiem: function(hour,
        minute, isLower) {
        if (hour < 12) return "\u0635";
        else return "\u0645"
      },
      calendar: {
        sameDay: "[\u0627\u0644\u064a\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextDay: "[\u063a\u062f\u0627 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastDay: "[\u0623\u0645\u0633 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0641\u064a %s",
        past: "\u0645\u0646\u0630 %s",
        s: "\u062b\u0648\u0627\u0646",
        m: "\u062f\u0642\u064a\u0642\u0629",
        mm: "%d \u062f\u0642\u0627\u0626\u0642",
        h: "\u0633\u0627\u0639\u0629",
        hh: "%d \u0633\u0627\u0639\u0627\u062a",
        d: "\u064a\u0648\u0645",
        dd: "%d \u0623\u064a\u0627\u0645",
        M: "\u0634\u0647\u0631",
        MM: "%d \u0623\u0634\u0647\u0631",
        y: "\u0633\u0646\u0629",
        yy: "%d \u0633\u0646\u0648\u0627\u062a"
      },
      preparse: function(string) {
        return string.replace(/[\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660]/g,
          function(match) {
            return numberMap[match]
          }).replace(/\u060c/g, ",")
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        }).replace(/,/g, "\u060c")
      },
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ar-tn", {
      months: "\u062c\u0627\u0646\u0641\u064a_\u0641\u064a\u0641\u0631\u064a_\u0645\u0627\u0631\u0633_\u0623\u0641\u0631\u064a\u0644_\u0645\u0627\u064a_\u062c\u0648\u0627\u0646_\u062c\u0648\u064a\u0644\u064a\u0629_\u0623\u0648\u062a_\u0633\u0628\u062a\u0645\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0641\u0645\u0628\u0631_\u062f\u064a\u0633\u0645\u0628\u0631".split("_"),
      monthsShort: "\u062c\u0627\u0646\u0641\u064a_\u0641\u064a\u0641\u0631\u064a_\u0645\u0627\u0631\u0633_\u0623\u0641\u0631\u064a\u0644_\u0645\u0627\u064a_\u062c\u0648\u0627\u0646_\u062c\u0648\u064a\u0644\u064a\u0629_\u0623\u0648\u062a_\u0633\u0628\u062a\u0645\u0628\u0631_\u0623\u0643\u062a\u0648\u0628\u0631_\u0646\u0648\u0641\u0645\u0628\u0631_\u062f\u064a\u0633\u0645\u0628\u0631".split("_"),
      weekdays: "\u0627\u0644\u0623\u062d\u062f_\u0627\u0644\u0625\u062b\u0646\u064a\u0646_\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621_\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621_\u0627\u0644\u062e\u0645\u064a\u0633_\u0627\u0644\u062c\u0645\u0639\u0629_\u0627\u0644\u0633\u0628\u062a".split("_"),
      weekdaysShort: "\u0623\u062d\u062f_\u0625\u062b\u0646\u064a\u0646_\u062b\u0644\u0627\u062b\u0627\u0621_\u0623\u0631\u0628\u0639\u0627\u0621_\u062e\u0645\u064a\u0633_\u062c\u0645\u0639\u0629_\u0633\u0628\u062a".split("_"),
      weekdaysMin: "\u062d_\u0646_\u062b_\u0631_\u062e_\u062c_\u0633".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u0627\u0644\u064a\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextDay: "[\u063a\u062f\u0627 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastDay: "[\u0623\u0645\u0633 \u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastWeek: "dddd [\u0639\u0644\u0649 \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0641\u064a %s",
        past: "\u0645\u0646\u0630 %s",
        s: "\u062b\u0648\u0627\u0646",
        m: "\u062f\u0642\u064a\u0642\u0629",
        mm: "%d \u062f\u0642\u0627\u0626\u0642",
        h: "\u0633\u0627\u0639\u0629",
        hh: "%d \u0633\u0627\u0639\u0627\u062a",
        d: "\u064a\u0648\u0645",
        dd: "%d \u0623\u064a\u0627\u0645",
        M: "\u0634\u0647\u0631",
        MM: "%d \u0623\u0634\u0647\u0631",
        y: "\u0633\u0646\u0629",
        yy: "%d \u0633\u0646\u0648\u0627\u062a"
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0661",
        2: "\u0662",
        3: "\u0663",
        4: "\u0664",
        5: "\u0665",
        6: "\u0666",
        7: "\u0667",
        8: "\u0668",
        9: "\u0669",
        0: "\u0660"
      },
      numberMap = {
        "\u0661": "1",
        "\u0662": "2",
        "\u0663": "3",
        "\u0664": "4",
        "\u0665": "5",
        "\u0666": "6",
        "\u0667": "7",
        "\u0668": "8",
        "\u0669": "9",
        "\u0660": "0"
      },
      pluralForm = function(n) {
        return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5
      },
      plurals = {
        s: ["\u0623\u0642\u0644 \u0645\u0646 \u062b\u0627\u0646\u064a\u0629", "\u062b\u0627\u0646\u064a\u0629 \u0648\u0627\u062d\u062f\u0629", ["\u062b\u0627\u0646\u064a\u062a\u0627\u0646", "\u062b\u0627\u0646\u064a\u062a\u064a\u0646"], "%d \u062b\u0648\u0627\u0646", "%d \u062b\u0627\u0646\u064a\u0629", "%d \u062b\u0627\u0646\u064a\u0629"],
        m: ["\u0623\u0642\u0644 \u0645\u0646 \u062f\u0642\u064a\u0642\u0629", "\u062f\u0642\u064a\u0642\u0629 \u0648\u0627\u062d\u062f\u0629", ["\u062f\u0642\u064a\u0642\u062a\u0627\u0646", "\u062f\u0642\u064a\u0642\u062a\u064a\u0646"], "%d \u062f\u0642\u0627\u0626\u0642", "%d \u062f\u0642\u064a\u0642\u0629", "%d \u062f\u0642\u064a\u0642\u0629"],
        h: ["\u0623\u0642\u0644 \u0645\u0646 \u0633\u0627\u0639\u0629", "\u0633\u0627\u0639\u0629 \u0648\u0627\u062d\u062f\u0629", ["\u0633\u0627\u0639\u062a\u0627\u0646", "\u0633\u0627\u0639\u062a\u064a\u0646"],
          "%d \u0633\u0627\u0639\u0627\u062a", "%d \u0633\u0627\u0639\u0629", "%d \u0633\u0627\u0639\u0629"
        ],
        d: ["\u0623\u0642\u0644 \u0645\u0646 \u064a\u0648\u0645", "\u064a\u0648\u0645 \u0648\u0627\u062d\u062f", ["\u064a\u0648\u0645\u0627\u0646", "\u064a\u0648\u0645\u064a\u0646"], "%d \u0623\u064a\u0627\u0645", "%d \u064a\u0648\u0645\u064b\u0627", "%d \u064a\u0648\u0645"],
        M: ["\u0623\u0642\u0644 \u0645\u0646 \u0634\u0647\u0631", "\u0634\u0647\u0631 \u0648\u0627\u062d\u062f", ["\u0634\u0647\u0631\u0627\u0646", "\u0634\u0647\u0631\u064a\u0646"],
          "%d \u0623\u0634\u0647\u0631", "%d \u0634\u0647\u0631\u0627", "%d \u0634\u0647\u0631"
        ],
        y: ["\u0623\u0642\u0644 \u0645\u0646 \u0639\u0627\u0645", "\u0639\u0627\u0645 \u0648\u0627\u062d\u062f", ["\u0639\u0627\u0645\u0627\u0646", "\u0639\u0627\u0645\u064a\u0646"], "%d \u0623\u0639\u0648\u0627\u0645", "%d \u0639\u0627\u0645\u064b\u0627", "%d \u0639\u0627\u0645"]
      },
      pluralize = function(u) {
        return function(number, withoutSuffix, string, isFuture) {
          var f = pluralForm(number),
            str = plurals[u][pluralForm(number)];
          if (f === 2) str =
            str[withoutSuffix ? 0 : 1];
          return str.replace(/%d/i, number)
        }
      },
      months = ["\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u062b\u0627\u0646\u064a \u064a\u0646\u0627\u064a\u0631", "\u0634\u0628\u0627\u0637 \u0641\u0628\u0631\u0627\u064a\u0631", "\u0622\u0630\u0627\u0631 \u0645\u0627\u0631\u0633", "\u0646\u064a\u0633\u0627\u0646 \u0623\u0628\u0631\u064a\u0644", "\u0623\u064a\u0627\u0631 \u0645\u0627\u064a\u0648", "\u062d\u0632\u064a\u0631\u0627\u0646 \u064a\u0648\u0646\u064a\u0648", "\u062a\u0645\u0648\u0632 \u064a\u0648\u0644\u064a\u0648",
        "\u0622\u0628 \u0623\u063a\u0633\u0637\u0633", "\u0623\u064a\u0644\u0648\u0644 \u0633\u0628\u062a\u0645\u0628\u0631", "\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u0623\u0648\u0644 \u0623\u0643\u062a\u0648\u0628\u0631", "\u062a\u0634\u0631\u064a\u0646 \u0627\u0644\u062b\u0627\u0646\u064a \u0646\u0648\u0641\u0645\u0628\u0631", "\u0643\u0627\u0646\u0648\u0646 \u0627\u0644\u0623\u0648\u0644 \u062f\u064a\u0633\u0645\u0628\u0631"
      ];
    return moment.defineLocale("ar", {
      months: months,
      monthsShort: months,
      weekdays: "\u0627\u0644\u0623\u062d\u062f_\u0627\u0644\u0625\u062b\u0646\u064a\u0646_\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621_\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621_\u0627\u0644\u062e\u0645\u064a\u0633_\u0627\u0644\u062c\u0645\u0639\u0629_\u0627\u0644\u0633\u0628\u062a".split("_"),
      weekdaysShort: "\u0623\u062d\u062f_\u0625\u062b\u0646\u064a\u0646_\u062b\u0644\u0627\u062b\u0627\u0621_\u0623\u0631\u0628\u0639\u0627\u0621_\u062e\u0645\u064a\u0633_\u062c\u0645\u0639\u0629_\u0633\u0628\u062a".split("_"),
      weekdaysMin: "\u062d_\u0646_\u062b_\u0631_\u062e_\u062c_\u0633".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      meridiemParse: /\u0635|\u0645/,
      isPM: function(input) {
        return "\u0645" === input
      },
      meridiem: function(hour,
        minute, isLower) {
        if (hour < 12) return "\u0635";
        else return "\u0645"
      },
      calendar: {
        sameDay: "[\u0627\u0644\u064a\u0648\u0645 \u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextDay: "[\u063a\u062f\u064b\u0627 \u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        nextWeek: "dddd [\u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastDay: "[\u0623\u0645\u0633 \u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        lastWeek: "dddd [\u0639\u0646\u062f \u0627\u0644\u0633\u0627\u0639\u0629] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0628\u0639\u062f %s",
        past: "\u0645\u0646\u0630 %s",
        s: pluralize("s"),
        m: pluralize("m"),
        mm: pluralize("m"),
        h: pluralize("h"),
        hh: pluralize("h"),
        d: pluralize("d"),
        dd: pluralize("d"),
        M: pluralize("M"),
        MM: pluralize("M"),
        y: pluralize("y"),
        yy: pluralize("y")
      },
      preparse: function(string) {
        return string.replace(/[\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u0660]/g, function(match) {
          return numberMap[match]
        }).replace(/\u060c/g, ",")
      },
      postformat: function(string) {
        return string.replace(/\d/g,
          function(match) {
            return symbolMap[match]
          }).replace(/,/g, "\u060c")
      },
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var suffixes = {
      1: "-inci",
      5: "-inci",
      8: "-inci",
      70: "-inci",
      80: "-inci",
      2: "-nci",
      7: "-nci",
      20: "-nci",
      50: "-nci",
      3: "-\u00fcnc\u00fc",
      4: "-\u00fcnc\u00fc",
      100: "-\u00fcnc\u00fc",
      6: "-nc\u0131",
      9: "-uncu",
      10: "-uncu",
      30: "-uncu",
      60: "-\u0131nc\u0131",
      90: "-\u0131nc\u0131"
    };
    return moment.defineLocale("az", {
      months: "yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr".split("_"),
      monthsShort: "yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek".split("_"),
      weekdays: "Bazar_Bazar ert\u0259si_\u00c7\u0259r\u015f\u0259nb\u0259 ax\u015fam\u0131_\u00c7\u0259r\u015f\u0259nb\u0259_C\u00fcm\u0259 ax\u015fam\u0131_C\u00fcm\u0259_\u015e\u0259nb\u0259".split("_"),
      weekdaysShort: "Baz_BzE_\u00c7Ax_\u00c7\u0259r_CAx_C\u00fcm_\u015e\u0259n".split("_"),
      weekdaysMin: "Bz_BE_\u00c7A_\u00c7\u0259_CA_C\u00fc_\u015e\u0259".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[bug\u00fcn saat] LT",
        nextDay: "[sabah saat] LT",
        nextWeek: "[g\u0259l\u0259n h\u0259ft\u0259] dddd [saat] LT",
        lastDay: "[d\u00fcn\u0259n] LT",
        lastWeek: "[ke\u00e7\u0259n h\u0259ft\u0259] dddd [saat] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s sonra",
        past: "%s \u0259vv\u0259l",
        s: "birne\u00e7\u0259 saniyy\u0259",
        m: "bir d\u0259qiq\u0259",
        mm: "%d d\u0259qiq\u0259",
        h: "bir saat",
        hh: "%d saat",
        d: "bir g\u00fcn",
        dd: "%d g\u00fcn",
        M: "bir ay",
        MM: "%d ay",
        y: "bir il",
        yy: "%d il"
      },
      meridiemParse: /gec\u0259|s\u0259h\u0259r|g\u00fcnd\u00fcz|ax\u015fam/,
      isPM: function(input) {
        return /^(g\u00fcnd\u00fcz|ax\u015fam)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "gec\u0259";
        else if (hour < 12) return "s\u0259h\u0259r";
        else if (hour < 17) return "g\u00fcnd\u00fcz";
        else return "ax\u015fam"
      },
      ordinalParse: /\d{1,2}-(\u0131nc\u0131|inci|nci|\u00fcnc\u00fc|nc\u0131|uncu)/,
      ordinal: function(number) {
        if (number === 0) return number + "-\u0131nc\u0131";
        var a = number %
          10,
          b = number % 100 - a,
          c = number >= 100 ? 100 : null;
        return number + (suffixes[a] || suffixes[b] || suffixes[c])
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function plural(word, num) {
      var forms = word.split("_");
      return num % 10 === 1 && num % 100 !== 11 ? forms[0] : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
      var format = {
        "mm": withoutSuffix ? "\u0445\u0432\u0456\u043b\u0456\u043d\u0430_\u0445\u0432\u0456\u043b\u0456\u043d\u044b_\u0445\u0432\u0456\u043b\u0456\u043d" : "\u0445\u0432\u0456\u043b\u0456\u043d\u0443_\u0445\u0432\u0456\u043b\u0456\u043d\u044b_\u0445\u0432\u0456\u043b\u0456\u043d",
        "hh": withoutSuffix ? "\u0433\u0430\u0434\u0437\u0456\u043d\u0430_\u0433\u0430\u0434\u0437\u0456\u043d\u044b_\u0433\u0430\u0434\u0437\u0456\u043d" : "\u0433\u0430\u0434\u0437\u0456\u043d\u0443_\u0433\u0430\u0434\u0437\u0456\u043d\u044b_\u0433\u0430\u0434\u0437\u0456\u043d",
        "dd": "\u0434\u0437\u0435\u043d\u044c_\u0434\u043d\u0456_\u0434\u0437\u0451\u043d",
        "MM": "\u043c\u0435\u0441\u044f\u0446_\u043c\u0435\u0441\u044f\u0446\u044b_\u043c\u0435\u0441\u044f\u0446\u0430\u045e",
        "yy": "\u0433\u043e\u0434_\u0433\u0430\u0434\u044b_\u0433\u0430\u0434\u043e\u045e"
      };
      if (key === "m") return withoutSuffix ? "\u0445\u0432\u0456\u043b\u0456\u043d\u0430" : "\u0445\u0432\u0456\u043b\u0456\u043d\u0443";
      else if (key === "h") return withoutSuffix ? "\u0433\u0430\u0434\u0437\u0456\u043d\u0430" : "\u0433\u0430\u0434\u0437\u0456\u043d\u0443";
      else return number + " " + plural(format[key], +number)
    }

    function monthsCaseReplace(m, format) {
      var months = {
          "nominative": "\u0441\u0442\u0443\u0434\u0437\u0435\u043d\u044c_\u043b\u044e\u0442\u044b_\u0441\u0430\u043a\u0430\u0432\u0456\u043a_\u043a\u0440\u0430\u0441\u0430\u0432\u0456\u043a_\u0442\u0440\u0430\u0432\u0435\u043d\u044c_\u0447\u044d\u0440\u0432\u0435\u043d\u044c_\u043b\u0456\u043f\u0435\u043d\u044c_\u0436\u043d\u0456\u0432\u0435\u043d\u044c_\u0432\u0435\u0440\u0430\u0441\u0435\u043d\u044c_\u043a\u0430\u0441\u0442\u0440\u044b\u0447\u043d\u0456\u043a_\u043b\u0456\u0441\u0442\u0430\u043f\u0430\u0434_\u0441\u043d\u0435\u0436\u0430\u043d\u044c".split("_"),
          "accusative": "\u0441\u0442\u0443\u0434\u0437\u0435\u043d\u044f_\u043b\u044e\u0442\u0430\u0433\u0430_\u0441\u0430\u043a\u0430\u0432\u0456\u043a\u0430_\u043a\u0440\u0430\u0441\u0430\u0432\u0456\u043a\u0430_\u0442\u0440\u0430\u045e\u043d\u044f_\u0447\u044d\u0440\u0432\u0435\u043d\u044f_\u043b\u0456\u043f\u0435\u043d\u044f_\u0436\u043d\u0456\u045e\u043d\u044f_\u0432\u0435\u0440\u0430\u0441\u043d\u044f_\u043a\u0430\u0441\u0442\u0440\u044b\u0447\u043d\u0456\u043a\u0430_\u043b\u0456\u0441\u0442\u0430\u043f\u0430\u0434\u0430_\u0441\u043d\u0435\u0436\u043d\u044f".split("_")
        },
        nounCase = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(format) ? "accusative" : "nominative";
      return months[nounCase][m.month()]
    }

    function weekdaysCaseReplace(m, format) {
      var weekdays = {
          "nominative": "\u043d\u044f\u0434\u0437\u0435\u043b\u044f_\u043f\u0430\u043d\u044f\u0434\u0437\u0435\u043b\u0430\u043a_\u0430\u045e\u0442\u043e\u0440\u0430\u043a_\u0441\u0435\u0440\u0430\u0434\u0430_\u0447\u0430\u0446\u0432\u0435\u0440_\u043f\u044f\u0442\u043d\u0456\u0446\u0430_\u0441\u0443\u0431\u043e\u0442\u0430".split("_"),
          "accusative": "\u043d\u044f\u0434\u0437\u0435\u043b\u044e_\u043f\u0430\u043d\u044f\u0434\u0437\u0435\u043b\u0430\u043a_\u0430\u045e\u0442\u043e\u0440\u0430\u043a_\u0441\u0435\u0440\u0430\u0434\u0443_\u0447\u0430\u0446\u0432\u0435\u0440_\u043f\u044f\u0442\u043d\u0456\u0446\u0443_\u0441\u0443\u0431\u043e\u0442\u0443".split("_")
        },
        nounCase = /\[ ?[\u0412\u0432] ?(?:\u043c\u0456\u043d\u0443\u043b\u0443\u044e|\u043d\u0430\u0441\u0442\u0443\u043f\u043d\u0443\u044e)? ?\] ?dddd/.test(format) ? "accusative" : "nominative";
      return weekdays[nounCase][m.day()]
    }
    return moment.defineLocale("be", {
      months: monthsCaseReplace,
      monthsShort: "\u0441\u0442\u0443\u0434_\u043b\u044e\u0442_\u0441\u0430\u043a_\u043a\u0440\u0430\u0441_\u0442\u0440\u0430\u0432_\u0447\u044d\u0440\u0432_\u043b\u0456\u043f_\u0436\u043d\u0456\u0432_\u0432\u0435\u0440_\u043a\u0430\u0441\u0442_\u043b\u0456\u0441\u0442_\u0441\u043d\u0435\u0436".split("_"),
      weekdays: weekdaysCaseReplace,
      weekdaysShort: "\u043d\u0434_\u043f\u043d_\u0430\u0442_\u0441\u0440_\u0447\u0446_\u043f\u0442_\u0441\u0431".split("_"),
      weekdaysMin: "\u043d\u0434_\u043f\u043d_\u0430\u0442_\u0441\u0440_\u0447\u0446_\u043f\u0442_\u0441\u0431".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY \u0433.",
        LLL: "D MMMM YYYY \u0433., LT",
        LLLL: "dddd, D MMMM YYYY \u0433., LT"
      },
      calendar: {
        sameDay: "[\u0421\u0451\u043d\u043d\u044f \u045e] LT",
        nextDay: "[\u0417\u0430\u045e\u0442\u0440\u0430 \u045e] LT",
        lastDay: "[\u0423\u0447\u043e\u0440\u0430 \u045e] LT",
        nextWeek: function() {
          return "[\u0423] dddd [\u045e] LT"
        },
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
            case 5:
            case 6:
              return "[\u0423 \u043c\u0456\u043d\u0443\u043b\u0443\u044e] dddd [\u045e] LT";
            case 1:
            case 2:
            case 4:
              return "[\u0423 \u043c\u0456\u043d\u0443\u043b\u044b] dddd [\u045e] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u043f\u0440\u0430\u0437 %s",
        past: "%s \u0442\u0430\u043c\u0443",
        s: "\u043d\u0435\u043a\u0430\u043b\u044c\u043a\u0456 \u0441\u0435\u043a\u0443\u043d\u0434",
        m: relativeTimeWithPlural,
        mm: relativeTimeWithPlural,
        h: relativeTimeWithPlural,
        hh: relativeTimeWithPlural,
        d: "\u0434\u0437\u0435\u043d\u044c",
        dd: relativeTimeWithPlural,
        M: "\u043c\u0435\u0441\u044f\u0446",
        MM: relativeTimeWithPlural,
        y: "\u0433\u043e\u0434",
        yy: relativeTimeWithPlural
      },
      meridiemParse: /\u043d\u043e\u0447\u044b|\u0440\u0430\u043d\u0456\u0446\u044b|\u0434\u043d\u044f|\u0432\u0435\u0447\u0430\u0440\u0430/,
      isPM: function(input) {
        return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u0430\u0440\u0430)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u043d\u043e\u0447\u044b";
        else if (hour < 12) return "\u0440\u0430\u043d\u0456\u0446\u044b";
        else if (hour < 17) return "\u0434\u043d\u044f";
        else return "\u0432\u0435\u0447\u0430\u0440\u0430"
      },
      ordinalParse: /\d{1,2}-(\u0456|\u044b|\u0433\u0430)/,
      ordinal: function(number, period) {
        switch (period) {
          case "M":
          case "d":
          case "DDD":
          case "w":
          case "W":
            return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + "-\u0456" : number + "-\u044b";
          case "D":
            return number +
              "-\u0433\u0430";
          default:
            return number
        }
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("bg", {
      months: "\u044f\u043d\u0443\u0430\u0440\u0438_\u0444\u0435\u0432\u0440\u0443\u0430\u0440\u0438_\u043c\u0430\u0440\u0442_\u0430\u043f\u0440\u0438\u043b_\u043c\u0430\u0439_\u044e\u043d\u0438_\u044e\u043b\u0438_\u0430\u0432\u0433\u0443\u0441\u0442_\u0441\u0435\u043f\u0442\u0435\u043c\u0432\u0440\u0438_\u043e\u043a\u0442\u043e\u043c\u0432\u0440\u0438_\u043d\u043e\u0435\u043c\u0432\u0440\u0438_\u0434\u0435\u043a\u0435\u043c\u0432\u0440\u0438".split("_"),
      monthsShort: "\u044f\u043d\u0440_\u0444\u0435\u0432_\u043c\u0430\u0440_\u0430\u043f\u0440_\u043c\u0430\u0439_\u044e\u043d\u0438_\u044e\u043b\u0438_\u0430\u0432\u0433_\u0441\u0435\u043f_\u043e\u043a\u0442_\u043d\u043e\u0435_\u0434\u0435\u043a".split("_"),
      weekdays: "\u043d\u0435\u0434\u0435\u043b\u044f_\u043f\u043e\u043d\u0435\u0434\u0435\u043b\u043d\u0438\u043a_\u0432\u0442\u043e\u0440\u043d\u0438\u043a_\u0441\u0440\u044f\u0434\u0430_\u0447\u0435\u0442\u0432\u044a\u0440\u0442\u044a\u043a_\u043f\u0435\u0442\u044a\u043a_\u0441\u044a\u0431\u043e\u0442\u0430".split("_"),
      weekdaysShort: "\u043d\u0435\u0434_\u043f\u043e\u043d_\u0432\u0442\u043e_\u0441\u0440\u044f_\u0447\u0435\u0442_\u043f\u0435\u0442_\u0441\u044a\u0431".split("_"),
      weekdaysMin: "\u043d\u0434_\u043f\u043d_\u0432\u0442_\u0441\u0440_\u0447\u0442_\u043f\u0442_\u0441\u0431".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "D.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u0414\u043d\u0435\u0441 \u0432] LT",
        nextDay: "[\u0423\u0442\u0440\u0435 \u0432] LT",
        nextWeek: "dddd [\u0432] LT",
        lastDay: "[\u0412\u0447\u0435\u0440\u0430 \u0432] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
            case 6:
              return "[\u0412 \u0438\u0437\u043c\u0438\u043d\u0430\u043b\u0430\u0442\u0430] dddd [\u0432] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[\u0412 \u0438\u0437\u043c\u0438\u043d\u0430\u043b\u0438\u044f] dddd [\u0432] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0441\u043b\u0435\u0434 %s",
        past: "\u043f\u0440\u0435\u0434\u0438 %s",
        s: "\u043d\u044f\u043a\u043e\u043b\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434\u0438",
        m: "\u043c\u0438\u043d\u0443\u0442\u0430",
        mm: "%d \u043c\u0438\u043d\u0443\u0442\u0438",
        h: "\u0447\u0430\u0441",
        hh: "%d \u0447\u0430\u0441\u0430",
        d: "\u0434\u0435\u043d",
        dd: "%d \u0434\u043d\u0438",
        M: "\u043c\u0435\u0441\u0435\u0446",
        MM: "%d \u043c\u0435\u0441\u0435\u0446\u0430",
        y: "\u0433\u043e\u0434\u0438\u043d\u0430",
        yy: "%d \u0433\u043e\u0434\u0438\u043d\u0438"
      },
      ordinalParse: /\d{1,2}-(\u0435\u0432|\u0435\u043d|\u0442\u0438|\u0432\u0438|\u0440\u0438|\u043c\u0438)/,
      ordinal: function(number) {
        var lastDigit =
          number % 10,
          last2Digits = number % 100;
        if (number === 0) return number + "-\u0435\u0432";
        else if (last2Digits === 0) return number + "-\u0435\u043d";
        else if (last2Digits > 10 && last2Digits < 20) return number + "-\u0442\u0438";
        else if (lastDigit === 1) return number + "-\u0432\u0438";
        else if (lastDigit === 2) return number + "-\u0440\u0438";
        else if (lastDigit === 7 || lastDigit === 8) return number + "-\u043c\u0438";
        else return number + "-\u0442\u0438"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u09e7",
        2: "\u09e8",
        3: "\u09e9",
        4: "\u09ea",
        5: "\u09eb",
        6: "\u09ec",
        7: "\u09ed",
        8: "\u09ee",
        9: "\u09ef",
        0: "\u09e6"
      },
      numberMap = {
        "\u09e7": "1",
        "\u09e8": "2",
        "\u09e9": "3",
        "\u09ea": "4",
        "\u09eb": "5",
        "\u09ec": "6",
        "\u09ed": "7",
        "\u09ee": "8",
        "\u09ef": "9",
        "\u09e6": "0"
      };
    return moment.defineLocale("bn", {
      months: "\u099c\u09be\u09a8\u09c1\u09df\u09be\u09b0\u09c0_\u09ab\u09c7\u09ac\u09c1\u09df\u09be\u09b0\u09c0_\u09ae\u09be\u09b0\u09cd\u099a_\u098f\u09aa\u09cd\u09b0\u09bf\u09b2_\u09ae\u09c7_\u099c\u09c1\u09a8_\u099c\u09c1\u09b2\u09be\u0987_\u0985\u0997\u09be\u09b8\u09cd\u099f_\u09b8\u09c7\u09aa\u09cd\u099f\u09c7\u09ae\u09cd\u09ac\u09b0_\u0985\u0995\u09cd\u099f\u09cb\u09ac\u09b0_\u09a8\u09ad\u09c7\u09ae\u09cd\u09ac\u09b0_\u09a1\u09bf\u09b8\u09c7\u09ae\u09cd\u09ac\u09b0".split("_"),
      monthsShort: "\u099c\u09be\u09a8\u09c1_\u09ab\u09c7\u09ac_\u09ae\u09be\u09b0\u09cd\u099a_\u098f\u09aa\u09b0_\u09ae\u09c7_\u099c\u09c1\u09a8_\u099c\u09c1\u09b2_\u0985\u0997_\u09b8\u09c7\u09aa\u09cd\u099f_\u0985\u0995\u09cd\u099f\u09cb_\u09a8\u09ad_\u09a1\u09bf\u09b8\u09c7\u09ae\u09cd".split("_"),
      weekdays: "\u09b0\u09ac\u09bf\u09ac\u09be\u09b0_\u09b8\u09cb\u09ae\u09ac\u09be\u09b0_\u09ae\u0999\u09cd\u0997\u09b2\u09ac\u09be\u09b0_\u09ac\u09c1\u09a7\u09ac\u09be\u09b0_\u09ac\u09c3\u09b9\u09b8\u09cd\u09aa\u09a4\u09cd\u09a4\u09bf\u09ac\u09be\u09b0_\u09b6\u09c1\u0995\u09cd\u09b0\u09c1\u09ac\u09be\u09b0_\u09b6\u09a8\u09bf\u09ac\u09be\u09b0".split("_"),
      weekdaysShort: "\u09b0\u09ac\u09bf_\u09b8\u09cb\u09ae_\u09ae\u0999\u09cd\u0997\u09b2_\u09ac\u09c1\u09a7_\u09ac\u09c3\u09b9\u09b8\u09cd\u09aa\u09a4\u09cd\u09a4\u09bf_\u09b6\u09c1\u0995\u09cd\u09b0\u09c1_\u09b6\u09a8\u09bf".split("_"),
      weekdaysMin: "\u09b0\u09ac_\u09b8\u09ae_\u09ae\u0999\u09cd\u0997_\u09ac\u09c1_\u09ac\u09cd\u09b0\u09bf\u09b9_\u09b6\u09c1_\u09b6\u09a8\u09bf".split("_"),
      longDateFormat: {
        LT: "A h:mm \u09b8\u09ae\u09df",
        LTS: "A h:mm:ss \u09b8\u09ae\u09df",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0986\u099c] LT",
        nextDay: "[\u0986\u0997\u09be\u09ae\u09c0\u0995\u09be\u09b2] LT",
        nextWeek: "dddd, LT",
        lastDay: "[\u0997\u09a4\u0995\u09be\u09b2] LT",
        lastWeek: "[\u0997\u09a4] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u09aa\u09b0\u09c7",
        past: "%s \u0986\u0997\u09c7",
        s: "\u0995\u098f\u0995 \u09b8\u09c7\u0995\u09c7\u09a8\u09cd\u09a1",
        m: "\u098f\u0995 \u09ae\u09bf\u09a8\u09bf\u099f",
        mm: "%d \u09ae\u09bf\u09a8\u09bf\u099f",
        h: "\u098f\u0995 \u0998\u09a8\u09cd\u099f\u09be",
        hh: "%d \u0998\u09a8\u09cd\u099f\u09be",
        d: "\u098f\u0995 \u09a6\u09bf\u09a8",
        dd: "%d \u09a6\u09bf\u09a8",
        M: "\u098f\u0995 \u09ae\u09be\u09b8",
        MM: "%d \u09ae\u09be\u09b8",
        y: "\u098f\u0995 \u09ac\u099b\u09b0",
        yy: "%d \u09ac\u099b\u09b0"
      },
      preparse: function(string) {
        return string.replace(/[\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef\u09e6]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        })
      },
      meridiemParse: /\u09b0\u09be\u09a4|\u09b6\u0995\u09be\u09b2|\u09a6\u09c1\u09aa\u09c1\u09b0|\u09ac\u09bf\u0995\u09c7\u09b2|\u09b0\u09be\u09a4/,
      isPM: function(input) {
        return /^(\u09a6\u09c1\u09aa\u09c1\u09b0|\u09ac\u09bf\u0995\u09c7\u09b2|\u09b0\u09be\u09a4)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u09b0\u09be\u09a4";
        else if (hour < 10) return "\u09b6\u0995\u09be\u09b2";
        else if (hour < 17) return "\u09a6\u09c1\u09aa\u09c1\u09b0";
        else if (hour < 20) return "\u09ac\u09bf\u0995\u09c7\u09b2";
        else return "\u09b0\u09be\u09a4"
      },
      week: {
        dow: 0,
        doy: 6
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0f21",
        2: "\u0f22",
        3: "\u0f23",
        4: "\u0f24",
        5: "\u0f25",
        6: "\u0f26",
        7: "\u0f27",
        8: "\u0f28",
        9: "\u0f29",
        0: "\u0f20"
      },
      numberMap = {
        "\u0f21": "1",
        "\u0f22": "2",
        "\u0f23": "3",
        "\u0f24": "4",
        "\u0f25": "5",
        "\u0f26": "6",
        "\u0f27": "7",
        "\u0f28": "8",
        "\u0f29": "9",
        "\u0f20": "0"
      };
    return moment.defineLocale("bo", {
      months: "\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0f44\u0f0b\u0f54\u0f7c_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f42\u0f49\u0f72\u0f66\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f42\u0f66\u0f74\u0f58\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f5e\u0f72\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f63\u0f94\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0fb2\u0f74\u0f42\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f51\u0f74\u0f53\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f62\u0f92\u0fb1\u0f51\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0f42\u0f74\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f42\u0f45\u0f72\u0f42\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f42\u0f49\u0f72\u0f66\u0f0b\u0f54".split("_"),
      monthsShort: "\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0f44\u0f0b\u0f54\u0f7c_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f42\u0f49\u0f72\u0f66\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f42\u0f66\u0f74\u0f58\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f5e\u0f72\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f63\u0f94\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0fb2\u0f74\u0f42\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f51\u0f74\u0f53\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f62\u0f92\u0fb1\u0f51\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f51\u0f42\u0f74\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f42\u0f45\u0f72\u0f42\u0f0b\u0f54_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f56\u0f45\u0f74\u0f0b\u0f42\u0f49\u0f72\u0f66\u0f0b\u0f54".split("_"),
      weekdays: "\u0f42\u0f5f\u0f60\u0f0b\u0f49\u0f72\u0f0b\u0f58\u0f0b_\u0f42\u0f5f\u0f60\u0f0b\u0f5f\u0fb3\u0f0b\u0f56\u0f0b_\u0f42\u0f5f\u0f60\u0f0b\u0f58\u0f72\u0f42\u0f0b\u0f51\u0f58\u0f62\u0f0b_\u0f42\u0f5f\u0f60\u0f0b\u0f63\u0fb7\u0f42\u0f0b\u0f54\u0f0b_\u0f42\u0f5f\u0f60\u0f0b\u0f55\u0f74\u0f62\u0f0b\u0f56\u0f74_\u0f42\u0f5f\u0f60\u0f0b\u0f54\u0f0b\u0f66\u0f44\u0f66\u0f0b_\u0f42\u0f5f\u0f60\u0f0b\u0f66\u0fa4\u0f7a\u0f53\u0f0b\u0f54\u0f0b".split("_"),
      weekdaysShort: "\u0f49\u0f72\u0f0b\u0f58\u0f0b_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b_\u0f58\u0f72\u0f42\u0f0b\u0f51\u0f58\u0f62\u0f0b_\u0f63\u0fb7\u0f42\u0f0b\u0f54\u0f0b_\u0f55\u0f74\u0f62\u0f0b\u0f56\u0f74_\u0f54\u0f0b\u0f66\u0f44\u0f66\u0f0b_\u0f66\u0fa4\u0f7a\u0f53\u0f0b\u0f54\u0f0b".split("_"),
      weekdaysMin: "\u0f49\u0f72\u0f0b\u0f58\u0f0b_\u0f5f\u0fb3\u0f0b\u0f56\u0f0b_\u0f58\u0f72\u0f42\u0f0b\u0f51\u0f58\u0f62\u0f0b_\u0f63\u0fb7\u0f42\u0f0b\u0f54\u0f0b_\u0f55\u0f74\u0f62\u0f0b\u0f56\u0f74_\u0f54\u0f0b\u0f66\u0f44\u0f66\u0f0b_\u0f66\u0fa4\u0f7a\u0f53\u0f0b\u0f54\u0f0b".split("_"),
      longDateFormat: {
        LT: "A h:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0f51\u0f72\u0f0b\u0f62\u0f72\u0f44] LT",
        nextDay: "[\u0f66\u0f44\u0f0b\u0f49\u0f72\u0f53] LT",
        nextWeek: "[\u0f56\u0f51\u0f74\u0f53\u0f0b\u0f55\u0fb2\u0f42\u0f0b\u0f62\u0f97\u0f7a\u0f66\u0f0b\u0f58], LT",
        lastDay: "[\u0f41\u0f0b\u0f66\u0f44] LT",
        lastWeek: "[\u0f56\u0f51\u0f74\u0f53\u0f0b\u0f55\u0fb2\u0f42\u0f0b\u0f58\u0f50\u0f60\u0f0b\u0f58] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u0f63\u0f0b",
        past: "%s \u0f66\u0f94\u0f53\u0f0b\u0f63",
        s: "\u0f63\u0f58\u0f0b\u0f66\u0f44",
        m: "\u0f66\u0f90\u0f62\u0f0b\u0f58\u0f0b\u0f42\u0f45\u0f72\u0f42",
        mm: "%d \u0f66\u0f90\u0f62\u0f0b\u0f58",
        h: "\u0f46\u0f74\u0f0b\u0f5a\u0f7c\u0f51\u0f0b\u0f42\u0f45\u0f72\u0f42",
        hh: "%d \u0f46\u0f74\u0f0b\u0f5a\u0f7c\u0f51",
        d: "\u0f49\u0f72\u0f53\u0f0b\u0f42\u0f45\u0f72\u0f42",
        dd: "%d \u0f49\u0f72\u0f53\u0f0b",
        M: "\u0f5f\u0fb3\u0f0b\u0f56\u0f0b\u0f42\u0f45\u0f72\u0f42",
        MM: "%d \u0f5f\u0fb3\u0f0b\u0f56",
        y: "\u0f63\u0f7c\u0f0b\u0f42\u0f45\u0f72\u0f42",
        yy: "%d \u0f63\u0f7c"
      },
      preparse: function(string) {
        return string.replace(/[\u0f21\u0f22\u0f23\u0f24\u0f25\u0f26\u0f27\u0f28\u0f29\u0f20]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g,
          function(match) {
            return symbolMap[match]
          })
      },
      meridiemParse: /\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c|\u0f5e\u0f7c\u0f42\u0f66\u0f0b\u0f40\u0f66|\u0f49\u0f72\u0f53\u0f0b\u0f42\u0f74\u0f44|\u0f51\u0f42\u0f7c\u0f44\u0f0b\u0f51\u0f42|\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c/,
      isPM: function(input) {
        return /^(\u0f49\u0f72\u0f53\u0f0b\u0f42\u0f74\u0f44|\u0f51\u0f42\u0f7c\u0f44\u0f0b\u0f51\u0f42|\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c";
        else if (hour < 10) return "\u0f5e\u0f7c\u0f42\u0f66\u0f0b\u0f40\u0f66";
        else if (hour < 17) return "\u0f49\u0f72\u0f53\u0f0b\u0f42\u0f74\u0f44";
        else if (hour < 20) return "\u0f51\u0f42\u0f7c\u0f44\u0f0b\u0f51\u0f42";
        else return "\u0f58\u0f5a\u0f53\u0f0b\u0f58\u0f7c"
      },
      week: {
        dow: 0,
        doy: 6
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function relativeTimeWithMutation(number, withoutSuffix, key) {
      var format = {
        "mm": "munutenn",
        "MM": "miz",
        "dd": "devezh"
      };
      return number + " " + mutation(format[key], number)
    }

    function specialMutationForYears(number) {
      switch (lastNumber(number)) {
        case 1:
        case 3:
        case 4:
        case 5:
        case 9:
          return number +
            " bloaz";
        default:
          return number + " vloaz"
      }
    }

    function lastNumber(number) {
      if (number > 9) return lastNumber(number % 10);
      return number
    }

    function mutation(text, number) {
      if (number === 2) return softMutation(text);
      return text
    }

    function softMutation(text) {
      var mutationTable = {
        "m": "v",
        "b": "v",
        "d": "z"
      };
      if (mutationTable[text.charAt(0)] === undefined) return text;
      return mutationTable[text.charAt(0)] + text.substring(1)
    }
    return moment.defineLocale("br", {
      months: "Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
      monthsShort: "Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
      weekdays: "Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),
      weekdaysShort: "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
      weekdaysMin: "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
      longDateFormat: {
        LT: "h[e]mm A",
        LTS: "h[e]mm:ss A",
        L: "DD/MM/YYYY",
        LL: "D [a viz] MMMM YYYY",
        LLL: "D [a viz] MMMM YYYY LT",
        LLLL: "dddd, D [a viz] MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Hiziv da] LT",
        nextDay: "[Warc'hoazh da] LT",
        nextWeek: "dddd [da] LT",
        lastDay: "[Dec'h da] LT",
        lastWeek: "dddd [paset da] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "a-benn %s",
        past: "%s 'zo",
        s: "un nebeud segondenno\u00f9",
        m: "ur vunutenn",
        mm: relativeTimeWithMutation,
        h: "un eur",
        hh: "%d eur",
        d: "un devezh",
        dd: relativeTimeWithMutation,
        M: "ur miz",
        MM: relativeTimeWithMutation,
        y: "ur bloaz",
        yy: specialMutationForYears
      },
      ordinalParse: /\d{1,2}(a\u00f1|vet)/,
      ordinal: function(number) {
        var output = number === 1 ? "a\u00f1" : "vet";
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function translate(number,
      withoutSuffix, key) {
      var result = number + " ";
      switch (key) {
        case "m":
          return withoutSuffix ? "jedna minuta" : "jedne minute";
        case "mm":
          if (number === 1) result += "minuta";
          else if (number === 2 || number === 3 || number === 4) result += "minute";
          else result += "minuta";
          return result;
        case "h":
          return withoutSuffix ? "jedan sat" : "jednog sata";
        case "hh":
          if (number === 1) result += "sat";
          else if (number === 2 || number === 3 || number === 4) result += "sata";
          else result += "sati";
          return result;
        case "dd":
          if (number === 1) result += "dan";
          else result += "dana";
          return result;
        case "MM":
          if (number === 1) result += "mjesec";
          else if (number === 2 || number === 3 || number === 4) result += "mjeseca";
          else result += "mjeseci";
          return result;
        case "yy":
          if (number === 1) result += "godina";
          else if (number === 2 || number === 3 || number === 4) result += "godine";
          else result += "godina";
          return result
      }
    }
    return moment.defineLocale("bs", {
      months: "januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar".split("_"),
      monthsShort: "jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.".split("_"),
      weekdays: "nedjelja_ponedjeljak_utorak_srijeda_\u010detvrtak_petak_subota".split("_"),
      weekdaysShort: "ned._pon._uto._sri._\u010det._pet._sub.".split("_"),
      weekdaysMin: "ne_po_ut_sr_\u010de_pe_su".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD. MM. YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[danas u] LT",
        nextDay: "[sutra u] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[u] [nedjelju] [u] LT";
            case 3:
              return "[u] [srijedu] [u] LT";
            case 6:
              return "[u] [subotu] [u] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[u] dddd [u] LT"
          }
        },
        lastDay: "[ju\u010der u] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
              return "[pro\u0161lu] dddd [u] LT";
            case 6:
              return "[pro\u0161le] [subote] [u] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[pro\u0161li] dddd [u] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "prije %s",
        s: "par sekundi",
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: "dan",
        dd: translate,
        M: "mjesec",
        MM: translate,
        y: "godinu",
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ca", {
      months: "gener_febrer_mar\u00e7_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),
      monthsShort: "gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.".split("_"),
      weekdays: "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),
      weekdaysShort: "dg._dl._dt._dc._dj._dv._ds.".split("_"),
      weekdaysMin: "Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: function() {
          return "[avui a " +
            (this.hours() !== 1 ? "les" : "la") + "] LT"
        },
        nextDay: function() {
          return "[dem\u00e0 a " + (this.hours() !== 1 ? "les" : "la") + "] LT"
        },
        nextWeek: function() {
          return "dddd [a " + (this.hours() !== 1 ? "les" : "la") + "] LT"
        },
        lastDay: function() {
          return "[ahir a " + (this.hours() !== 1 ? "les" : "la") + "] LT"
        },
        lastWeek: function() {
          return "[el] dddd [passat a " + (this.hours() !== 1 ? "les" : "la") + "] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "en %s",
        past: "fa %s",
        s: "uns segons",
        m: "un minut",
        mm: "%d minuts",
        h: "una hora",
        hh: "%d hores",
        d: "un dia",
        dd: "%d dies",
        M: "un mes",
        MM: "%d mesos",
        y: "un any",
        yy: "%d anys"
      },
      ordinalParse: /\d{1,2}(r|n|t|\u00e8|a)/,
      ordinal: function(number, period) {
        var output = number === 1 ? "r" : number === 2 ? "n" : number === 3 ? "r" : number === 4 ? "t" : "\u00e8";
        if (period === "w" || period === "W") output = "a";
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var months = "leden_\u00fanor_b\u0159ezen_duben_kv\u011bten_\u010derven_\u010dervenec_srpen_z\u00e1\u0159\u00ed_\u0159\u00edjen_listopad_prosinec".split("_"),
      monthsShort =
      "led_\u00fano_b\u0159e_dub_kv\u011b_\u010dvn_\u010dvc_srp_z\u00e1\u0159_\u0159\u00edj_lis_pro".split("_");

    function plural(n) {
      return n > 1 && n < 5 && ~~(n / 10) !== 1
    }

    function translate(number, withoutSuffix, key, isFuture) {
      var result = number + " ";
      switch (key) {
        case "s":
          return withoutSuffix || isFuture ? "p\u00e1r sekund" : "p\u00e1r sekundami";
        case "m":
          return withoutSuffix ? "minuta" : isFuture ? "minutu" : "minutou";
        case "mm":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "minuty" : "minut");
          else return result + "minutami";
          break;
        case "h":
          return withoutSuffix ? "hodina" : isFuture ? "hodinu" : "hodinou";
        case "hh":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "hodiny" : "hodin");
          else return result + "hodinami";
          break;
        case "d":
          return withoutSuffix || isFuture ? "den" : "dnem";
        case "dd":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "dny" : "dn\u00ed");
          else return result + "dny";
          break;
        case "M":
          return withoutSuffix || isFuture ? "m\u011bs\u00edc" : "m\u011bs\u00edcem";
        case "MM":
          if (withoutSuffix || isFuture) return result + (plural(number) ?
            "m\u011bs\u00edce" : "m\u011bs\u00edc\u016f");
          else return result + "m\u011bs\u00edci";
          break;
        case "y":
          return withoutSuffix || isFuture ? "rok" : "rokem";
        case "yy":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "roky" : "let");
          else return result + "lety";
          break
      }
    }
    return moment.defineLocale("cs", {
      months: months,
      monthsShort: monthsShort,
      monthsParse: function(months, monthsShort) {
        var i, _monthsParse = [];
        for (i = 0; i < 12; i++) _monthsParse[i] = new RegExp("^" + months[i] + "$|^" + monthsShort[i] + "$", "i");
        return _monthsParse
      }(months,
        monthsShort),
      weekdays: "ned\u011ble_pond\u011bl\u00ed_\u00fater\u00fd_st\u0159eda_\u010dtvrtek_p\u00e1tek_sobota".split("_"),
      weekdaysShort: "ne_po_\u00fat_st_\u010dt_p\u00e1_so".split("_"),
      weekdaysMin: "ne_po_\u00fat_st_\u010dt_p\u00e1_so".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[dnes v] LT",
        nextDay: "[z\u00edtra v] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[v ned\u011bli v] LT";
            case 1:
            case 2:
              return "[v] dddd [v] LT";
            case 3:
              return "[ve st\u0159edu v] LT";
            case 4:
              return "[ve \u010dtvrtek v] LT";
            case 5:
              return "[v p\u00e1tek v] LT";
            case 6:
              return "[v sobotu v] LT"
          }
        },
        lastDay: "[v\u010dera v] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
              return "[minulou ned\u011bli v] LT";
            case 1:
            case 2:
              return "[minul\u00e9] dddd [v] LT";
            case 3:
              return "[minulou st\u0159edu v] LT";
            case 4:
            case 5:
              return "[minul\u00fd] dddd [v] LT";
            case 6:
              return "[minulou sobotu v] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "p\u0159ed %s",
        s: translate,
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: translate,
        dd: translate,
        M: translate,
        MM: translate,
        y: translate,
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("cv", {
      months: "\u043a\u0103\u0440\u043b\u0430\u0447_\u043d\u0430\u0440\u0103\u0441_\u043f\u0443\u0448_\u0430\u043a\u0430_\u043c\u0430\u0439_\u00e7\u0115\u0440\u0442\u043c\u0435_\u0443\u0442\u0103_\u00e7\u0443\u0440\u043b\u0430_\u0430\u0432\u0103\u043d_\u044e\u043f\u0430_\u0447\u04f3\u043a_\u0440\u0430\u0448\u0442\u0430\u0432".split("_"),
      monthsShort: "\u043a\u0103\u0440_\u043d\u0430\u0440_\u043f\u0443\u0448_\u0430\u043a\u0430_\u043c\u0430\u0439_\u00e7\u0115\u0440_\u0443\u0442\u0103_\u00e7\u0443\u0440_\u0430\u0432_\u044e\u043f\u0430_\u0447\u04f3\u043a_\u0440\u0430\u0448".split("_"),
      weekdays: "\u0432\u044b\u0440\u0441\u0430\u0440\u043d\u0438\u043a\u0443\u043d_\u0442\u0443\u043d\u0442\u0438\u043a\u0443\u043d_\u044b\u0442\u043b\u0430\u0440\u0438\u043a\u0443\u043d_\u044e\u043d\u043a\u0443\u043d_\u043a\u0115\u00e7\u043d\u0435\u0440\u043d\u0438\u043a\u0443\u043d_\u044d\u0440\u043d\u0435\u043a\u0443\u043d_\u0448\u0103\u043c\u0430\u0442\u043a\u0443\u043d".split("_"),
      weekdaysShort: "\u0432\u044b\u0440_\u0442\u0443\u043d_\u044b\u0442\u043b_\u044e\u043d_\u043a\u0115\u00e7_\u044d\u0440\u043d_\u0448\u0103\u043c".split("_"),
      weekdaysMin: "\u0432\u0440_\u0442\u043d_\u044b\u0442_\u044e\u043d_\u043a\u00e7_\u044d\u0440_\u0448\u043c".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD-MM-YYYY",
        LL: "YYYY [\u00e7\u0443\u043b\u0445\u0438] MMMM [\u0443\u0439\u0103\u0445\u0115\u043d] D[-\u043c\u0115\u0448\u0115]",
        LLL: "YYYY [\u00e7\u0443\u043b\u0445\u0438] MMMM [\u0443\u0439\u0103\u0445\u0115\u043d] D[-\u043c\u0115\u0448\u0115], LT",
        LLLL: "dddd, YYYY [\u00e7\u0443\u043b\u0445\u0438] MMMM [\u0443\u0439\u0103\u0445\u0115\u043d] D[-\u043c\u0115\u0448\u0115], LT"
      },
      calendar: {
        sameDay: "[\u041f\u0430\u044f\u043d] LT [\u0441\u0435\u0445\u0435\u0442\u0440\u0435]",
        nextDay: "[\u042b\u0440\u0430\u043d] LT [\u0441\u0435\u0445\u0435\u0442\u0440\u0435]",
        lastDay: "[\u0114\u043d\u0435\u0440] LT [\u0441\u0435\u0445\u0435\u0442\u0440\u0435]",
        nextWeek: "[\u00c7\u0438\u0442\u0435\u0441] dddd LT [\u0441\u0435\u0445\u0435\u0442\u0440\u0435]",
        lastWeek: "[\u0418\u0440\u0442\u043d\u0115] dddd LT [\u0441\u0435\u0445\u0435\u0442\u0440\u0435]",
        sameElse: "L"
      },
      relativeTime: {
        future: function(output) {
          var affix = /\u0441\u0435\u0445\u0435\u0442$/i.exec(output) ? "\u0440\u0435\u043d" : /\u00e7\u0443\u043b$/i.exec(output) ? "\u0442\u0430\u043d" : "\u0440\u0430\u043d";
          return output + affix
        },
        past: "%s \u043a\u0430\u044f\u043b\u043b\u0430",
        s: "\u043f\u0115\u0440-\u0438\u043a \u00e7\u0435\u043a\u043a\u0443\u043d\u0442",
        m: "\u043f\u0115\u0440 \u043c\u0438\u043d\u0443\u0442",
        mm: "%d \u043c\u0438\u043d\u0443\u0442",
        h: "\u043f\u0115\u0440 \u0441\u0435\u0445\u0435\u0442",
        hh: "%d \u0441\u0435\u0445\u0435\u0442",
        d: "\u043f\u0115\u0440 \u043a\u0443\u043d",
        dd: "%d \u043a\u0443\u043d",
        M: "\u043f\u0115\u0440 \u0443\u0439\u0103\u0445",
        MM: "%d \u0443\u0439\u0103\u0445",
        y: "\u043f\u0115\u0440 \u00e7\u0443\u043b",
        yy: "%d \u00e7\u0443\u043b"
      },
      ordinalParse: /\d{1,2}-\u043c\u0115\u0448/,
      ordinal: "%d-\u043c\u0115\u0448",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("cy", {
      months: "Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),
      monthsShort: "Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),
      weekdays: "Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),
      weekdaysShort: "Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),
      weekdaysMin: "Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Heddiw am] LT",
        nextDay: "[Yfory am] LT",
        nextWeek: "dddd [am] LT",
        lastDay: "[Ddoe am] LT",
        lastWeek: "dddd [diwethaf am] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "mewn %s",
        past: "%s yn \u00f4l",
        s: "ychydig eiliadau",
        m: "munud",
        mm: "%d munud",
        h: "awr",
        hh: "%d awr",
        d: "diwrnod",
        dd: "%d diwrnod",
        M: "mis",
        MM: "%d mis",
        y: "blwyddyn",
        yy: "%d flynedd"
      },
      ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
      ordinal: function(number) {
        var b = number,
          output = "",
          lookup = ["", "af", "il", "ydd", "ydd", "ed", "ed", "ed", "fed", "fed", "fed", "eg", "fed", "eg", "eg", "fed", "eg", "eg", "fed", "eg", "fed"];
        if (b > 20)
          if (b === 40 || b === 50 || b === 60 || b === 80 ||
            b === 100) output = "fed";
          else output = "ain";
        else if (b > 0) output = lookup[b];
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("da", {
      months: "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),
      monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
      weekdays: "s\u00f8ndag_mandag_tirsdag_onsdag_torsdag_fredag_l\u00f8rdag".split("_"),
      weekdaysShort: "s\u00f8n_man_tir_ons_tor_fre_l\u00f8r".split("_"),
      weekdaysMin: "s\u00f8_ma_ti_on_to_fr_l\u00f8".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd [d.] D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[I dag kl.] LT",
        nextDay: "[I morgen kl.] LT",
        nextWeek: "dddd [kl.] LT",
        lastDay: "[I g\u00e5r kl.] LT",
        lastWeek: "[sidste] dddd [kl] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "om %s",
        past: "%s siden",
        s: "f\u00e5 sekunder",
        m: "et minut",
        mm: "%d minutter",
        h: "en time",
        hh: "%d timer",
        d: "en dag",
        dd: "%d dage",
        M: "en m\u00e5ned",
        MM: "%d m\u00e5neder",
        y: "et \u00e5r",
        yy: "%d \u00e5r"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
      var format = {
        "m": ["eine Minute", "einer Minute"],
        "h": ["eine Stunde", "einer Stunde"],
        "d": ["ein Tag", "einem Tag"],
        "dd": [number + " Tage", number + " Tagen"],
        "M": ["ein Monat", "einem Monat"],
        "MM": [number + " Monate", number + " Monaten"],
        "y": ["ein Jahr", "einem Jahr"],
        "yy": [number + " Jahre",
          number + " Jahren"
        ]
      };
      return withoutSuffix ? format[key][0] : format[key][1]
    }
    return moment.defineLocale("de-at", {
      months: "J\u00e4nner_Februar_M\u00e4rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
      monthsShort: "J\u00e4n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
      weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
      weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
      weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Heute um] LT [Uhr]",
        sameElse: "L",
        nextDay: "[Morgen um] LT [Uhr]",
        nextWeek: "dddd [um] LT [Uhr]",
        lastDay: "[Gestern um] LT [Uhr]",
        lastWeek: "[letzten] dddd [um] LT [Uhr]"
      },
      relativeTime: {
        future: "in %s",
        past: "vor %s",
        s: "ein paar Sekunden",
        m: processRelativeTime,
        mm: "%d Minuten",
        h: processRelativeTime,
        hh: "%d Stunden",
        d: processRelativeTime,
        dd: processRelativeTime,
        M: processRelativeTime,
        MM: processRelativeTime,
        y: processRelativeTime,
        yy: processRelativeTime
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
      var format = {
        "m": ["eine Minute", "einer Minute"],
        "h": ["eine Stunde", "einer Stunde"],
        "d": ["ein Tag", "einem Tag"],
        "dd": [number + " Tage", number + " Tagen"],
        "M": ["ein Monat", "einem Monat"],
        "MM": [number + " Monate", number + " Monaten"],
        "y": ["ein Jahr", "einem Jahr"],
        "yy": [number + " Jahre", number +
          " Jahren"
        ]
      };
      return withoutSuffix ? format[key][0] : format[key][1]
    }
    return moment.defineLocale("de", {
      months: "Januar_Februar_M\u00e4rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
      monthsShort: "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
      weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
      weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
      weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Heute um] LT [Uhr]",
        sameElse: "L",
        nextDay: "[Morgen um] LT [Uhr]",
        nextWeek: "dddd [um] LT [Uhr]",
        lastDay: "[Gestern um] LT [Uhr]",
        lastWeek: "[letzten] dddd [um] LT [Uhr]"
      },
      relativeTime: {
        future: "in %s",
        past: "vor %s",
        s: "ein paar Sekunden",
        m: processRelativeTime,
        mm: "%d Minuten",
        h: processRelativeTime,
        hh: "%d Stunden",
        d: processRelativeTime,
        dd: processRelativeTime,
        M: processRelativeTime,
        MM: processRelativeTime,
        y: processRelativeTime,
        yy: processRelativeTime
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("el", {
      monthsNominativeEl: "\u0399\u03b1\u03bd\u03bf\u03c5\u03ac\u03c1\u03b9\u03bf\u03c2_\u03a6\u03b5\u03b2\u03c1\u03bf\u03c5\u03ac\u03c1\u03b9\u03bf\u03c2_\u039c\u03ac\u03c1\u03c4\u03b9\u03bf\u03c2_\u0391\u03c0\u03c1\u03af\u03bb\u03b9\u03bf\u03c2_\u039c\u03ac\u03b9\u03bf\u03c2_\u0399\u03bf\u03cd\u03bd\u03b9\u03bf\u03c2_\u0399\u03bf\u03cd\u03bb\u03b9\u03bf\u03c2_\u0391\u03cd\u03b3\u03bf\u03c5\u03c3\u03c4\u03bf\u03c2_\u03a3\u03b5\u03c0\u03c4\u03ad\u03bc\u03b2\u03c1\u03b9\u03bf\u03c2_\u039f\u03ba\u03c4\u03ce\u03b2\u03c1\u03b9\u03bf\u03c2_\u039d\u03bf\u03ad\u03bc\u03b2\u03c1\u03b9\u03bf\u03c2_\u0394\u03b5\u03ba\u03ad\u03bc\u03b2\u03c1\u03b9\u03bf\u03c2".split("_"),
      monthsGenitiveEl: "\u0399\u03b1\u03bd\u03bf\u03c5\u03b1\u03c1\u03af\u03bf\u03c5_\u03a6\u03b5\u03b2\u03c1\u03bf\u03c5\u03b1\u03c1\u03af\u03bf\u03c5_\u039c\u03b1\u03c1\u03c4\u03af\u03bf\u03c5_\u0391\u03c0\u03c1\u03b9\u03bb\u03af\u03bf\u03c5_\u039c\u03b1\u0390\u03bf\u03c5_\u0399\u03bf\u03c5\u03bd\u03af\u03bf\u03c5_\u0399\u03bf\u03c5\u03bb\u03af\u03bf\u03c5_\u0391\u03c5\u03b3\u03bf\u03cd\u03c3\u03c4\u03bf\u03c5_\u03a3\u03b5\u03c0\u03c4\u03b5\u03bc\u03b2\u03c1\u03af\u03bf\u03c5_\u039f\u03ba\u03c4\u03c9\u03b2\u03c1\u03af\u03bf\u03c5_\u039d\u03bf\u03b5\u03bc\u03b2\u03c1\u03af\u03bf\u03c5_\u0394\u03b5\u03ba\u03b5\u03bc\u03b2\u03c1\u03af\u03bf\u03c5".split("_"),
      months: function(momentToFormat, format) {
        if (/D/.test(format.substring(0, format.indexOf("MMMM")))) return this._monthsGenitiveEl[momentToFormat.month()];
        else return this._monthsNominativeEl[momentToFormat.month()]
      },
      monthsShort: "\u0399\u03b1\u03bd_\u03a6\u03b5\u03b2_\u039c\u03b1\u03c1_\u0391\u03c0\u03c1_\u039c\u03b1\u03ca_\u0399\u03bf\u03c5\u03bd_\u0399\u03bf\u03c5\u03bb_\u0391\u03c5\u03b3_\u03a3\u03b5\u03c0_\u039f\u03ba\u03c4_\u039d\u03bf\u03b5_\u0394\u03b5\u03ba".split("_"),
      weekdays: "\u039a\u03c5\u03c1\u03b9\u03b1\u03ba\u03ae_\u0394\u03b5\u03c5\u03c4\u03ad\u03c1\u03b1_\u03a4\u03c1\u03af\u03c4\u03b7_\u03a4\u03b5\u03c4\u03ac\u03c1\u03c4\u03b7_\u03a0\u03ad\u03bc\u03c0\u03c4\u03b7_\u03a0\u03b1\u03c1\u03b1\u03c3\u03ba\u03b5\u03c5\u03ae_\u03a3\u03ac\u03b2\u03b2\u03b1\u03c4\u03bf".split("_"),
      weekdaysShort: "\u039a\u03c5\u03c1_\u0394\u03b5\u03c5_\u03a4\u03c1\u03b9_\u03a4\u03b5\u03c4_\u03a0\u03b5\u03bc_\u03a0\u03b1\u03c1_\u03a3\u03b1\u03b2".split("_"),
      weekdaysMin: "\u039a\u03c5_\u0394\u03b5_\u03a4\u03c1_\u03a4\u03b5_\u03a0\u03b5_\u03a0\u03b1_\u03a3\u03b1".split("_"),
      meridiem: function(hours, minutes, isLower) {
        if (hours > 11) return isLower ? "\u03bc\u03bc" : "\u039c\u039c";
        else return isLower ? "\u03c0\u03bc" : "\u03a0\u039c"
      },
      isPM: function(input) {
        return (input + "").toLowerCase()[0] === "\u03bc"
      },
      meridiemParse: /[\u03a0\u039c]\.?\u039c?\.?/i,
      longDateFormat: {
        LT: "h:mm A",
        LTS: "h:mm:ss A",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendarEl: {
        sameDay: "[\u03a3\u03ae\u03bc\u03b5\u03c1\u03b1 {}] LT",
        nextDay: "[\u0391\u03cd\u03c1\u03b9\u03bf {}] LT",
        nextWeek: "dddd [{}] LT",
        lastDay: "[\u03a7\u03b8\u03b5\u03c2 {}] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 6:
              return "[\u03c4\u03bf \u03c0\u03c1\u03bf\u03b7\u03b3\u03bf\u03cd\u03bc\u03b5\u03bd\u03bf] dddd [{}] LT";
            default:
              return "[\u03c4\u03b7\u03bd \u03c0\u03c1\u03bf\u03b7\u03b3\u03bf\u03cd\u03bc\u03b5\u03bd\u03b7] dddd [{}] LT"
          }
        },
        sameElse: "L"
      },
      calendar: function(key, mom) {
        var output = this._calendarEl[key],
          hours = mom && mom.hours();
        if (typeof output === "function") output = output.apply(mom);
        return output.replace("{}", hours % 12 === 1 ? "\u03c3\u03c4\u03b7" : "\u03c3\u03c4\u03b9\u03c2")
      },
      relativeTime: {
        future: "\u03c3\u03b5 %s",
        past: "%s \u03c0\u03c1\u03b9\u03bd",
        s: "\u03bb\u03af\u03b3\u03b1 \u03b4\u03b5\u03c5\u03c4\u03b5\u03c1\u03cc\u03bb\u03b5\u03c0\u03c4\u03b1",
        m: "\u03ad\u03bd\u03b1 \u03bb\u03b5\u03c0\u03c4\u03cc",
        mm: "%d \u03bb\u03b5\u03c0\u03c4\u03ac",
        h: "\u03bc\u03af\u03b1 \u03ce\u03c1\u03b1",
        hh: "%d \u03ce\u03c1\u03b5\u03c2",
        d: "\u03bc\u03af\u03b1 \u03bc\u03ad\u03c1\u03b1",
        dd: "%d \u03bc\u03ad\u03c1\u03b5\u03c2",
        M: "\u03ad\u03bd\u03b1\u03c2 \u03bc\u03ae\u03bd\u03b1\u03c2",
        MM: "%d \u03bc\u03ae\u03bd\u03b5\u03c2",
        y: "\u03ad\u03bd\u03b1\u03c2 \u03c7\u03c1\u03cc\u03bd\u03bf\u03c2",
        yy: "%d \u03c7\u03c1\u03cc\u03bd\u03b9\u03b1"
      },
      ordinalParse: /\d{1,2}\u03b7/,
      ordinal: "%d\u03b7",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("en-au", {
      months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
      monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
      weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
      weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
      weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "h:mm A",
        LTS: "h:mm:ss A",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Today at] LT",
        nextDay: "[Tomorrow at] LT",
        nextWeek: "dddd [at] LT",
        lastDay: "[Yesterday at] LT",
        lastWeek: "[Last] dddd [at] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: "a few seconds",
        m: "a minute",
        mm: "%d minutes",
        h: "an hour",
        hh: "%d hours",
        d: "a day",
        dd: "%d days",
        M: "a month",
        MM: "%d months",
        y: "a year",
        yy: "%d years"
      },
      ordinalParse: /\d{1,2}(st|nd|rd|th)/,
      ordinal: function(number) {
        var b = number % 10,
          output = ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("en-ca", {
      months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
      monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
      weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
      weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
      weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "h:mm A",
        LTS: "h:mm:ss A",
        L: "YYYY-MM-DD",
        LL: "D MMMM, YYYY",
        LLL: "D MMMM, YYYY LT",
        LLLL: "dddd, D MMMM, YYYY LT"
      },
      calendar: {
        sameDay: "[Today at] LT",
        nextDay: "[Tomorrow at] LT",
        nextWeek: "dddd [at] LT",
        lastDay: "[Yesterday at] LT",
        lastWeek: "[Last] dddd [at] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: "a few seconds",
        m: "a minute",
        mm: "%d minutes",
        h: "an hour",
        hh: "%d hours",
        d: "a day",
        dd: "%d days",
        M: "a month",
        MM: "%d months",
        y: "a year",
        yy: "%d years"
      },
      ordinalParse: /\d{1,2}(st|nd|rd|th)/,
      ordinal: function(number) {
        var b = number % 10,
          output = ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
        return number + output
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("en-gb", {
      months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
      monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
      weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
      weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
      weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Today at] LT",
        nextDay: "[Tomorrow at] LT",
        nextWeek: "dddd [at] LT",
        lastDay: "[Yesterday at] LT",
        lastWeek: "[Last] dddd [at] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: "a few seconds",
        m: "a minute",
        mm: "%d minutes",
        h: "an hour",
        hh: "%d hours",
        d: "a day",
        dd: "%d days",
        M: "a month",
        MM: "%d months",
        y: "a year",
        yy: "%d years"
      },
      ordinalParse: /\d{1,2}(st|nd|rd|th)/,
      ordinal: function(number) {
        var b = number % 10,
          output = ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("eo", {
      months: "januaro_februaro_marto_aprilo_majo_junio_julio_a\u016dgusto_septembro_oktobro_novembro_decembro".split("_"),
      monthsShort: "jan_feb_mar_apr_maj_jun_jul_a\u016dg_sep_okt_nov_dec".split("_"),
      weekdays: "Diman\u0109o_Lundo_Mardo_Merkredo_\u0134a\u016ddo_Vendredo_Sabato".split("_"),
      weekdaysShort: "Dim_Lun_Mard_Merk_\u0134a\u016d_Ven_Sab".split("_"),
      weekdaysMin: "Di_Lu_Ma_Me_\u0134a_Ve_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "YYYY-MM-DD",
        LL: "D[-an de] MMMM, YYYY",
        LLL: "D[-an de] MMMM, YYYY LT",
        LLLL: "dddd, [la] D[-an de] MMMM, YYYY LT"
      },
      meridiemParse: /[ap]\.t\.m/i,
      isPM: function(input) {
        return input.charAt(0).toLowerCase() === "p"
      },
      meridiem: function(hours, minutes, isLower) {
        if (hours > 11) return isLower ? "p.t.m." : "P.T.M.";
        else return isLower ? "a.t.m." : "A.T.M."
      },
      calendar: {
        sameDay: "[Hodia\u016d je] LT",
        nextDay: "[Morga\u016d je] LT",
        nextWeek: "dddd [je] LT",
        lastDay: "[Hiera\u016d je] LT",
        lastWeek: "[pasinta] dddd [je] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "je %s",
        past: "anta\u016d %s",
        s: "sekundoj",
        m: "minuto",
        mm: "%d minutoj",
        h: "horo",
        hh: "%d horoj",
        d: "tago",
        dd: "%d tagoj",
        M: "monato",
        MM: "%d monatoj",
        y: "jaro",
        yy: "%d jaroj"
      },
      ordinalParse: /\d{1,2}a/,
      ordinal: "%da",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var monthsShortDot = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),
      monthsShort = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_");
    return moment.defineLocale("es", {
      months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
      monthsShort: function(m, format) {
        if (/-MMM-/.test(format)) return monthsShort[m.month()];
        else return monthsShortDot[m.month()]
      },
      weekdays: "domingo_lunes_martes_mi\u00e9rcoles_jueves_viernes_s\u00e1bado".split("_"),
      weekdaysShort: "dom._lun._mar._mi\u00e9._jue._vie._s\u00e1b.".split("_"),
      weekdaysMin: "Do_Lu_Ma_Mi_Ju_Vi_S\u00e1".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D [de] MMMM [de] YYYY",
        LLL: "D [de] MMMM [de] YYYY LT",
        LLLL: "dddd, D [de] MMMM [de] YYYY LT"
      },
      calendar: {
        sameDay: function() {
          return "[hoy a la" + (this.hours() !== 1 ? "s" : "") + "] LT"
        },
        nextDay: function() {
          return "[ma\u00f1ana a la" + (this.hours() !== 1 ? "s" : "") + "] LT"
        },
        nextWeek: function() {
          return "dddd [a la" + (this.hours() !== 1 ? "s" : "") + "] LT"
        },
        lastDay: function() {
          return "[ayer a la" + (this.hours() !== 1 ? "s" : "") + "] LT"
        },
        lastWeek: function() {
          return "[el] dddd [pasado a la" +
            (this.hours() !== 1 ? "s" : "") + "] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "en %s",
        past: "hace %s",
        s: "unos segundos",
        m: "un minuto",
        mm: "%d minutos",
        h: "una hora",
        hh: "%d horas",
        d: "un d\u00eda",
        dd: "%d d\u00edas",
        M: "un mes",
        MM: "%d meses",
        y: "un a\u00f1o",
        yy: "%d a\u00f1os"
      },
      ordinalParse: /\d{1,2}\u00ba/,
      ordinal: "%d\u00ba",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
      var format = {
        "s": ["m\u00f5ne sekundi", "m\u00f5ni sekund",
          "paar sekundit"
        ],
        "m": ["\u00fche minuti", "\u00fcks minut"],
        "mm": [number + " minuti", number + " minutit"],
        "h": ["\u00fche tunni", "tund aega", "\u00fcks tund"],
        "hh": [number + " tunni", number + " tundi"],
        "d": ["\u00fche p\u00e4eva", "\u00fcks p\u00e4ev"],
        "M": ["kuu aja", "kuu aega", "\u00fcks kuu"],
        "MM": [number + " kuu", number + " kuud"],
        "y": ["\u00fche aasta", "aasta", "\u00fcks aasta"],
        "yy": [number + " aasta", number + " aastat"]
      };
      if (withoutSuffix) return format[key][2] ? format[key][2] : format[key][1];
      return isFuture ? format[key][0] :
        format[key][1]
    }
    return moment.defineLocale("et", {
      months: "jaanuar_veebruar_m\u00e4rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),
      monthsShort: "jaan_veebr_m\u00e4rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),
      weekdays: "p\u00fchap\u00e4ev_esmasp\u00e4ev_teisip\u00e4ev_kolmap\u00e4ev_neljap\u00e4ev_reede_laup\u00e4ev".split("_"),
      weekdaysShort: "P_E_T_K_N_R_L".split("_"),
      weekdaysMin: "P_E_T_K_N_R_L".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[T\u00e4na,] LT",
        nextDay: "[Homme,] LT",
        nextWeek: "[J\u00e4rgmine] dddd LT",
        lastDay: "[Eile,] LT",
        lastWeek: "[Eelmine] dddd LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s p\u00e4rast",
        past: "%s tagasi",
        s: processRelativeTime,
        m: processRelativeTime,
        mm: processRelativeTime,
        h: processRelativeTime,
        hh: processRelativeTime,
        d: processRelativeTime,
        dd: "%d p\u00e4eva",
        M: processRelativeTime,
        MM: processRelativeTime,
        y: processRelativeTime,
        yy: processRelativeTime
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("eu", {
      months: "urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),
      monthsShort: "urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),
      weekdays: "igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),
      weekdaysShort: "ig._al._ar._az._og._ol._lr.".split("_"),
      weekdaysMin: "ig_al_ar_az_og_ol_lr".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "YYYY-MM-DD",
        LL: "YYYY[ko] MMMM[ren] D[a]",
        LLL: "YYYY[ko] MMMM[ren] D[a] LT",
        LLLL: "dddd, YYYY[ko] MMMM[ren] D[a] LT",
        l: "YYYY-M-D",
        ll: "YYYY[ko] MMM D[a]",
        lll: "YYYY[ko] MMM D[a] LT",
        llll: "ddd, YYYY[ko] MMM D[a] LT"
      },
      calendar: {
        sameDay: "[gaur] LT[etan]",
        nextDay: "[bihar] LT[etan]",
        nextWeek: "dddd LT[etan]",
        lastDay: "[atzo] LT[etan]",
        lastWeek: "[aurreko] dddd LT[etan]",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s barru",
        past: "duela %s",
        s: "segundo batzuk",
        m: "minutu bat",
        mm: "%d minutu",
        h: "ordu bat",
        hh: "%d ordu",
        d: "egun bat",
        dd: "%d egun",
        M: "hilabete bat",
        MM: "%d hilabete",
        y: "urte bat",
        yy: "%d urte"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u06f1",
        2: "\u06f2",
        3: "\u06f3",
        4: "\u06f4",
        5: "\u06f5",
        6: "\u06f6",
        7: "\u06f7",
        8: "\u06f8",
        9: "\u06f9",
        0: "\u06f0"
      },
      numberMap = {
        "\u06f1": "1",
        "\u06f2": "2",
        "\u06f3": "3",
        "\u06f4": "4",
        "\u06f5": "5",
        "\u06f6": "6",
        "\u06f7": "7",
        "\u06f8": "8",
        "\u06f9": "9",
        "\u06f0": "0"
      };
    return moment.defineLocale("fa", {
      months: "\u0698\u0627\u0646\u0648\u06cc\u0647_\u0641\u0648\u0631\u06cc\u0647_\u0645\u0627\u0631\u0633_\u0622\u0648\u0631\u06cc\u0644_\u0645\u0647_\u0698\u0648\u0626\u0646_\u0698\u0648\u0626\u06cc\u0647_\u0627\u0648\u062a_\u0633\u067e\u062a\u0627\u0645\u0628\u0631_\u0627\u06a9\u062a\u0628\u0631_\u0646\u0648\u0627\u0645\u0628\u0631_\u062f\u0633\u0627\u0645\u0628\u0631".split("_"),
      monthsShort: "\u0698\u0627\u0646\u0648\u06cc\u0647_\u0641\u0648\u0631\u06cc\u0647_\u0645\u0627\u0631\u0633_\u0622\u0648\u0631\u06cc\u0644_\u0645\u0647_\u0698\u0648\u0626\u0646_\u0698\u0648\u0626\u06cc\u0647_\u0627\u0648\u062a_\u0633\u067e\u062a\u0627\u0645\u0628\u0631_\u0627\u06a9\u062a\u0628\u0631_\u0646\u0648\u0627\u0645\u0628\u0631_\u062f\u0633\u0627\u0645\u0628\u0631".split("_"),
      weekdays: "\u06cc\u06a9\u200c\u0634\u0646\u0628\u0647_\u062f\u0648\u0634\u0646\u0628\u0647_\u0633\u0647\u200c\u0634\u0646\u0628\u0647_\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647_\u067e\u0646\u062c\u200c\u0634\u0646\u0628\u0647_\u062c\u0645\u0639\u0647_\u0634\u0646\u0628\u0647".split("_"),
      weekdaysShort: "\u06cc\u06a9\u200c\u0634\u0646\u0628\u0647_\u062f\u0648\u0634\u0646\u0628\u0647_\u0633\u0647\u200c\u0634\u0646\u0628\u0647_\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647_\u067e\u0646\u062c\u200c\u0634\u0646\u0628\u0647_\u062c\u0645\u0639\u0647_\u0634\u0646\u0628\u0647".split("_"),
      weekdaysMin: "\u06cc_\u062f_\u0633_\u0686_\u067e_\u062c_\u0634".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      meridiemParse: /\u0642\u0628\u0644 \u0627\u0632 \u0638\u0647\u0631|\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631/,
      isPM: function(input) {
        return /\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 12) return "\u0642\u0628\u0644 \u0627\u0632 \u0638\u0647\u0631";
        else return "\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631"
      },
      calendar: {
        sameDay: "[\u0627\u0645\u0631\u0648\u0632 \u0633\u0627\u0639\u062a] LT",
        nextDay: "[\u0641\u0631\u062f\u0627 \u0633\u0627\u0639\u062a] LT",
        nextWeek: "dddd [\u0633\u0627\u0639\u062a] LT",
        lastDay: "[\u062f\u06cc\u0631\u0648\u0632 \u0633\u0627\u0639\u062a] LT",
        lastWeek: "dddd [\u067e\u06cc\u0634] [\u0633\u0627\u0639\u062a] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u062f\u0631 %s",
        past: "%s \u067e\u06cc\u0634",
        s: "\u0686\u0646\u062f\u06cc\u0646 \u062b\u0627\u0646\u06cc\u0647",
        m: "\u06cc\u06a9 \u062f\u0642\u06cc\u0642\u0647",
        mm: "%d \u062f\u0642\u06cc\u0642\u0647",
        h: "\u06cc\u06a9 \u0633\u0627\u0639\u062a",
        hh: "%d \u0633\u0627\u0639\u062a",
        d: "\u06cc\u06a9 \u0631\u0648\u0632",
        dd: "%d \u0631\u0648\u0632",
        M: "\u06cc\u06a9 \u0645\u0627\u0647",
        MM: "%d \u0645\u0627\u0647",
        y: "\u06cc\u06a9 \u0633\u0627\u0644",
        yy: "%d \u0633\u0627\u0644"
      },
      preparse: function(string) {
        return string.replace(/[\u06f0-\u06f9]/g, function(match) {
          return numberMap[match]
        }).replace(/\u060c/g, ",")
      },
      postformat: function(string) {
        return string.replace(/\d/g,
          function(match) {
            return symbolMap[match]
          }).replace(/,/g, "\u060c")
      },
      ordinalParse: /\d{1,2}\u0645/,
      ordinal: "%d\u0645",
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var numbersPast = "nolla yksi kaksi kolme nelj\u00e4 viisi kuusi seitsem\u00e4n kahdeksan yhdeks\u00e4n".split(" "),
      numbersFuture = ["nolla", "yhden", "kahden", "kolmen", "nelj\u00e4n", "viiden", "kuuden", numbersPast[7], numbersPast[8], numbersPast[9]];

    function translate(number, withoutSuffix, key, isFuture) {
      var result = "";
      switch (key) {
        case "s":
          return isFuture ? "muutaman sekunnin" : "muutama sekunti";
        case "m":
          return isFuture ? "minuutin" : "minuutti";
        case "mm":
          result = isFuture ? "minuutin" : "minuuttia";
          break;
        case "h":
          return isFuture ? "tunnin" : "tunti";
        case "hh":
          result = isFuture ? "tunnin" : "tuntia";
          break;
        case "d":
          return isFuture ? "p\u00e4iv\u00e4n" : "p\u00e4iv\u00e4";
        case "dd":
          result = isFuture ? "p\u00e4iv\u00e4n" : "p\u00e4iv\u00e4\u00e4";
          break;
        case "M":
          return isFuture ? "kuukauden" : "kuukausi";
        case "MM":
          result = isFuture ? "kuukauden" : "kuukautta";
          break;
        case "y":
          return isFuture ? "vuoden" : "vuosi";
        case "yy":
          result = isFuture ? "vuoden" : "vuotta";
          break
      }
      result = verbalNumber(number, isFuture) + " " + result;
      return result
    }

    function verbalNumber(number, isFuture) {
      return number < 10 ? isFuture ? numbersFuture[number] : numbersPast[number] : number
    }
    return moment.defineLocale("fi", {
      months: "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kes\u00e4kuu_hein\u00e4kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),
      monthsShort: "tammi_helmi_maalis_huhti_touko_kes\u00e4_hein\u00e4_elo_syys_loka_marras_joulu".split("_"),
      weekdays: "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),
      weekdaysShort: "su_ma_ti_ke_to_pe_la".split("_"),
      weekdaysMin: "su_ma_ti_ke_to_pe_la".split("_"),
      longDateFormat: {
        LT: "HH.mm",
        LTS: "HH.mm.ss",
        L: "DD.MM.YYYY",
        LL: "Do MMMM[ta] YYYY",
        LLL: "Do MMMM[ta] YYYY, [klo] LT",
        LLLL: "dddd, Do MMMM[ta] YYYY, [klo] LT",
        l: "D.M.YYYY",
        ll: "Do MMM YYYY",
        lll: "Do MMM YYYY, [klo] LT",
        llll: "ddd, Do MMM YYYY, [klo] LT"
      },
      calendar: {
        sameDay: "[t\u00e4n\u00e4\u00e4n] [klo] LT",
        nextDay: "[huomenna] [klo] LT",
        nextWeek: "dddd [klo] LT",
        lastDay: "[eilen] [klo] LT",
        lastWeek: "[viime] dddd[na] [klo] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s p\u00e4\u00e4st\u00e4",
        past: "%s sitten",
        s: translate,
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: translate,
        dd: translate,
        M: translate,
        MM: translate,
        y: translate,
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("fo", {
      months: "januar_februar_mars_apr\u00edl_mai_juni_juli_august_september_oktober_november_desember".split("_"),
      monthsShort: "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
      weekdays: "sunnudagur_m\u00e1nadagur_t\u00fdsdagur_mikudagur_h\u00f3sdagur_fr\u00edggjadagur_leygardagur".split("_"),
      weekdaysShort: "sun_m\u00e1n_t\u00fds_mik_h\u00f3s_fr\u00ed_ley".split("_"),
      weekdaysMin: "su_m\u00e1_t\u00fd_mi_h\u00f3_fr_le".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D. MMMM, YYYY LT"
      },
      calendar: {
        sameDay: "[\u00cd dag kl.] LT",
        nextDay: "[\u00cd morgin kl.] LT",
        nextWeek: "dddd [kl.] LT",
        lastDay: "[\u00cd gj\u00e1r kl.] LT",
        lastWeek: "[s\u00ed\u00f0stu] dddd [kl] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "um %s",
        past: "%s s\u00ed\u00f0ani",
        s: "f\u00e1 sekund",
        m: "ein minutt",
        mm: "%d minuttir",
        h: "ein t\u00edmi",
        hh: "%d t\u00edmar",
        d: "ein dagur",
        dd: "%d dagar",
        M: "ein m\u00e1na\u00f0i",
        MM: "%d m\u00e1na\u00f0ir",
        y: "eitt \u00e1r",
        yy: "%d \u00e1r"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("fr-ca", {
      months: "janvier_f\u00e9vrier_mars_avril_mai_juin_juillet_ao\u00fbt_septembre_octobre_novembre_d\u00e9cembre".split("_"),
      monthsShort: "janv._f\u00e9vr._mars_avr._mai_juin_juil._ao\u00fbt_sept._oct._nov._d\u00e9c.".split("_"),
      weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
      weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
      weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "YYYY-MM-DD",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Aujourd'hui \u00e0] LT",
        nextDay: "[Demain \u00e0] LT",
        nextWeek: "dddd [\u00e0] LT",
        lastDay: "[Hier \u00e0] LT",
        lastWeek: "dddd [dernier \u00e0] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "dans %s",
        past: "il y a %s",
        s: "quelques secondes",
        m: "une minute",
        mm: "%d minutes",
        h: "une heure",
        hh: "%d heures",
        d: "un jour",
        dd: "%d jours",
        M: "un mois",
        MM: "%d mois",
        y: "un an",
        yy: "%d ans"
      },
      ordinalParse: /\d{1,2}(er|)/,
      ordinal: function(number) {
        return number + (number === 1 ? "er" : "")
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("fr", {
      months: "janvier_f\u00e9vrier_mars_avril_mai_juin_juillet_ao\u00fbt_septembre_octobre_novembre_d\u00e9cembre".split("_"),
      monthsShort: "janv._f\u00e9vr._mars_avr._mai_juin_juil._ao\u00fbt_sept._oct._nov._d\u00e9c.".split("_"),
      weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
      weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
      weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Aujourd'hui \u00e0] LT",
        nextDay: "[Demain \u00e0] LT",
        nextWeek: "dddd [\u00e0] LT",
        lastDay: "[Hier \u00e0] LT",
        lastWeek: "dddd [dernier \u00e0] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "dans %s",
        past: "il y a %s",
        s: "quelques secondes",
        m: "une minute",
        mm: "%d minutes",
        h: "une heure",
        hh: "%d heures",
        d: "un jour",
        dd: "%d jours",
        M: "un mois",
        MM: "%d mois",
        y: "un an",
        yy: "%d ans"
      },
      ordinalParse: /\d{1,2}(er|)/,
      ordinal: function(number) {
        return number + (number === 1 ? "er" : "")
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var monthsShortWithDots =
      "jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.".split("_"),
      monthsShortWithoutDots = "jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_");
    return moment.defineLocale("fy", {
      months: "jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber".split("_"),
      monthsShort: function(m, format) {
        if (/-MMM-/.test(format)) return monthsShortWithoutDots[m.month()];
        else return monthsShortWithDots[m.month()]
      },
      weekdays: "snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon".split("_"),
      weekdaysShort: "si._mo._ti._wo._to._fr._so.".split("_"),
      weekdaysMin: "Si_Mo_Ti_Wo_To_Fr_So".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD-MM-YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[hjoed om] LT",
        nextDay: "[moarn om] LT",
        nextWeek: "dddd [om] LT",
        lastDay: "[juster om] LT",
        lastWeek: "[\u00f4fr\u00fbne] dddd [om] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "oer %s",
        past: "%s lyn",
        s: "in pear sekonden",
        m: "ien min\u00fat",
        mm: "%d minuten",
        h: "ien oere",
        hh: "%d oeren",
        d: "ien dei",
        dd: "%d dagen",
        M: "ien moanne",
        MM: "%d moannen",
        y: "ien jier",
        yy: "%d jierren"
      },
      ordinalParse: /\d{1,2}(ste|de)/,
      ordinal: function(number) {
        return number + (number === 1 || number === 8 || number >= 20 ? "ste" : "de")
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("gl", {
      months: "Xaneiro_Febreiro_Marzo_Abril_Maio_Xu\u00f1o_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro".split("_"),
      monthsShort: "Xan._Feb._Mar._Abr._Mai._Xu\u00f1._Xul._Ago._Set._Out._Nov._Dec.".split("_"),
      weekdays: "Domingo_Luns_Martes_M\u00e9rcores_Xoves_Venres_S\u00e1bado".split("_"),
      weekdaysShort: "Dom._Lun._Mar._M\u00e9r._Xov._Ven._S\u00e1b.".split("_"),
      weekdaysMin: "Do_Lu_Ma_M\u00e9_Xo_Ve_S\u00e1".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: function() {
          return "[hoxe " + (this.hours() !== 1 ? "\u00e1s" : "\u00e1") + "] LT"
        },
        nextDay: function() {
          return "[ma\u00f1\u00e1 " + (this.hours() !== 1 ? "\u00e1s" : "\u00e1") + "] LT"
        },
        nextWeek: function() {
          return "dddd [" + (this.hours() !== 1 ? "\u00e1s" : "a") + "] LT"
        },
        lastDay: function() {
          return "[onte " + (this.hours() !== 1 ? "\u00e1" : "a") + "] LT"
        },
        lastWeek: function() {
          return "[o] dddd [pasado " + (this.hours() !== 1 ? "\u00e1s" : "a") + "] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: function(str) {
          if (str === "uns segundos") return "nuns segundos";
          return "en " + str
        },
        past: "hai %s",
        s: "uns segundos",
        m: "un minuto",
        mm: "%d minutos",
        h: "unha hora",
        hh: "%d horas",
        d: "un d\u00eda",
        dd: "%d d\u00edas",
        M: "un mes",
        MM: "%d meses",
        y: "un ano",
        yy: "%d anos"
      },
      ordinalParse: /\d{1,2}\u00ba/,
      ordinal: "%d\u00ba",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("he", {
      months: "\u05d9\u05e0\u05d5\u05d0\u05e8_\u05e4\u05d1\u05e8\u05d5\u05d0\u05e8_\u05de\u05e8\u05e5_\u05d0\u05e4\u05e8\u05d9\u05dc_\u05de\u05d0\u05d9_\u05d9\u05d5\u05e0\u05d9_\u05d9\u05d5\u05dc\u05d9_\u05d0\u05d5\u05d2\u05d5\u05e1\u05d8_\u05e1\u05e4\u05d8\u05de\u05d1\u05e8_\u05d0\u05d5\u05e7\u05d8\u05d5\u05d1\u05e8_\u05e0\u05d5\u05d1\u05de\u05d1\u05e8_\u05d3\u05e6\u05de\u05d1\u05e8".split("_"),
      monthsShort: "\u05d9\u05e0\u05d5\u05f3_\u05e4\u05d1\u05e8\u05f3_\u05de\u05e8\u05e5_\u05d0\u05e4\u05e8\u05f3_\u05de\u05d0\u05d9_\u05d9\u05d5\u05e0\u05d9_\u05d9\u05d5\u05dc\u05d9_\u05d0\u05d5\u05d2\u05f3_\u05e1\u05e4\u05d8\u05f3_\u05d0\u05d5\u05e7\u05f3_\u05e0\u05d5\u05d1\u05f3_\u05d3\u05e6\u05de\u05f3".split("_"),
      weekdays: "\u05e8\u05d0\u05e9\u05d5\u05df_\u05e9\u05e0\u05d9_\u05e9\u05dc\u05d9\u05e9\u05d9_\u05e8\u05d1\u05d9\u05e2\u05d9_\u05d7\u05de\u05d9\u05e9\u05d9_\u05e9\u05d9\u05e9\u05d9_\u05e9\u05d1\u05ea".split("_"),
      weekdaysShort: "\u05d0\u05f3_\u05d1\u05f3_\u05d2\u05f3_\u05d3\u05f3_\u05d4\u05f3_\u05d5\u05f3_\u05e9\u05f3".split("_"),
      weekdaysMin: "\u05d0_\u05d1_\u05d2_\u05d3_\u05d4_\u05d5_\u05e9".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D [\u05d1]MMMM YYYY",
        LLL: "D [\u05d1]MMMM YYYY LT",
        LLLL: "dddd, D [\u05d1]MMMM YYYY LT",
        l: "D/M/YYYY",
        ll: "D MMM YYYY",
        lll: "D MMM YYYY LT",
        llll: "ddd, D MMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u05d4\u05d9\u05d5\u05dd \u05d1\u05be]LT",
        nextDay: "[\u05de\u05d7\u05e8 \u05d1\u05be]LT",
        nextWeek: "dddd [\u05d1\u05e9\u05e2\u05d4] LT",
        lastDay: "[\u05d0\u05ea\u05de\u05d5\u05dc \u05d1\u05be]LT",
        lastWeek: "[\u05d1\u05d9\u05d5\u05dd] dddd [\u05d4\u05d0\u05d7\u05e8\u05d5\u05df \u05d1\u05e9\u05e2\u05d4] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u05d1\u05e2\u05d5\u05d3 %s",
        past: "\u05dc\u05e4\u05e0\u05d9 %s",
        s: "\u05de\u05e1\u05e4\u05e8 \u05e9\u05e0\u05d9\u05d5\u05ea",
        m: "\u05d3\u05e7\u05d4",
        mm: "%d \u05d3\u05e7\u05d5\u05ea",
        h: "\u05e9\u05e2\u05d4",
        hh: function(number) {
          if (number === 2) return "\u05e9\u05e2\u05ea\u05d9\u05d9\u05dd";
          return number + " \u05e9\u05e2\u05d5\u05ea"
        },
        d: "\u05d9\u05d5\u05dd",
        dd: function(number) {
          if (number === 2) return "\u05d9\u05d5\u05de\u05d9\u05d9\u05dd";
          return number + " \u05d9\u05de\u05d9\u05dd"
        },
        M: "\u05d7\u05d5\u05d3\u05e9",
        MM: function(number) {
          if (number === 2) return "\u05d7\u05d5\u05d3\u05e9\u05d9\u05d9\u05dd";
          return number + " \u05d7\u05d5\u05d3\u05e9\u05d9\u05dd"
        },
        y: "\u05e9\u05e0\u05d4",
        yy: function(number) {
          if (number === 2) return "\u05e9\u05e0\u05ea\u05d9\u05d9\u05dd";
          else if (number % 10 === 0 && number !== 10) return number +
            " \u05e9\u05e0\u05d4";
          return number + " \u05e9\u05e0\u05d9\u05dd"
        }
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0967",
        2: "\u0968",
        3: "\u0969",
        4: "\u096a",
        5: "\u096b",
        6: "\u096c",
        7: "\u096d",
        8: "\u096e",
        9: "\u096f",
        0: "\u0966"
      },
      numberMap = {
        "\u0967": "1",
        "\u0968": "2",
        "\u0969": "3",
        "\u096a": "4",
        "\u096b": "5",
        "\u096c": "6",
        "\u096d": "7",
        "\u096e": "8",
        "\u096f": "9",
        "\u0966": "0"
      };
    return moment.defineLocale("hi", {
      months: "\u091c\u0928\u0935\u0930\u0940_\u092b\u093c\u0930\u0935\u0930\u0940_\u092e\u093e\u0930\u094d\u091a_\u0905\u092a\u094d\u0930\u0948\u0932_\u092e\u0908_\u091c\u0942\u0928_\u091c\u0941\u0932\u093e\u0908_\u0905\u0917\u0938\u094d\u0924_\u0938\u093f\u0924\u092e\u094d\u092c\u0930_\u0905\u0915\u094d\u091f\u0942\u092c\u0930_\u0928\u0935\u092e\u094d\u092c\u0930_\u0926\u093f\u0938\u092e\u094d\u092c\u0930".split("_"),
      monthsShort: "\u091c\u0928._\u092b\u093c\u0930._\u092e\u093e\u0930\u094d\u091a_\u0905\u092a\u094d\u0930\u0948._\u092e\u0908_\u091c\u0942\u0928_\u091c\u0941\u0932._\u0905\u0917._\u0938\u093f\u0924._\u0905\u0915\u094d\u091f\u0942._\u0928\u0935._\u0926\u093f\u0938.".split("_"),
      weekdays: "\u0930\u0935\u093f\u0935\u093e\u0930_\u0938\u094b\u092e\u0935\u093e\u0930_\u092e\u0902\u0917\u0932\u0935\u093e\u0930_\u092c\u0941\u0927\u0935\u093e\u0930_\u0917\u0941\u0930\u0942\u0935\u093e\u0930_\u0936\u0941\u0915\u094d\u0930\u0935\u093e\u0930_\u0936\u0928\u093f\u0935\u093e\u0930".split("_"),
      weekdaysShort: "\u0930\u0935\u093f_\u0938\u094b\u092e_\u092e\u0902\u0917\u0932_\u092c\u0941\u0927_\u0917\u0941\u0930\u0942_\u0936\u0941\u0915\u094d\u0930_\u0936\u0928\u093f".split("_"),
      weekdaysMin: "\u0930_\u0938\u094b_\u092e\u0902_\u092c\u0941_\u0917\u0941_\u0936\u0941_\u0936".split("_"),
      longDateFormat: {
        LT: "A h:mm \u092c\u091c\u0947",
        LTS: "A h:mm:ss \u092c\u091c\u0947",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0906\u091c] LT",
        nextDay: "[\u0915\u0932] LT",
        nextWeek: "dddd, LT",
        lastDay: "[\u0915\u0932] LT",
        lastWeek: "[\u092a\u093f\u091b\u0932\u0947] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u092e\u0947\u0902",
        past: "%s \u092a\u0939\u0932\u0947",
        s: "\u0915\u0941\u091b \u0939\u0940 \u0915\u094d\u0937\u0923",
        m: "\u090f\u0915 \u092e\u093f\u0928\u091f",
        mm: "%d \u092e\u093f\u0928\u091f",
        h: "\u090f\u0915 \u0918\u0902\u091f\u093e",
        hh: "%d \u0918\u0902\u091f\u0947",
        d: "\u090f\u0915 \u0926\u093f\u0928",
        dd: "%d \u0926\u093f\u0928",
        M: "\u090f\u0915 \u092e\u0939\u0940\u0928\u0947",
        MM: "%d \u092e\u0939\u0940\u0928\u0947",
        y: "\u090f\u0915 \u0935\u0930\u094d\u0937",
        yy: "%d \u0935\u0930\u094d\u0937"
      },
      preparse: function(string) {
        return string.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        })
      },
      meridiemParse: /\u0930\u093e\u0924|\u0938\u0941\u092c\u0939|\u0926\u094b\u092a\u0939\u0930|\u0936\u093e\u092e/,
      meridiemHour: function(hour,
        meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "\u0930\u093e\u0924") return hour < 4 ? hour : hour + 12;
        else if (meridiem === "\u0938\u0941\u092c\u0939") return hour;
        else if (meridiem === "\u0926\u094b\u092a\u0939\u0930") return hour >= 10 ? hour : hour + 12;
        else if (meridiem === "\u0936\u093e\u092e") return hour + 12
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u0930\u093e\u0924";
        else if (hour < 10) return "\u0938\u0941\u092c\u0939";
        else if (hour < 17) return "\u0926\u094b\u092a\u0939\u0930";
        else if (hour < 20) return "\u0936\u093e\u092e";
        else return "\u0930\u093e\u0924"
      },
      week: {
        dow: 0,
        doy: 6
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function translate(number, withoutSuffix, key) {
      var result = number + " ";
      switch (key) {
        case "m":
          return withoutSuffix ? "jedna minuta" : "jedne minute";
        case "mm":
          if (number === 1) result += "minuta";
          else if (number === 2 || number === 3 || number === 4) result += "minute";
          else result += "minuta";
          return result;
        case "h":
          return withoutSuffix ? "jedan sat" : "jednog sata";
        case "hh":
          if (number === 1) result += "sat";
          else if (number === 2 || number ===
            3 || number === 4) result += "sata";
          else result += "sati";
          return result;
        case "dd":
          if (number === 1) result += "dan";
          else result += "dana";
          return result;
        case "MM":
          if (number === 1) result += "mjesec";
          else if (number === 2 || number === 3 || number === 4) result += "mjeseca";
          else result += "mjeseci";
          return result;
        case "yy":
          if (number === 1) result += "godina";
          else if (number === 2 || number === 3 || number === 4) result += "godine";
          else result += "godina";
          return result
      }
    }
    return moment.defineLocale("hr", {
      months: "sje\u010danj_velja\u010da_o\u017eujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_"),
      monthsShort: "sje._vel._o\u017eu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),
      weekdays: "nedjelja_ponedjeljak_utorak_srijeda_\u010detvrtak_petak_subota".split("_"),
      weekdaysShort: "ned._pon._uto._sri._\u010det._pet._sub.".split("_"),
      weekdaysMin: "ne_po_ut_sr_\u010de_pe_su".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD. MM. YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[danas u] LT",
        nextDay: "[sutra u] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[u] [nedjelju] [u] LT";
            case 3:
              return "[u] [srijedu] [u] LT";
            case 6:
              return "[u] [subotu] [u] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[u] dddd [u] LT"
          }
        },
        lastDay: "[ju\u010der u] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
              return "[pro\u0161lu] dddd [u] LT";
            case 6:
              return "[pro\u0161le] [subote] [u] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[pro\u0161li] dddd [u] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "prije %s",
        s: "par sekundi",
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: "dan",
        dd: translate,
        M: "mjesec",
        MM: translate,
        y: "godinu",
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var weekEndings = "vas\u00e1rnap h\u00e9tf\u0151n kedden szerd\u00e1n cs\u00fct\u00f6rt\u00f6k\u00f6n p\u00e9nteken szombaton".split(" ");

    function translate(number, withoutSuffix, key, isFuture) {
      var num = number,
        suffix;
      switch (key) {
        case "s":
          return isFuture || withoutSuffix ? "n\u00e9h\u00e1ny m\u00e1sodperc" : "n\u00e9h\u00e1ny m\u00e1sodperce";
        case "m":
          return "egy" +
            (isFuture || withoutSuffix ? " perc" : " perce");
        case "mm":
          return num + (isFuture || withoutSuffix ? " perc" : " perce");
        case "h":
          return "egy" + (isFuture || withoutSuffix ? " \u00f3ra" : " \u00f3r\u00e1ja");
        case "hh":
          return num + (isFuture || withoutSuffix ? " \u00f3ra" : " \u00f3r\u00e1ja");
        case "d":
          return "egy" + (isFuture || withoutSuffix ? " nap" : " napja");
        case "dd":
          return num + (isFuture || withoutSuffix ? " nap" : " napja");
        case "M":
          return "egy" + (isFuture || withoutSuffix ? " h\u00f3nap" : " h\u00f3napja");
        case "MM":
          return num + (isFuture || withoutSuffix ?
            " h\u00f3nap" : " h\u00f3napja");
        case "y":
          return "egy" + (isFuture || withoutSuffix ? " \u00e9v" : " \u00e9ve");
        case "yy":
          return num + (isFuture || withoutSuffix ? " \u00e9v" : " \u00e9ve")
      }
      return ""
    }

    function week(isFuture) {
      return (isFuture ? "" : "[m\u00falt] ") + "[" + weekEndings[this.day()] + "] LT[-kor]"
    }
    return moment.defineLocale("hu", {
      months: "janu\u00e1r_febru\u00e1r_m\u00e1rcius_\u00e1prilis_m\u00e1jus_j\u00fanius_j\u00falius_augusztus_szeptember_okt\u00f3ber_november_december".split("_"),
      monthsShort: "jan_feb_m\u00e1rc_\u00e1pr_m\u00e1j_j\u00fan_j\u00fal_aug_szept_okt_nov_dec".split("_"),
      weekdays: "vas\u00e1rnap_h\u00e9tf\u0151_kedd_szerda_cs\u00fct\u00f6rt\u00f6k_p\u00e9ntek_szombat".split("_"),
      weekdaysShort: "vas_h\u00e9t_kedd_sze_cs\u00fct_p\u00e9n_szo".split("_"),
      weekdaysMin: "v_h_k_sze_cs_p_szo".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "YYYY.MM.DD.",
        LL: "YYYY. MMMM D.",
        LLL: "YYYY. MMMM D., LT",
        LLLL: "YYYY. MMMM D., dddd LT"
      },
      meridiemParse: /de|du/i,
      isPM: function(input) {
        return input.charAt(1).toLowerCase() === "u"
      },
      meridiem: function(hours, minutes, isLower) {
        if (hours < 12) return isLower ===
          true ? "de" : "DE";
        else return isLower === true ? "du" : "DU"
      },
      calendar: {
        sameDay: "[ma] LT[-kor]",
        nextDay: "[holnap] LT[-kor]",
        nextWeek: function() {
          return week.call(this, true)
        },
        lastDay: "[tegnap] LT[-kor]",
        lastWeek: function() {
          return week.call(this, false)
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "%s m\u00falva",
        past: "%s",
        s: translate,
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: translate,
        dd: translate,
        M: translate,
        MM: translate,
        y: translate,
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function monthsCaseReplace(m, format) {
      var months = {
          "nominative": "\u0570\u0578\u0582\u0576\u057e\u0561\u0580_\u0583\u0565\u057f\u0580\u057e\u0561\u0580_\u0574\u0561\u0580\u057f_\u0561\u057a\u0580\u056b\u056c_\u0574\u0561\u0575\u056b\u057d_\u0570\u0578\u0582\u0576\u056b\u057d_\u0570\u0578\u0582\u056c\u056b\u057d_\u0585\u0563\u0578\u057d\u057f\u0578\u057d_\u057d\u0565\u057a\u057f\u0565\u0574\u0562\u0565\u0580_\u0570\u0578\u056f\u057f\u0565\u0574\u0562\u0565\u0580_\u0576\u0578\u0575\u0565\u0574\u0562\u0565\u0580_\u0564\u0565\u056f\u057f\u0565\u0574\u0562\u0565\u0580".split("_"),
          "accusative": "\u0570\u0578\u0582\u0576\u057e\u0561\u0580\u056b_\u0583\u0565\u057f\u0580\u057e\u0561\u0580\u056b_\u0574\u0561\u0580\u057f\u056b_\u0561\u057a\u0580\u056b\u056c\u056b_\u0574\u0561\u0575\u056b\u057d\u056b_\u0570\u0578\u0582\u0576\u056b\u057d\u056b_\u0570\u0578\u0582\u056c\u056b\u057d\u056b_\u0585\u0563\u0578\u057d\u057f\u0578\u057d\u056b_\u057d\u0565\u057a\u057f\u0565\u0574\u0562\u0565\u0580\u056b_\u0570\u0578\u056f\u057f\u0565\u0574\u0562\u0565\u0580\u056b_\u0576\u0578\u0575\u0565\u0574\u0562\u0565\u0580\u056b_\u0564\u0565\u056f\u057f\u0565\u0574\u0562\u0565\u0580\u056b".split("_")
        },
        nounCase = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(format) ? "accusative" : "nominative";
      return months[nounCase][m.month()]
    }

    function monthsShortCaseReplace(m, format) {
      var monthsShort = "\u0570\u0576\u057e_\u0583\u057f\u0580_\u0574\u0580\u057f_\u0561\u057a\u0580_\u0574\u0575\u057d_\u0570\u0576\u057d_\u0570\u056c\u057d_\u0585\u0563\u057d_\u057d\u057a\u057f_\u0570\u056f\u057f_\u0576\u0574\u0562_\u0564\u056f\u057f".split("_");
      return monthsShort[m.month()]
    }

    function weekdaysCaseReplace(m, format) {
      var weekdays = "\u056f\u056b\u0580\u0561\u056f\u056b_\u0565\u0580\u056f\u0578\u0582\u0577\u0561\u0562\u0569\u056b_\u0565\u0580\u0565\u0584\u0577\u0561\u0562\u0569\u056b_\u0579\u0578\u0580\u0565\u0584\u0577\u0561\u0562\u0569\u056b_\u0570\u056b\u0576\u0563\u0577\u0561\u0562\u0569\u056b_\u0578\u0582\u0580\u0562\u0561\u0569_\u0577\u0561\u0562\u0561\u0569".split("_");
      return weekdays[m.day()]
    }
    return moment.defineLocale("hy-am", {
      months: monthsCaseReplace,
      monthsShort: monthsShortCaseReplace,
      weekdays: weekdaysCaseReplace,
      weekdaysShort: "\u056f\u0580\u056f_\u0565\u0580\u056f_\u0565\u0580\u0584_\u0579\u0580\u0584_\u0570\u0576\u0563_\u0578\u0582\u0580\u0562_\u0577\u0562\u0569".split("_"),
      weekdaysMin: "\u056f\u0580\u056f_\u0565\u0580\u056f_\u0565\u0580\u0584_\u0579\u0580\u0584_\u0570\u0576\u0563_\u0578\u0582\u0580\u0562_\u0577\u0562\u0569".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY \u0569.",
        LLL: "D MMMM YYYY \u0569., LT",
        LLLL: "dddd, D MMMM YYYY \u0569., LT"
      },
      calendar: {
        sameDay: "[\u0561\u0575\u057d\u0585\u0580] LT",
        nextDay: "[\u057e\u0561\u0572\u0568] LT",
        lastDay: "[\u0565\u0580\u0565\u056f] LT",
        nextWeek: function() {
          return "dddd [\u0585\u0580\u0568 \u056a\u0561\u0574\u0568] LT"
        },
        lastWeek: function() {
          return "[\u0561\u0576\u0581\u0561\u056e] dddd [\u0585\u0580\u0568 \u056a\u0561\u0574\u0568] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u0570\u0565\u057f\u0578",
        past: "%s \u0561\u057c\u0561\u057b",
        s: "\u0574\u056b \u0584\u0561\u0576\u056b \u057e\u0561\u0575\u0580\u056f\u0575\u0561\u0576",
        m: "\u0580\u0578\u057a\u0565",
        mm: "%d \u0580\u0578\u057a\u0565",
        h: "\u056a\u0561\u0574",
        hh: "%d \u056a\u0561\u0574",
        d: "\u0585\u0580",
        dd: "%d \u0585\u0580",
        M: "\u0561\u0574\u056b\u057d",
        MM: "%d \u0561\u0574\u056b\u057d",
        y: "\u057f\u0561\u0580\u056b",
        yy: "%d \u057f\u0561\u0580\u056b"
      },
      meridiemParse: /\u0563\u056b\u0577\u0565\u0580\u057e\u0561|\u0561\u057c\u0561\u057e\u0578\u057f\u057e\u0561|\u0581\u0565\u0580\u0565\u056f\u057e\u0561|\u0565\u0580\u0565\u056f\u0578\u0575\u0561\u0576/,
      isPM: function(input) {
        return /^(\u0581\u0565\u0580\u0565\u056f\u057e\u0561|\u0565\u0580\u0565\u056f\u0578\u0575\u0561\u0576)$/.test(input)
      },
      meridiem: function(hour) {
        if (hour < 4) return "\u0563\u056b\u0577\u0565\u0580\u057e\u0561";
        else if (hour < 12) return "\u0561\u057c\u0561\u057e\u0578\u057f\u057e\u0561";
        else if (hour < 17) return "\u0581\u0565\u0580\u0565\u056f\u057e\u0561";
        else return "\u0565\u0580\u0565\u056f\u0578\u0575\u0561\u0576"
      },
      ordinalParse: /\d{1,2}|\d{1,2}-(\u056b\u0576|\u0580\u0564)/,
      ordinal: function(number,
        period) {
        switch (period) {
          case "DDD":
          case "w":
          case "W":
          case "DDDo":
            if (number === 1) return number + "-\u056b\u0576";
            return number + "-\u0580\u0564";
          default:
            return number
        }
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("id", {
      months: "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),
      monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"),
      weekdays: "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),
      weekdaysShort: "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),
      weekdaysMin: "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),
      longDateFormat: {
        LT: "HH.mm",
        LTS: "LT.ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY [pukul] LT",
        LLLL: "dddd, D MMMM YYYY [pukul] LT"
      },
      meridiemParse: /pagi|siang|sore|malam/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "pagi") return hour;
        else if (meridiem === "siang") return hour >= 11 ? hour : hour + 12;
        else if (meridiem === "sore" || meridiem === "malam") return hour + 12
      },
      meridiem: function(hours,
        minutes, isLower) {
        if (hours < 11) return "pagi";
        else if (hours < 15) return "siang";
        else if (hours < 19) return "sore";
        else return "malam"
      },
      calendar: {
        sameDay: "[Hari ini pukul] LT",
        nextDay: "[Besok pukul] LT",
        nextWeek: "dddd [pukul] LT",
        lastDay: "[Kemarin pukul] LT",
        lastWeek: "dddd [lalu pukul] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "dalam %s",
        past: "%s yang lalu",
        s: "beberapa detik",
        m: "semenit",
        mm: "%d menit",
        h: "sejam",
        hh: "%d jam",
        d: "sehari",
        dd: "%d hari",
        M: "sebulan",
        MM: "%d bulan",
        y: "setahun",
        yy: "%d tahun"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function plural(n) {
      if (n % 100 === 11) return true;
      else if (n % 10 === 1) return false;
      return true
    }

    function translate(number, withoutSuffix, key, isFuture) {
      var result = number + " ";
      switch (key) {
        case "s":
          return withoutSuffix || isFuture ? "nokkrar sek\u00fandur" : "nokkrum sek\u00fandum";
        case "m":
          return withoutSuffix ? "m\u00edn\u00fata" : "m\u00edn\u00fatu";
        case "mm":
          if (plural(number)) return result + (withoutSuffix || isFuture ? "m\u00edn\u00fatur" : "m\u00edn\u00fatum");
          else if (withoutSuffix) return result +
            "m\u00edn\u00fata";
          return result + "m\u00edn\u00fatu";
        case "hh":
          if (plural(number)) return result + (withoutSuffix || isFuture ? "klukkustundir" : "klukkustundum");
          return result + "klukkustund";
        case "d":
          if (withoutSuffix) return "dagur";
          return isFuture ? "dag" : "degi";
        case "dd":
          if (plural(number)) {
            if (withoutSuffix) return result + "dagar";
            return result + (isFuture ? "daga" : "d\u00f6gum")
          } else if (withoutSuffix) return result + "dagur";
          return result + (isFuture ? "dag" : "degi");
        case "M":
          if (withoutSuffix) return "m\u00e1nu\u00f0ur";
          return isFuture ?
            "m\u00e1nu\u00f0" : "m\u00e1nu\u00f0i";
        case "MM":
          if (plural(number)) {
            if (withoutSuffix) return result + "m\u00e1nu\u00f0ir";
            return result + (isFuture ? "m\u00e1nu\u00f0i" : "m\u00e1nu\u00f0um")
          } else if (withoutSuffix) return result + "m\u00e1nu\u00f0ur";
          return result + (isFuture ? "m\u00e1nu\u00f0" : "m\u00e1nu\u00f0i");
        case "y":
          return withoutSuffix || isFuture ? "\u00e1r" : "\u00e1ri";
        case "yy":
          if (plural(number)) return result + (withoutSuffix || isFuture ? "\u00e1r" : "\u00e1rum");
          return result + (withoutSuffix || isFuture ? "\u00e1r" : "\u00e1ri")
      }
    }
    return moment.defineLocale("is", {
      months: "jan\u00faar_febr\u00faar_mars_apr\u00edl_ma\u00ed_j\u00fan\u00ed_j\u00fal\u00ed_\u00e1g\u00fast_september_okt\u00f3ber_n\u00f3vember_desember".split("_"),
      monthsShort: "jan_feb_mar_apr_ma\u00ed_j\u00fan_j\u00fal_\u00e1g\u00fa_sep_okt_n\u00f3v_des".split("_"),
      weekdays: "sunnudagur_m\u00e1nudagur_\u00feri\u00f0judagur_mi\u00f0vikudagur_fimmtudagur_f\u00f6studagur_laugardagur".split("_"),
      weekdaysShort: "sun_m\u00e1n_\u00feri_mi\u00f0_fim_f\u00f6s_lau".split("_"),
      weekdaysMin: "Su_M\u00e1_\u00der_Mi_Fi_F\u00f6_La".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY [kl.] LT",
        LLLL: "dddd, D. MMMM YYYY [kl.] LT"
      },
      calendar: {
        sameDay: "[\u00ed dag kl.] LT",
        nextDay: "[\u00e1 morgun kl.] LT",
        nextWeek: "dddd [kl.] LT",
        lastDay: "[\u00ed g\u00e6r kl.] LT",
        lastWeek: "[s\u00ed\u00f0asta] dddd [kl.] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "eftir %s",
        past: "fyrir %s s\u00ed\u00f0an",
        s: translate,
        m: translate,
        mm: translate,
        h: "klukkustund",
        hh: translate,
        d: translate,
        dd: translate,
        M: translate,
        MM: translate,
        y: translate,
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("it", {
      months: "gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre".split("_"),
      monthsShort: "gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"),
      weekdays: "Domenica_Luned\u00ec_Marted\u00ec_Mercoled\u00ec_Gioved\u00ec_Venerd\u00ec_Sabato".split("_"),
      weekdaysShort: "Dom_Lun_Mar_Mer_Gio_Ven_Sab".split("_"),
      weekdaysMin: "D_L_Ma_Me_G_V_S".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Oggi alle] LT",
        nextDay: "[Domani alle] LT",
        nextWeek: "dddd [alle] LT",
        lastDay: "[Ieri alle] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
              return "[la scorsa] dddd [alle] LT";
            default:
              return "[lo scorso] dddd [alle] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: function(s) {
          return (/^[0-9].+$/.test(s) ?
            "tra" : "in") + " " + s
        },
        past: "%s fa",
        s: "alcuni secondi",
        m: "un minuto",
        mm: "%d minuti",
        h: "un'ora",
        hh: "%d ore",
        d: "un giorno",
        dd: "%d giorni",
        M: "un mese",
        MM: "%d mesi",
        y: "un anno",
        yy: "%d anni"
      },
      ordinalParse: /\d{1,2}\u00ba/,
      ordinal: "%d\u00ba",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ja", {
      months: "1\u6708_2\u6708_3\u6708_4\u6708_5\u6708_6\u6708_7\u6708_8\u6708_9\u6708_10\u6708_11\u6708_12\u6708".split("_"),
      monthsShort: "1\u6708_2\u6708_3\u6708_4\u6708_5\u6708_6\u6708_7\u6708_8\u6708_9\u6708_10\u6708_11\u6708_12\u6708".split("_"),
      weekdays: "\u65e5\u66dc\u65e5_\u6708\u66dc\u65e5_\u706b\u66dc\u65e5_\u6c34\u66dc\u65e5_\u6728\u66dc\u65e5_\u91d1\u66dc\u65e5_\u571f\u66dc\u65e5".split("_"),
      weekdaysShort: "\u65e5_\u6708_\u706b_\u6c34_\u6728_\u91d1_\u571f".split("_"),
      weekdaysMin: "\u65e5_\u6708_\u706b_\u6c34_\u6728_\u91d1_\u571f".split("_"),
      longDateFormat: {
        LT: "Ah\u6642m\u5206",
        LTS: "LTs\u79d2",
        L: "YYYY/MM/DD",
        LL: "YYYY\u5e74M\u6708D\u65e5",
        LLL: "YYYY\u5e74M\u6708D\u65e5LT",
        LLLL: "YYYY\u5e74M\u6708D\u65e5LT dddd"
      },
      meridiemParse: /\u5348\u524d|\u5348\u5f8c/i,
      isPM: function(input) {
        return input === "\u5348\u5f8c"
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 12) return "\u5348\u524d";
        else return "\u5348\u5f8c"
      },
      calendar: {
        sameDay: "[\u4eca\u65e5] LT",
        nextDay: "[\u660e\u65e5] LT",
        nextWeek: "[\u6765\u9031]dddd LT",
        lastDay: "[\u6628\u65e5] LT",
        lastWeek: "[\u524d\u9031]dddd LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s\u5f8c",
        past: "%s\u524d",
        s: "\u6570\u79d2",
        m: "1\u5206",
        mm: "%d\u5206",
        h: "1\u6642\u9593",
        hh: "%d\u6642\u9593",
        d: "1\u65e5",
        dd: "%d\u65e5",
        M: "1\u30f6\u6708",
        MM: "%d\u30f6\u6708",
        y: "1\u5e74",
        yy: "%d\u5e74"
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function monthsCaseReplace(m, format) {
      var months = {
          "nominative": "\u10d8\u10d0\u10dc\u10d5\u10d0\u10e0\u10d8_\u10d7\u10d4\u10d1\u10d4\u10e0\u10d5\u10d0\u10da\u10d8_\u10db\u10d0\u10e0\u10e2\u10d8_\u10d0\u10de\u10e0\u10d8\u10da\u10d8_\u10db\u10d0\u10d8\u10e1\u10d8_\u10d8\u10d5\u10dc\u10d8\u10e1\u10d8_\u10d8\u10d5\u10da\u10d8\u10e1\u10d8_\u10d0\u10d2\u10d5\u10d8\u10e1\u10e2\u10dd_\u10e1\u10d4\u10e5\u10e2\u10d4\u10db\u10d1\u10d4\u10e0\u10d8_\u10dd\u10e5\u10e2\u10dd\u10db\u10d1\u10d4\u10e0\u10d8_\u10dc\u10dd\u10d4\u10db\u10d1\u10d4\u10e0\u10d8_\u10d3\u10d4\u10d9\u10d4\u10db\u10d1\u10d4\u10e0\u10d8".split("_"),
          "accusative": "\u10d8\u10d0\u10dc\u10d5\u10d0\u10e0\u10e1_\u10d7\u10d4\u10d1\u10d4\u10e0\u10d5\u10d0\u10da\u10e1_\u10db\u10d0\u10e0\u10e2\u10e1_\u10d0\u10de\u10e0\u10d8\u10da\u10d8\u10e1_\u10db\u10d0\u10d8\u10e1\u10e1_\u10d8\u10d5\u10dc\u10d8\u10e1\u10e1_\u10d8\u10d5\u10da\u10d8\u10e1\u10e1_\u10d0\u10d2\u10d5\u10d8\u10e1\u10e2\u10e1_\u10e1\u10d4\u10e5\u10e2\u10d4\u10db\u10d1\u10d4\u10e0\u10e1_\u10dd\u10e5\u10e2\u10dd\u10db\u10d1\u10d4\u10e0\u10e1_\u10dc\u10dd\u10d4\u10db\u10d1\u10d4\u10e0\u10e1_\u10d3\u10d4\u10d9\u10d4\u10db\u10d1\u10d4\u10e0\u10e1".split("_")
        },
        nounCase = /D[oD] *MMMM?/.test(format) ? "accusative" : "nominative";
      return months[nounCase][m.month()]
    }

    function weekdaysCaseReplace(m, format) {
      var weekdays = {
          "nominative": "\u10d9\u10d5\u10d8\u10e0\u10d0_\u10dd\u10e0\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8_\u10e1\u10d0\u10db\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8_\u10dd\u10d7\u10ee\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8_\u10ee\u10e3\u10d7\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8_\u10de\u10d0\u10e0\u10d0\u10e1\u10d9\u10d4\u10d5\u10d8_\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8".split("_"),
          "accusative": "\u10d9\u10d5\u10d8\u10e0\u10d0\u10e1_\u10dd\u10e0\u10e8\u10d0\u10d1\u10d0\u10d7\u10e1_\u10e1\u10d0\u10db\u10e8\u10d0\u10d1\u10d0\u10d7\u10e1_\u10dd\u10d7\u10ee\u10e8\u10d0\u10d1\u10d0\u10d7\u10e1_\u10ee\u10e3\u10d7\u10e8\u10d0\u10d1\u10d0\u10d7\u10e1_\u10de\u10d0\u10e0\u10d0\u10e1\u10d9\u10d4\u10d5\u10e1_\u10e8\u10d0\u10d1\u10d0\u10d7\u10e1".split("_")
        },
        nounCase = /(\u10ec\u10d8\u10dc\u10d0|\u10e8\u10d4\u10db\u10d3\u10d4\u10d2)/.test(format) ? "accusative" : "nominative";
      return weekdays[nounCase][m.day()]
    }
    return moment.defineLocale("ka", {
      months: monthsCaseReplace,
      monthsShort: "\u10d8\u10d0\u10dc_\u10d7\u10d4\u10d1_\u10db\u10d0\u10e0_\u10d0\u10de\u10e0_\u10db\u10d0\u10d8_\u10d8\u10d5\u10dc_\u10d8\u10d5\u10da_\u10d0\u10d2\u10d5_\u10e1\u10d4\u10e5_\u10dd\u10e5\u10e2_\u10dc\u10dd\u10d4_\u10d3\u10d4\u10d9".split("_"),
      weekdays: weekdaysCaseReplace,
      weekdaysShort: "\u10d9\u10d5\u10d8_\u10dd\u10e0\u10e8_\u10e1\u10d0\u10db_\u10dd\u10d7\u10ee_\u10ee\u10e3\u10d7_\u10de\u10d0\u10e0_\u10e8\u10d0\u10d1".split("_"),
      weekdaysMin: "\u10d9\u10d5_\u10dd\u10e0_\u10e1\u10d0_\u10dd\u10d7_\u10ee\u10e3_\u10de\u10d0_\u10e8\u10d0".split("_"),
      longDateFormat: {
        LT: "h:mm A",
        LTS: "h:mm:ss A",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u10d3\u10e6\u10d4\u10e1] LT[-\u10d6\u10d4]",
        nextDay: "[\u10ee\u10d5\u10d0\u10da] LT[-\u10d6\u10d4]",
        lastDay: "[\u10d2\u10e3\u10e8\u10d8\u10dc] LT[-\u10d6\u10d4]",
        nextWeek: "[\u10e8\u10d4\u10db\u10d3\u10d4\u10d2] dddd LT[-\u10d6\u10d4]",
        lastWeek: "[\u10ec\u10d8\u10dc\u10d0] dddd LT-\u10d6\u10d4",
        sameElse: "L"
      },
      relativeTime: {
        future: function(s) {
          return /(\u10ec\u10d0\u10db\u10d8|\u10ec\u10e3\u10d7\u10d8|\u10e1\u10d0\u10d0\u10d7\u10d8|\u10ec\u10d4\u10da\u10d8)/.test(s) ?
            s.replace(/\u10d8$/, "\u10e8\u10d8") : s + "\u10e8\u10d8"
        },
        past: function(s) {
          if (/(\u10ec\u10d0\u10db\u10d8|\u10ec\u10e3\u10d7\u10d8|\u10e1\u10d0\u10d0\u10d7\u10d8|\u10d3\u10e6\u10d4|\u10d7\u10d5\u10d4)/.test(s)) return s.replace(/(\u10d8|\u10d4)$/, "\u10d8\u10e1 \u10ec\u10d8\u10dc");
          if (/\u10ec\u10d4\u10da\u10d8/.test(s)) return s.replace(/\u10ec\u10d4\u10da\u10d8$/, "\u10ec\u10da\u10d8\u10e1 \u10ec\u10d8\u10dc")
        },
        s: "\u10e0\u10d0\u10db\u10d3\u10d4\u10dc\u10d8\u10db\u10d4 \u10ec\u10d0\u10db\u10d8",
        m: "\u10ec\u10e3\u10d7\u10d8",
        mm: "%d \u10ec\u10e3\u10d7\u10d8",
        h: "\u10e1\u10d0\u10d0\u10d7\u10d8",
        hh: "%d \u10e1\u10d0\u10d0\u10d7\u10d8",
        d: "\u10d3\u10e6\u10d4",
        dd: "%d \u10d3\u10e6\u10d4",
        M: "\u10d7\u10d5\u10d4",
        MM: "%d \u10d7\u10d5\u10d4",
        y: "\u10ec\u10d4\u10da\u10d8",
        yy: "%d \u10ec\u10d4\u10da\u10d8"
      },
      ordinalParse: /0|1-\u10da\u10d8|\u10db\u10d4-\d{1,2}|\d{1,2}-\u10d4/,
      ordinal: function(number) {
        if (number === 0) return number;
        if (number === 1) return number + "-\u10da\u10d8";
        if (number < 20 || number <= 100 && number % 20 === 0 || number % 100 === 0) return "\u10db\u10d4-" +
          number;
        return number + "-\u10d4"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("km", {
      months: "\u1798\u1780\u179a\u17b6_\u1780\u17bb\u1798\u17d2\u1797\u17c8_\u1798\u17b7\u1793\u17b6_\u1798\u17c1\u179f\u17b6_\u17a7\u179f\u1797\u17b6_\u1798\u17b7\u1790\u17bb\u1793\u17b6_\u1780\u1780\u17d2\u1780\u178a\u17b6_\u179f\u17b8\u17a0\u17b6_\u1780\u1789\u17d2\u1789\u17b6_\u178f\u17bb\u179b\u17b6_\u179c\u17b7\u1785\u17d2\u1786\u17b7\u1780\u17b6_\u1792\u17d2\u1793\u17bc".split("_"),
      monthsShort: "\u1798\u1780\u179a\u17b6_\u1780\u17bb\u1798\u17d2\u1797\u17c8_\u1798\u17b7\u1793\u17b6_\u1798\u17c1\u179f\u17b6_\u17a7\u179f\u1797\u17b6_\u1798\u17b7\u1790\u17bb\u1793\u17b6_\u1780\u1780\u17d2\u1780\u178a\u17b6_\u179f\u17b8\u17a0\u17b6_\u1780\u1789\u17d2\u1789\u17b6_\u178f\u17bb\u179b\u17b6_\u179c\u17b7\u1785\u17d2\u1786\u17b7\u1780\u17b6_\u1792\u17d2\u1793\u17bc".split("_"),
      weekdays: "\u17a2\u17b6\u1791\u17b7\u178f\u17d2\u1799_\u1785\u17d0\u1793\u17d2\u1791_\u17a2\u1784\u17d2\u1782\u17b6\u179a_\u1796\u17bb\u1792_\u1796\u17d2\u179a\u17a0\u179f\u17d2\u1794\u178f\u17b7\u17cd_\u179f\u17bb\u1780\u17d2\u179a_\u179f\u17c5\u179a\u17cd".split("_"),
      weekdaysShort: "\u17a2\u17b6\u1791\u17b7\u178f\u17d2\u1799_\u1785\u17d0\u1793\u17d2\u1791_\u17a2\u1784\u17d2\u1782\u17b6\u179a_\u1796\u17bb\u1792_\u1796\u17d2\u179a\u17a0\u179f\u17d2\u1794\u178f\u17b7\u17cd_\u179f\u17bb\u1780\u17d2\u179a_\u179f\u17c5\u179a\u17cd".split("_"),
      weekdaysMin: "\u17a2\u17b6\u1791\u17b7\u178f\u17d2\u1799_\u1785\u17d0\u1793\u17d2\u1791_\u17a2\u1784\u17d2\u1782\u17b6\u179a_\u1796\u17bb\u1792_\u1796\u17d2\u179a\u17a0\u179f\u17d2\u1794\u178f\u17b7\u17cd_\u179f\u17bb\u1780\u17d2\u179a_\u179f\u17c5\u179a\u17cd".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u1790\u17d2\u1784\u17c3\u1793\u17c8 \u1798\u17c9\u17c4\u1784] LT",
        nextDay: "[\u179f\u17d2\u17a2\u17c2\u1780 \u1798\u17c9\u17c4\u1784] LT",
        nextWeek: "dddd [\u1798\u17c9\u17c4\u1784] LT",
        lastDay: "[\u1798\u17d2\u179f\u17b7\u179b\u1798\u17b7\u1789 \u1798\u17c9\u17c4\u1784] LT",
        lastWeek: "dddd [\u179f\u1794\u17d2\u178f\u17b6\u17a0\u17cd\u1798\u17bb\u1793] [\u1798\u17c9\u17c4\u1784] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s\u1791\u17c0\u178f",
        past: "%s\u1798\u17bb\u1793",
        s: "\u1794\u17c9\u17bb\u1793\u17d2\u1798\u17b6\u1793\u179c\u17b7\u1793\u17b6\u1791\u17b8",
        m: "\u1798\u17bd\u1799\u1793\u17b6\u1791\u17b8",
        mm: "%d \u1793\u17b6\u1791\u17b8",
        h: "\u1798\u17bd\u1799\u1798\u17c9\u17c4\u1784",
        hh: "%d \u1798\u17c9\u17c4\u1784",
        d: "\u1798\u17bd\u1799\u1790\u17d2\u1784\u17c3",
        dd: "%d \u1790\u17d2\u1784\u17c3",
        M: "\u1798\u17bd\u1799\u1781\u17c2",
        MM: "%d \u1781\u17c2",
        y: "\u1798\u17bd\u1799\u1786\u17d2\u1793\u17b6\u17c6",
        yy: "%d \u1786\u17d2\u1793\u17b6\u17c6"
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ko", {
      months: "1\uc6d4_2\uc6d4_3\uc6d4_4\uc6d4_5\uc6d4_6\uc6d4_7\uc6d4_8\uc6d4_9\uc6d4_10\uc6d4_11\uc6d4_12\uc6d4".split("_"),
      monthsShort: "1\uc6d4_2\uc6d4_3\uc6d4_4\uc6d4_5\uc6d4_6\uc6d4_7\uc6d4_8\uc6d4_9\uc6d4_10\uc6d4_11\uc6d4_12\uc6d4".split("_"),
      weekdays: "\uc77c\uc694\uc77c_\uc6d4\uc694\uc77c_\ud654\uc694\uc77c_\uc218\uc694\uc77c_\ubaa9\uc694\uc77c_\uae08\uc694\uc77c_\ud1a0\uc694\uc77c".split("_"),
      weekdaysShort: "\uc77c_\uc6d4_\ud654_\uc218_\ubaa9_\uae08_\ud1a0".split("_"),
      weekdaysMin: "\uc77c_\uc6d4_\ud654_\uc218_\ubaa9_\uae08_\ud1a0".split("_"),
      longDateFormat: {
        LT: "A h\uc2dc m\ubd84",
        LTS: "A h\uc2dc m\ubd84 s\ucd08",
        L: "YYYY.MM.DD",
        LL: "YYYY\ub144 MMMM D\uc77c",
        LLL: "YYYY\ub144 MMMM D\uc77c LT",
        LLLL: "YYYY\ub144 MMMM D\uc77c dddd LT"
      },
      calendar: {
        sameDay: "\uc624\ub298 LT",
        nextDay: "\ub0b4\uc77c LT",
        nextWeek: "dddd LT",
        lastDay: "\uc5b4\uc81c LT",
        lastWeek: "\uc9c0\ub09c\uc8fc dddd LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \ud6c4",
        past: "%s \uc804",
        s: "\uba87\ucd08",
        ss: "%d\ucd08",
        m: "\uc77c\ubd84",
        mm: "%d\ubd84",
        h: "\ud55c\uc2dc\uac04",
        hh: "%d\uc2dc\uac04",
        d: "\ud558\ub8e8",
        dd: "%d\uc77c",
        M: "\ud55c\ub2ec",
        MM: "%d\ub2ec",
        y: "\uc77c\ub144",
        yy: "%d\ub144"
      },
      ordinalParse: /\d{1,2}\uc77c/,
      ordinal: "%d\uc77c",
      meridiemParse: /\uc624\uc804|\uc624\ud6c4/,
      isPM: function(token) {
        return token === "\uc624\ud6c4"
      },
      meridiem: function(hour, minute, isUpper) {
        return hour < 12 ? "\uc624\uc804" : "\uc624\ud6c4"
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function processRelativeTime(number,
      withoutSuffix, key, isFuture) {
      var format = {
        "m": ["eng Minutt", "enger Minutt"],
        "h": ["eng Stonn", "enger Stonn"],
        "d": ["een Dag", "engem Dag"],
        "M": ["ee Mount", "engem Mount"],
        "y": ["ee Joer", "engem Joer"]
      };
      return withoutSuffix ? format[key][0] : format[key][1]
    }

    function processFutureTime(string) {
      var number = string.substr(0, string.indexOf(" "));
      if (eifelerRegelAppliesToNumber(number)) return "a " + string;
      return "an " + string
    }

    function processPastTime(string) {
      var number = string.substr(0, string.indexOf(" "));
      if (eifelerRegelAppliesToNumber(number)) return "viru " +
        string;
      return "virun " + string
    }

    function eifelerRegelAppliesToNumber(number) {
      number = parseInt(number, 10);
      if (isNaN(number)) return false;
      if (number < 0) return true;
      else if (number < 10) {
        if (4 <= number && number <= 7) return true;
        return false
      } else if (number < 100) {
        var lastDigit = number % 10,
          firstDigit = number / 10;
        if (lastDigit === 0) return eifelerRegelAppliesToNumber(firstDigit);
        return eifelerRegelAppliesToNumber(lastDigit)
      } else if (number < 1E4) {
        while (number >= 10) number = number / 10;
        return eifelerRegelAppliesToNumber(number)
      } else {
        number =
          number / 1E3;
        return eifelerRegelAppliesToNumber(number)
      }
    }
    return moment.defineLocale("lb", {
      months: "Januar_Februar_M\u00e4erz_Abr\u00ebll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
      monthsShort: "Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
      weekdays: "Sonndeg_M\u00e9indeg_D\u00ebnschdeg_M\u00ebttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),
      weekdaysShort: "So._M\u00e9._D\u00eb._M\u00eb._Do._Fr._Sa.".split("_"),
      weekdaysMin: "So_M\u00e9_D\u00eb_M\u00eb_Do_Fr_Sa".split("_"),
      longDateFormat: {
        LT: "H:mm [Auer]",
        LTS: "H:mm:ss [Auer]",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Haut um] LT",
        sameElse: "L",
        nextDay: "[Muer um] LT",
        nextWeek: "dddd [um] LT",
        lastDay: "[G\u00ebschter um] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 2:
            case 4:
              return "[Leschten] dddd [um] LT";
            default:
              return "[Leschte] dddd [um] LT"
          }
        }
      },
      relativeTime: {
        future: processFutureTime,
        past: processPastTime,
        s: "e puer Sekonnen",
        m: processRelativeTime,
        mm: "%d Minutten",
        h: processRelativeTime,
        hh: "%d Stonnen",
        d: processRelativeTime,
        dd: "%d Deeg",
        M: processRelativeTime,
        MM: "%d M\u00e9int",
        y: processRelativeTime,
        yy: "%d Joer"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var units = {
        "m": "minut\u0117_minut\u0117s_minut\u0119",
        "mm": "minut\u0117s_minu\u010di\u0173_minutes",
        "h": "valanda_valandos_valand\u0105",
        "hh": "valandos_valand\u0173_valandas",
        "d": "diena_dienos_dien\u0105",
        "dd": "dienos_dien\u0173_dienas",
        "M": "m\u0117nuo_m\u0117nesio_m\u0117nes\u012f",
        "MM": "m\u0117nesiai_m\u0117nesi\u0173_m\u0117nesius",
        "y": "metai_met\u0173_metus",
        "yy": "metai_met\u0173_metus"
      },
      weekDays = "sekmadienis_pirmadienis_antradienis_tre\u010diadienis_ketvirtadienis_penktadienis_\u0161e\u0161tadienis".split("_");

    function translateSeconds(number, withoutSuffix, key, isFuture) {
      if (withoutSuffix) return "kelios sekund\u0117s";
      else return isFuture ? "keli\u0173 sekund\u017ei\u0173" : "kelias sekundes"
    }

    function translateSingular(number, withoutSuffix,
      key, isFuture) {
      return withoutSuffix ? forms(key)[0] : isFuture ? forms(key)[1] : forms(key)[2]
    }

    function special(number) {
      return number % 10 === 0 || number > 10 && number < 20
    }

    function forms(key) {
      return units[key].split("_")
    }

    function translate(number, withoutSuffix, key, isFuture) {
      var result = number + " ";
      if (number === 1) return result + translateSingular(number, withoutSuffix, key[0], isFuture);
      else if (withoutSuffix) return result + (special(number) ? forms(key)[1] : forms(key)[0]);
      else if (isFuture) return result + forms(key)[1];
      else return result +
        (special(number) ? forms(key)[1] : forms(key)[2])
    }

    function relativeWeekDay(moment, format) {
      var nominative = format.indexOf("dddd HH:mm") === -1,
        weekDay = weekDays[moment.day()];
      return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + "\u012f"
    }
    return moment.defineLocale("lt", {
      months: "sausio_vasario_kovo_baland\u017eio_gegu\u017e\u0117s_bir\u017eelio_liepos_rugpj\u016b\u010dio_rugs\u0117jo_spalio_lapkri\u010dio_gruod\u017eio".split("_"),
      monthsShort: "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),
      weekdays: relativeWeekDay,
      weekdaysShort: "Sek_Pir_Ant_Tre_Ket_Pen_\u0160e\u0161".split("_"),
      weekdaysMin: "S_P_A_T_K_Pn_\u0160".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "YYYY-MM-DD",
        LL: "YYYY [m.] MMMM D [d.]",
        LLL: "YYYY [m.] MMMM D [d.], LT [val.]",
        LLLL: "YYYY [m.] MMMM D [d.], dddd, LT [val.]",
        l: "YYYY-MM-DD",
        ll: "YYYY [m.] MMMM D [d.]",
        lll: "YYYY [m.] MMMM D [d.], LT [val.]",
        llll: "YYYY [m.] MMMM D [d.], ddd, LT [val.]"
      },
      calendar: {
        sameDay: "[\u0160iandien] LT",
        nextDay: "[Rytoj] LT",
        nextWeek: "dddd LT",
        lastDay: "[Vakar] LT",
        lastWeek: "[Pra\u0117jus\u012f] dddd LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "po %s",
        past: "prie\u0161 %s",
        s: translateSeconds,
        m: translateSingular,
        mm: translate,
        h: translateSingular,
        hh: translate,
        d: translateSingular,
        dd: translate,
        M: translateSingular,
        MM: translate,
        y: translateSingular,
        yy: translate
      },
      ordinalParse: /\d{1,2}-oji/,
      ordinal: function(number) {
        return number + "-oji"
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var units = {
      "mm": "min\u016bti_min\u016btes_min\u016bte_min\u016btes",
      "hh": "stundu_stundas_stunda_stundas",
      "dd": "dienu_dienas_diena_dienas",
      "MM": "m\u0113nesi_m\u0113ne\u0161us_m\u0113nesis_m\u0113ne\u0161i",
      "yy": "gadu_gadus_gads_gadi"
    };

    function format(word, number, withoutSuffix) {
      var forms = word.split("_");
      if (withoutSuffix) return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
      else return number % 10 === 1 && number !== 11 ? forms[0] : forms[1]
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
      return number + " " + format(units[key], number, withoutSuffix)
    }
    return moment.defineLocale("lv", {
      months: "janv\u0101ris_febru\u0101ris_marts_apr\u012blis_maijs_j\u016bnijs_j\u016blijs_augusts_septembris_oktobris_novembris_decembris".split("_"),
      monthsShort: "jan_feb_mar_apr_mai_j\u016bn_j\u016bl_aug_sep_okt_nov_dec".split("_"),
      weekdays: "sv\u0113tdiena_pirmdiena_otrdiena_tre\u0161diena_ceturtdiena_piektdiena_sestdiena".split("_"),
      weekdaysShort: "Sv_P_O_T_C_Pk_S".split("_"),
      weekdaysMin: "Sv_P_O_T_C_Pk_S".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "YYYY. [gada] D. MMMM",
        LLL: "YYYY. [gada] D. MMMM, LT",
        LLLL: "YYYY. [gada] D. MMMM, dddd, LT"
      },
      calendar: {
        sameDay: "[\u0160odien pulksten] LT",
        nextDay: "[R\u012bt pulksten] LT",
        nextWeek: "dddd [pulksten] LT",
        lastDay: "[Vakar pulksten] LT",
        lastWeek: "[Pag\u0101ju\u0161\u0101] dddd [pulksten] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s v\u0113l\u0101k",
        past: "%s agr\u0101k",
        s: "da\u017eas sekundes",
        m: "min\u016bti",
        mm: relativeTimeWithPlural,
        h: "stundu",
        hh: relativeTimeWithPlural,
        d: "dienu",
        dd: relativeTimeWithPlural,
        M: "m\u0113nesi",
        MM: relativeTimeWithPlural,
        y: "gadu",
        yy: relativeTimeWithPlural
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("mk", {
      months: "\u0458\u0430\u043d\u0443\u0430\u0440\u0438_\u0444\u0435\u0432\u0440\u0443\u0430\u0440\u0438_\u043c\u0430\u0440\u0442_\u0430\u043f\u0440\u0438\u043b_\u043c\u0430\u0458_\u0458\u0443\u043d\u0438_\u0458\u0443\u043b\u0438_\u0430\u0432\u0433\u0443\u0441\u0442_\u0441\u0435\u043f\u0442\u0435\u043c\u0432\u0440\u0438_\u043e\u043a\u0442\u043e\u043c\u0432\u0440\u0438_\u043d\u043e\u0435\u043c\u0432\u0440\u0438_\u0434\u0435\u043a\u0435\u043c\u0432\u0440\u0438".split("_"),
      monthsShort: "\u0458\u0430\u043d_\u0444\u0435\u0432_\u043c\u0430\u0440_\u0430\u043f\u0440_\u043c\u0430\u0458_\u0458\u0443\u043d_\u0458\u0443\u043b_\u0430\u0432\u0433_\u0441\u0435\u043f_\u043e\u043a\u0442_\u043d\u043e\u0435_\u0434\u0435\u043a".split("_"),
      weekdays: "\u043d\u0435\u0434\u0435\u043b\u0430_\u043f\u043e\u043d\u0435\u0434\u0435\u043b\u043d\u0438\u043a_\u0432\u0442\u043e\u0440\u043d\u0438\u043a_\u0441\u0440\u0435\u0434\u0430_\u0447\u0435\u0442\u0432\u0440\u0442\u043e\u043a_\u043f\u0435\u0442\u043e\u043a_\u0441\u0430\u0431\u043e\u0442\u0430".split("_"),
      weekdaysShort: "\u043d\u0435\u0434_\u043f\u043e\u043d_\u0432\u0442\u043e_\u0441\u0440\u0435_\u0447\u0435\u0442_\u043f\u0435\u0442_\u0441\u0430\u0431".split("_"),
      weekdaysMin: "\u043de_\u043fo_\u0432\u0442_\u0441\u0440_\u0447\u0435_\u043f\u0435_\u0441a".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "D.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u0414\u0435\u043d\u0435\u0441 \u0432\u043e] LT",
        nextDay: "[\u0423\u0442\u0440\u0435 \u0432\u043e] LT",
        nextWeek: "dddd [\u0432\u043e] LT",
        lastDay: "[\u0412\u0447\u0435\u0440\u0430 \u0432\u043e] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
            case 6:
              return "[\u0412\u043e \u0438\u0437\u043c\u0438\u043d\u0430\u0442\u0430\u0442\u0430] dddd [\u0432\u043e] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[\u0412\u043e \u0438\u0437\u043c\u0438\u043d\u0430\u0442\u0438\u043e\u0442] dddd [\u0432\u043e] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u043f\u043e\u0441\u043b\u0435 %s",
        past: "\u043f\u0440\u0435\u0434 %s",
        s: "\u043d\u0435\u043a\u043e\u043b\u043a\u0443 \u0441\u0435\u043a\u0443\u043d\u0434\u0438",
        m: "\u043c\u0438\u043d\u0443\u0442\u0430",
        mm: "%d \u043c\u0438\u043d\u0443\u0442\u0438",
        h: "\u0447\u0430\u0441",
        hh: "%d \u0447\u0430\u0441\u0430",
        d: "\u0434\u0435\u043d",
        dd: "%d \u0434\u0435\u043d\u0430",
        M: "\u043c\u0435\u0441\u0435\u0446",
        MM: "%d \u043c\u0435\u0441\u0435\u0446\u0438",
        y: "\u0433\u043e\u0434\u0438\u043d\u0430",
        yy: "%d \u0433\u043e\u0434\u0438\u043d\u0438"
      },
      ordinalParse: /\d{1,2}-(\u0435\u0432|\u0435\u043d|\u0442\u0438|\u0432\u0438|\u0440\u0438|\u043c\u0438)/,
      ordinal: function(number) {
        var lastDigit = number % 10,
          last2Digits = number % 100;
        if (number === 0) return number + "-\u0435\u0432";
        else if (last2Digits === 0) return number + "-\u0435\u043d";
        else if (last2Digits > 10 && last2Digits < 20) return number + "-\u0442\u0438";
        else if (lastDigit === 1) return number + "-\u0432\u0438";
        else if (lastDigit === 2) return number + "-\u0440\u0438";
        else if (lastDigit === 7 || lastDigit === 8) return number + "-\u043c\u0438";
        else return number + "-\u0442\u0438"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ml", {
      months: "\u0d1c\u0d28\u0d41\u0d35\u0d30\u0d3f_\u0d2b\u0d46\u0d2c\u0d4d\u0d30\u0d41\u0d35\u0d30\u0d3f_\u0d2e\u0d3e\u0d7c\u0d1a\u0d4d\u0d1a\u0d4d_\u0d0f\u0d2a\u0d4d\u0d30\u0d3f\u0d7d_\u0d2e\u0d47\u0d2f\u0d4d_\u0d1c\u0d42\u0d7a_\u0d1c\u0d42\u0d32\u0d48_\u0d13\u0d17\u0d38\u0d4d\u0d31\u0d4d\u0d31\u0d4d_\u0d38\u0d46\u0d2a\u0d4d\u0d31\u0d4d\u0d31\u0d02\u0d2c\u0d7c_\u0d12\u0d15\u0d4d\u0d1f\u0d4b\u0d2c\u0d7c_\u0d28\u0d35\u0d02\u0d2c\u0d7c_\u0d21\u0d3f\u0d38\u0d02\u0d2c\u0d7c".split("_"),
      monthsShort: "\u0d1c\u0d28\u0d41._\u0d2b\u0d46\u0d2c\u0d4d\u0d30\u0d41._\u0d2e\u0d3e\u0d7c._\u0d0f\u0d2a\u0d4d\u0d30\u0d3f._\u0d2e\u0d47\u0d2f\u0d4d_\u0d1c\u0d42\u0d7a_\u0d1c\u0d42\u0d32\u0d48._\u0d13\u0d17._\u0d38\u0d46\u0d2a\u0d4d\u0d31\u0d4d\u0d31._\u0d12\u0d15\u0d4d\u0d1f\u0d4b._\u0d28\u0d35\u0d02._\u0d21\u0d3f\u0d38\u0d02.".split("_"),
      weekdays: "\u0d1e\u0d3e\u0d2f\u0d31\u0d3e\u0d34\u0d4d\u0d1a_\u0d24\u0d3f\u0d19\u0d4d\u0d15\u0d33\u0d3e\u0d34\u0d4d\u0d1a_\u0d1a\u0d4a\u0d35\u0d4d\u0d35\u0d3e\u0d34\u0d4d\u0d1a_\u0d2c\u0d41\u0d27\u0d28\u0d3e\u0d34\u0d4d\u0d1a_\u0d35\u0d4d\u0d2f\u0d3e\u0d34\u0d3e\u0d34\u0d4d\u0d1a_\u0d35\u0d46\u0d33\u0d4d\u0d33\u0d3f\u0d2f\u0d3e\u0d34\u0d4d\u0d1a_\u0d36\u0d28\u0d3f\u0d2f\u0d3e\u0d34\u0d4d\u0d1a".split("_"),
      weekdaysShort: "\u0d1e\u0d3e\u0d2f\u0d7c_\u0d24\u0d3f\u0d19\u0d4d\u0d15\u0d7e_\u0d1a\u0d4a\u0d35\u0d4d\u0d35_\u0d2c\u0d41\u0d27\u0d7b_\u0d35\u0d4d\u0d2f\u0d3e\u0d34\u0d02_\u0d35\u0d46\u0d33\u0d4d\u0d33\u0d3f_\u0d36\u0d28\u0d3f".split("_"),
      weekdaysMin: "\u0d1e\u0d3e_\u0d24\u0d3f_\u0d1a\u0d4a_\u0d2c\u0d41_\u0d35\u0d4d\u0d2f\u0d3e_\u0d35\u0d46_\u0d36".split("_"),
      longDateFormat: {
        LT: "A h:mm -\u0d28\u0d41",
        LTS: "A h:mm:ss -\u0d28\u0d41",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0d07\u0d28\u0d4d\u0d28\u0d4d] LT",
        nextDay: "[\u0d28\u0d3e\u0d33\u0d46] LT",
        nextWeek: "dddd, LT",
        lastDay: "[\u0d07\u0d28\u0d4d\u0d28\u0d32\u0d46] LT",
        lastWeek: "[\u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e\u0d4d",
        past: "%s \u0d2e\u0d41\u0d7b\u0d2a\u0d4d",
        s: "\u0d05\u0d7d\u0d2a \u0d28\u0d3f\u0d2e\u0d3f\u0d37\u0d19\u0d4d\u0d19\u0d7e",
        m: "\u0d12\u0d30\u0d41 \u0d2e\u0d3f\u0d28\u0d3f\u0d31\u0d4d\u0d31\u0d4d",
        mm: "%d \u0d2e\u0d3f\u0d28\u0d3f\u0d31\u0d4d\u0d31\u0d4d",
        h: "\u0d12\u0d30\u0d41 \u0d2e\u0d23\u0d3f\u0d15\u0d4d\u0d15\u0d42\u0d7c",
        hh: "%d \u0d2e\u0d23\u0d3f\u0d15\u0d4d\u0d15\u0d42\u0d7c",
        d: "\u0d12\u0d30\u0d41 \u0d26\u0d3f\u0d35\u0d38\u0d02",
        dd: "%d \u0d26\u0d3f\u0d35\u0d38\u0d02",
        M: "\u0d12\u0d30\u0d41 \u0d2e\u0d3e\u0d38\u0d02",
        MM: "%d \u0d2e\u0d3e\u0d38\u0d02",
        y: "\u0d12\u0d30\u0d41 \u0d35\u0d7c\u0d37\u0d02",
        yy: "%d \u0d35\u0d7c\u0d37\u0d02"
      },
      meridiemParse: /\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f|\u0d30\u0d3e\u0d35\u0d3f\u0d32\u0d46|\u0d09\u0d1a\u0d4d\u0d1a \u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e\u0d4d|\u0d35\u0d48\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d47\u0d30\u0d02|\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f/i,
      isPM: function(input) {
        return /^(\u0d09\u0d1a\u0d4d\u0d1a \u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e\u0d4d|\u0d35\u0d48\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d47\u0d30\u0d02|\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f";
        else if (hour < 12) return "\u0d30\u0d3e\u0d35\u0d3f\u0d32\u0d46";
        else if (hour < 17) return "\u0d09\u0d1a\u0d4d\u0d1a \u0d15\u0d34\u0d3f\u0d1e\u0d4d\u0d1e\u0d4d";
        else if (hour < 20) return "\u0d35\u0d48\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d47\u0d30\u0d02";
        else return "\u0d30\u0d3e\u0d24\u0d4d\u0d30\u0d3f"
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0967",
        2: "\u0968",
        3: "\u0969",
        4: "\u096a",
        5: "\u096b",
        6: "\u096c",
        7: "\u096d",
        8: "\u096e",
        9: "\u096f",
        0: "\u0966"
      },
      numberMap = {
        "\u0967": "1",
        "\u0968": "2",
        "\u0969": "3",
        "\u096a": "4",
        "\u096b": "5",
        "\u096c": "6",
        "\u096d": "7",
        "\u096e": "8",
        "\u096f": "9",
        "\u0966": "0"
      };
    return moment.defineLocale("mr", {
      months: "\u091c\u093e\u0928\u0947\u0935\u093e\u0930\u0940_\u092b\u0947\u092c\u094d\u0930\u0941\u0935\u093e\u0930\u0940_\u092e\u093e\u0930\u094d\u091a_\u090f\u092a\u094d\u0930\u093f\u0932_\u092e\u0947_\u091c\u0942\u0928_\u091c\u0941\u0932\u0948_\u0911\u0917\u0938\u094d\u091f_\u0938\u092a\u094d\u091f\u0947\u0902\u092c\u0930_\u0911\u0915\u094d\u091f\u094b\u092c\u0930_\u0928\u094b\u0935\u094d\u0939\u0947\u0902\u092c\u0930_\u0921\u093f\u0938\u0947\u0902\u092c\u0930".split("_"),
      monthsShort: "\u091c\u093e\u0928\u0947._\u092b\u0947\u092c\u094d\u0930\u0941._\u092e\u093e\u0930\u094d\u091a._\u090f\u092a\u094d\u0930\u093f._\u092e\u0947._\u091c\u0942\u0928._\u091c\u0941\u0932\u0948._\u0911\u0917._\u0938\u092a\u094d\u091f\u0947\u0902._\u0911\u0915\u094d\u091f\u094b._\u0928\u094b\u0935\u094d\u0939\u0947\u0902._\u0921\u093f\u0938\u0947\u0902.".split("_"),
      weekdays: "\u0930\u0935\u093f\u0935\u093e\u0930_\u0938\u094b\u092e\u0935\u093e\u0930_\u092e\u0902\u0917\u0933\u0935\u093e\u0930_\u092c\u0941\u0927\u0935\u093e\u0930_\u0917\u0941\u0930\u0942\u0935\u093e\u0930_\u0936\u0941\u0915\u094d\u0930\u0935\u093e\u0930_\u0936\u0928\u093f\u0935\u093e\u0930".split("_"),
      weekdaysShort: "\u0930\u0935\u093f_\u0938\u094b\u092e_\u092e\u0902\u0917\u0933_\u092c\u0941\u0927_\u0917\u0941\u0930\u0942_\u0936\u0941\u0915\u094d\u0930_\u0936\u0928\u093f".split("_"),
      weekdaysMin: "\u0930_\u0938\u094b_\u092e\u0902_\u092c\u0941_\u0917\u0941_\u0936\u0941_\u0936".split("_"),
      longDateFormat: {
        LT: "A h:mm \u0935\u093e\u091c\u0924\u093e",
        LTS: "A h:mm:ss \u0935\u093e\u091c\u0924\u093e",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0906\u091c] LT",
        nextDay: "[\u0909\u0926\u094d\u092f\u093e] LT",
        nextWeek: "dddd, LT",
        lastDay: "[\u0915\u093e\u0932] LT",
        lastWeek: "[\u092e\u093e\u0917\u0940\u0932] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u0928\u0902\u0924\u0930",
        past: "%s \u092a\u0942\u0930\u094d\u0935\u0940",
        s: "\u0938\u0947\u0915\u0902\u0926",
        m: "\u090f\u0915 \u092e\u093f\u0928\u093f\u091f",
        mm: "%d \u092e\u093f\u0928\u093f\u091f\u0947",
        h: "\u090f\u0915 \u0924\u093e\u0938",
        hh: "%d \u0924\u093e\u0938",
        d: "\u090f\u0915 \u0926\u093f\u0935\u0938",
        dd: "%d \u0926\u093f\u0935\u0938",
        M: "\u090f\u0915 \u092e\u0939\u093f\u0928\u093e",
        MM: "%d \u092e\u0939\u093f\u0928\u0947",
        y: "\u090f\u0915 \u0935\u0930\u094d\u0937",
        yy: "%d \u0935\u0930\u094d\u0937\u0947"
      },
      preparse: function(string) {
        return string.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        })
      },
      meridiemParse: /\u0930\u093e\u0924\u094d\u0930\u0940|\u0938\u0915\u093e\u0933\u0940|\u0926\u0941\u092a\u093e\u0930\u0940|\u0938\u093e\u092f\u0902\u0915\u093e\u0933\u0940/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "\u0930\u093e\u0924\u094d\u0930\u0940") return hour < 4 ? hour : hour + 12;
        else if (meridiem === "\u0938\u0915\u093e\u0933\u0940") return hour;
        else if (meridiem === "\u0926\u0941\u092a\u093e\u0930\u0940") return hour >= 10 ? hour : hour + 12;
        else if (meridiem === "\u0938\u093e\u092f\u0902\u0915\u093e\u0933\u0940") return hour + 12
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u0930\u093e\u0924\u094d\u0930\u0940";
        else if (hour < 10) return "\u0938\u0915\u093e\u0933\u0940";
        else if (hour < 17) return "\u0926\u0941\u092a\u093e\u0930\u0940";
        else if (hour < 20) return "\u0938\u093e\u092f\u0902\u0915\u093e\u0933\u0940";
        else return "\u0930\u093e\u0924\u094d\u0930\u0940"
      },
      week: {
        dow: 0,
        doy: 6
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ms-my", {
      months: "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
      monthsShort: "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
      weekdays: "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
      weekdaysShort: "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
      weekdaysMin: "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
      longDateFormat: {
        LT: "HH.mm",
        LTS: "LT.ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY [pukul] LT",
        LLLL: "dddd, D MMMM YYYY [pukul] LT"
      },
      meridiemParse: /pagi|tengahari|petang|malam/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "pagi") return hour;
        else if (meridiem === "tengahari") return hour >= 11 ? hour : hour + 12;
        else if (meridiem === "petang" || meridiem === "malam") return hour + 12
      },
      meridiem: function(hours,
        minutes, isLower) {
        if (hours < 11) return "pagi";
        else if (hours < 15) return "tengahari";
        else if (hours < 19) return "petang";
        else return "malam"
      },
      calendar: {
        sameDay: "[Hari ini pukul] LT",
        nextDay: "[Esok pukul] LT",
        nextWeek: "dddd [pukul] LT",
        lastDay: "[Kelmarin pukul] LT",
        lastWeek: "dddd [lepas pukul] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "dalam %s",
        past: "%s yang lepas",
        s: "beberapa saat",
        m: "seminit",
        mm: "%d minit",
        h: "sejam",
        hh: "%d jam",
        d: "sehari",
        dd: "%d hari",
        M: "sebulan",
        MM: "%d bulan",
        y: "setahun",
        yy: "%d tahun"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u1041",
        2: "\u1042",
        3: "\u1043",
        4: "\u1044",
        5: "\u1045",
        6: "\u1046",
        7: "\u1047",
        8: "\u1048",
        9: "\u1049",
        0: "\u1040"
      },
      numberMap = {
        "\u1041": "1",
        "\u1042": "2",
        "\u1043": "3",
        "\u1044": "4",
        "\u1045": "5",
        "\u1046": "6",
        "\u1047": "7",
        "\u1048": "8",
        "\u1049": "9",
        "\u1040": "0"
      };
    return moment.defineLocale("my", {
      months: "\u1007\u1014\u103a\u1014\u101d\u102b\u101b\u102e_\u1016\u1031\u1016\u1031\u102c\u103a\u101d\u102b\u101b\u102e_\u1019\u1010\u103a_\u1027\u1015\u103c\u102e_\u1019\u1031_\u1007\u103d\u1014\u103a_\u1007\u1030\u101c\u102d\u102f\u1004\u103a_\u101e\u103c\u1002\u102f\u1010\u103a_\u1005\u1000\u103a\u1010\u1004\u103a\u1018\u102c_\u1021\u1031\u102c\u1000\u103a\u1010\u102d\u102f\u1018\u102c_\u1014\u102d\u102f\u101d\u1004\u103a\u1018\u102c_\u1012\u102e\u1007\u1004\u103a\u1018\u102c".split("_"),
      monthsShort: "\u1007\u1014\u103a_\u1016\u1031_\u1019\u1010\u103a_\u1015\u103c\u102e_\u1019\u1031_\u1007\u103d\u1014\u103a_\u101c\u102d\u102f\u1004\u103a_\u101e\u103c_\u1005\u1000\u103a_\u1021\u1031\u102c\u1000\u103a_\u1014\u102d\u102f_\u1012\u102e".split("_"),
      weekdays: "\u1010\u1014\u1004\u103a\u1039\u1002\u1014\u103d\u1031_\u1010\u1014\u1004\u103a\u1039\u101c\u102c_\u1021\u1004\u103a\u1039\u1002\u102b_\u1017\u102f\u1012\u1039\u1013\u101f\u1030\u1038_\u1000\u103c\u102c\u101e\u1015\u1010\u1031\u1038_\u101e\u1031\u102c\u1000\u103c\u102c_\u1005\u1014\u1031".split("_"),
      weekdaysShort: "\u1014\u103d\u1031_\u101c\u102c_\u1004\u103a\u1039\u1002\u102b_\u101f\u1030\u1038_\u1000\u103c\u102c_\u101e\u1031\u102c_\u1014\u1031".split("_"),
      weekdaysMin: "\u1014\u103d\u1031_\u101c\u102c_\u1004\u103a\u1039\u1002\u102b_\u101f\u1030\u1038_\u1000\u103c\u102c_\u101e\u1031\u102c_\u1014\u1031".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u101a\u1014\u1031.] LT [\u1019\u103e\u102c]",
        nextDay: "[\u1019\u1014\u1000\u103a\u1016\u103c\u1014\u103a] LT [\u1019\u103e\u102c]",
        nextWeek: "dddd LT [\u1019\u103e\u102c]",
        lastDay: "[\u1019\u1014\u1031.\u1000] LT [\u1019\u103e\u102c]",
        lastWeek: "[\u1015\u103c\u102e\u1038\u1001\u1032\u1037\u101e\u1031\u102c] dddd LT [\u1019\u103e\u102c]",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u101c\u102c\u1019\u100a\u103a\u1037 %s \u1019\u103e\u102c",
        past: "\u101c\u103d\u1014\u103a\u1001\u1032\u1037\u101e\u1031\u102c %s \u1000",
        s: "\u1005\u1000\u1039\u1000\u1014\u103a.\u1021\u1014\u100a\u103a\u1038\u1004\u101a\u103a",
        m: "\u1010\u1005\u103a\u1019\u102d\u1014\u1005\u103a",
        mm: "%d \u1019\u102d\u1014\u1005\u103a",
        h: "\u1010\u1005\u103a\u1014\u102c\u101b\u102e",
        hh: "%d \u1014\u102c\u101b\u102e",
        d: "\u1010\u1005\u103a\u101b\u1000\u103a",
        dd: "%d \u101b\u1000\u103a",
        M: "\u1010\u1005\u103a\u101c",
        MM: "%d \u101c",
        y: "\u1010\u1005\u103a\u1014\u103e\u1005\u103a",
        yy: "%d \u1014\u103e\u1005\u103a"
      },
      preparse: function(string) {
        return string.replace(/[\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049\u1040]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        })
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("nb", {
      months: "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
      monthsShort: "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
      weekdays: "s\u00f8ndag_mandag_tirsdag_onsdag_torsdag_fredag_l\u00f8rdag".split("_"),
      weekdaysShort: "s\u00f8n_man_tirs_ons_tors_fre_l\u00f8r".split("_"),
      weekdaysMin: "s\u00f8_ma_ti_on_to_fr_l\u00f8".split("_"),
      longDateFormat: {
        LT: "H.mm",
        LTS: "LT.ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY [kl.] LT",
        LLLL: "dddd D. MMMM YYYY [kl.] LT"
      },
      calendar: {
        sameDay: "[i dag kl.] LT",
        nextDay: "[i morgen kl.] LT",
        nextWeek: "dddd [kl.] LT",
        lastDay: "[i g\u00e5r kl.] LT",
        lastWeek: "[forrige] dddd [kl.] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "om %s",
        past: "for %s siden",
        s: "noen sekunder",
        m: "ett minutt",
        mm: "%d minutter",
        h: "en time",
        hh: "%d timer",
        d: "en dag",
        dd: "%d dager",
        M: "en m\u00e5ned",
        MM: "%d m\u00e5neder",
        y: "ett \u00e5r",
        yy: "%d \u00e5r"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var symbolMap = {
        1: "\u0967",
        2: "\u0968",
        3: "\u0969",
        4: "\u096a",
        5: "\u096b",
        6: "\u096c",
        7: "\u096d",
        8: "\u096e",
        9: "\u096f",
        0: "\u0966"
      },
      numberMap = {
        "\u0967": "1",
        "\u0968": "2",
        "\u0969": "3",
        "\u096a": "4",
        "\u096b": "5",
        "\u096c": "6",
        "\u096d": "7",
        "\u096e": "8",
        "\u096f": "9",
        "\u0966": "0"
      };
    return moment.defineLocale("ne", {
      months: "\u091c\u0928\u0935\u0930\u0940_\u092b\u0947\u092c\u094d\u0930\u0941\u0935\u0930\u0940_\u092e\u093e\u0930\u094d\u091a_\u0905\u092a\u094d\u0930\u093f\u0932_\u092e\u0908_\u091c\u0941\u0928_\u091c\u0941\u0932\u093e\u0908_\u0905\u0917\u0937\u094d\u091f_\u0938\u0947\u092a\u094d\u091f\u0947\u092e\u094d\u092c\u0930_\u0905\u0915\u094d\u091f\u094b\u092c\u0930_\u0928\u094b\u092d\u0947\u092e\u094d\u092c\u0930_\u0921\u093f\u0938\u0947\u092e\u094d\u092c\u0930".split("_"),
      monthsShort: "\u091c\u0928._\u092b\u0947\u092c\u094d\u0930\u0941._\u092e\u093e\u0930\u094d\u091a_\u0905\u092a\u094d\u0930\u093f._\u092e\u0908_\u091c\u0941\u0928_\u091c\u0941\u0932\u093e\u0908._\u0905\u0917._\u0938\u0947\u092a\u094d\u091f._\u0905\u0915\u094d\u091f\u094b._\u0928\u094b\u092d\u0947._\u0921\u093f\u0938\u0947.".split("_"),
      weekdays: "\u0906\u0907\u0924\u092c\u093e\u0930_\u0938\u094b\u092e\u092c\u093e\u0930_\u092e\u0919\u094d\u0917\u0932\u092c\u093e\u0930_\u092c\u0941\u0927\u092c\u093e\u0930_\u092c\u093f\u0939\u093f\u092c\u093e\u0930_\u0936\u0941\u0915\u094d\u0930\u092c\u093e\u0930_\u0936\u0928\u093f\u092c\u093e\u0930".split("_"),
      weekdaysShort: "\u0906\u0907\u0924._\u0938\u094b\u092e._\u092e\u0919\u094d\u0917\u0932._\u092c\u0941\u0927._\u092c\u093f\u0939\u093f._\u0936\u0941\u0915\u094d\u0930._\u0936\u0928\u093f.".split("_"),
      weekdaysMin: "\u0906\u0907._\u0938\u094b._\u092e\u0919\u094d_\u092c\u0941._\u092c\u093f._\u0936\u0941._\u0936.".split("_"),
      longDateFormat: {
        LT: "A\u0915\u094b h:mm \u092c\u091c\u0947",
        LTS: "A\u0915\u094b h:mm:ss \u092c\u091c\u0947",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      preparse: function(string) {
        return string.replace(/[\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f\u0966]/g, function(match) {
          return numberMap[match]
        })
      },
      postformat: function(string) {
        return string.replace(/\d/g, function(match) {
          return symbolMap[match]
        })
      },
      meridiemParse: /\u0930\u093e\u0924\u0940|\u092c\u093f\u0939\u093e\u0928|\u0926\u093f\u0909\u0901\u0938\u094b|\u092c\u0947\u0932\u0941\u0915\u093e|\u0938\u093e\u0901\u091d|\u0930\u093e\u0924\u0940/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour =
          0;
        if (meridiem === "\u0930\u093e\u0924\u0940") return hour < 3 ? hour : hour + 12;
        else if (meridiem === "\u092c\u093f\u0939\u093e\u0928") return hour;
        else if (meridiem === "\u0926\u093f\u0909\u0901\u0938\u094b") return hour >= 10 ? hour : hour + 12;
        else if (meridiem === "\u092c\u0947\u0932\u0941\u0915\u093e" || meridiem === "\u0938\u093e\u0901\u091d") return hour + 12
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 3) return "\u0930\u093e\u0924\u0940";
        else if (hour < 10) return "\u092c\u093f\u0939\u093e\u0928";
        else if (hour < 15) return "\u0926\u093f\u0909\u0901\u0938\u094b";
        else if (hour < 18) return "\u092c\u0947\u0932\u0941\u0915\u093e";
        else if (hour < 20) return "\u0938\u093e\u0901\u091d";
        else return "\u0930\u093e\u0924\u0940"
      },
      calendar: {
        sameDay: "[\u0906\u091c] LT",
        nextDay: "[\u092d\u094b\u0932\u0940] LT",
        nextWeek: "[\u0906\u0909\u0901\u0926\u094b] dddd[,] LT",
        lastDay: "[\u0939\u093f\u091c\u094b] LT",
        lastWeek: "[\u0917\u090f\u0915\u094b] dddd[,] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s\u092e\u093e",
        past: "%s \u0905\u0917\u093e\u0921\u0940",
        s: "\u0915\u0947\u0939\u0940 \u0938\u092e\u092f",
        m: "\u090f\u0915 \u092e\u093f\u0928\u0947\u091f",
        mm: "%d \u092e\u093f\u0928\u0947\u091f",
        h: "\u090f\u0915 \u0918\u0923\u094d\u091f\u093e",
        hh: "%d \u0918\u0923\u094d\u091f\u093e",
        d: "\u090f\u0915 \u0926\u093f\u0928",
        dd: "%d \u0926\u093f\u0928",
        M: "\u090f\u0915 \u092e\u0939\u093f\u0928\u093e",
        MM: "%d \u092e\u0939\u093f\u0928\u093e",
        y: "\u090f\u0915 \u092c\u0930\u094d\u0937",
        yy: "%d \u092c\u0930\u094d\u0937"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var monthsShortWithDots =
      "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),
      monthsShortWithoutDots = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_");
    return moment.defineLocale("nl", {
      months: "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
      monthsShort: function(m, format) {
        if (/-MMM-/.test(format)) return monthsShortWithoutDots[m.month()];
        else return monthsShortWithDots[m.month()]
      },
      weekdays: "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
      weekdaysShort: "zo._ma._di._wo._do._vr._za.".split("_"),
      weekdaysMin: "Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD-MM-YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[vandaag om] LT",
        nextDay: "[morgen om] LT",
        nextWeek: "dddd [om] LT",
        lastDay: "[gisteren om] LT",
        lastWeek: "[afgelopen] dddd [om] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "over %s",
        past: "%s geleden",
        s: "een paar seconden",
        m: "\u00e9\u00e9n minuut",
        mm: "%d minuten",
        h: "\u00e9\u00e9n uur",
        hh: "%d uur",
        d: "\u00e9\u00e9n dag",
        dd: "%d dagen",
        M: "\u00e9\u00e9n maand",
        MM: "%d maanden",
        y: "\u00e9\u00e9n jaar",
        yy: "%d jaar"
      },
      ordinalParse: /\d{1,2}(ste|de)/,
      ordinal: function(number) {
        return number + (number === 1 || number === 8 || number >= 20 ? "ste" : "de")
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("nn", {
      months: "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
      monthsShort: "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
      weekdays: "sundag_m\u00e5ndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),
      weekdaysShort: "sun_m\u00e5n_tys_ons_tor_fre_lau".split("_"),
      weekdaysMin: "su_m\u00e5_ty_on_to_fr_l\u00f8".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[I dag klokka] LT",
        nextDay: "[I morgon klokka] LT",
        nextWeek: "dddd [klokka] LT",
        lastDay: "[I g\u00e5r klokka] LT",
        lastWeek: "[F\u00f8reg\u00e5ande] dddd [klokka] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "om %s",
        past: "for %s sidan",
        s: "nokre sekund",
        m: "eit minutt",
        mm: "%d minutt",
        h: "ein time",
        hh: "%d timar",
        d: "ein dag",
        dd: "%d dagar",
        M: "ein m\u00e5nad",
        MM: "%d m\u00e5nader",
        y: "eit \u00e5r",
        yy: "%d \u00e5r"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var monthsNominative = "stycze\u0144_luty_marzec_kwiecie\u0144_maj_czerwiec_lipiec_sierpie\u0144_wrzesie\u0144_pa\u017adziernik_listopad_grudzie\u0144".split("_"),
      monthsSubjective =
      "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrze\u015bnia_pa\u017adziernika_listopada_grudnia".split("_");

    function plural(n) {
      return n % 10 < 5 && n % 10 > 1 && ~~(n / 10) % 10 !== 1
    }

    function translate(number, withoutSuffix, key) {
      var result = number + " ";
      switch (key) {
        case "m":
          return withoutSuffix ? "minuta" : "minut\u0119";
        case "mm":
          return result + (plural(number) ? "minuty" : "minut");
        case "h":
          return withoutSuffix ? "godzina" : "godzin\u0119";
        case "hh":
          return result + (plural(number) ? "godziny" : "godzin");
        case "MM":
          return result +
            (plural(number) ? "miesi\u0105ce" : "miesi\u0119cy");
        case "yy":
          return result + (plural(number) ? "lata" : "lat")
      }
    }
    return moment.defineLocale("pl", {
      months: function(momentToFormat, format) {
        if (/D MMMM/.test(format)) return monthsSubjective[momentToFormat.month()];
        else return monthsNominative[momentToFormat.month()]
      },
      monthsShort: "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_pa\u017a_lis_gru".split("_"),
      weekdays: "niedziela_poniedzia\u0142ek_wtorek_\u015broda_czwartek_pi\u0105tek_sobota".split("_"),
      weekdaysShort: "nie_pon_wt_\u015br_czw_pt_sb".split("_"),
      weekdaysMin: "N_Pn_Wt_\u015ar_Cz_Pt_So".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Dzi\u015b o] LT",
        nextDay: "[Jutro o] LT",
        nextWeek: "[W] dddd [o] LT",
        lastDay: "[Wczoraj o] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
              return "[W zesz\u0142\u0105 niedziel\u0119 o] LT";
            case 3:
              return "[W zesz\u0142\u0105 \u015brod\u0119 o] LT";
            case 6:
              return "[W zesz\u0142\u0105 sobot\u0119 o] LT";
            default:
              return "[W zesz\u0142y] dddd [o] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "%s temu",
        s: "kilka sekund",
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: "1 dzie\u0144",
        dd: "%d dni",
        M: "miesi\u0105c",
        MM: translate,
        y: "rok",
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("pt-br", {
      months: "janeiro_fevereiro_mar\u00e7o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
      monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
      weekdays: "domingo_segunda-feira_ter\u00e7a-feira_quarta-feira_quinta-feira_sexta-feira_s\u00e1bado".split("_"),
      weekdaysShort: "dom_seg_ter_qua_qui_sex_s\u00e1b".split("_"),
      weekdaysMin: "dom_2\u00aa_3\u00aa_4\u00aa_5\u00aa_6\u00aa_s\u00e1b".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D [de] MMMM [de] YYYY",
        LLL: "D [de] MMMM [de] YYYY [\u00e0s] LT",
        LLLL: "dddd, D [de] MMMM [de] YYYY [\u00e0s] LT"
      },
      calendar: {
        sameDay: "[Hoje \u00e0s] LT",
        nextDay: "[Amanh\u00e3 \u00e0s] LT",
        nextWeek: "dddd [\u00e0s] LT",
        lastDay: "[Ontem \u00e0s] LT",
        lastWeek: function() {
          return this.day() === 0 || this.day() === 6 ? "[\u00daltimo] dddd [\u00e0s] LT" : "[\u00daltima] dddd [\u00e0s] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "em %s",
        past: "%s atr\u00e1s",
        s: "segundos",
        m: "um minuto",
        mm: "%d minutos",
        h: "uma hora",
        hh: "%d horas",
        d: "um dia",
        dd: "%d dias",
        M: "um m\u00eas",
        MM: "%d meses",
        y: "um ano",
        yy: "%d anos"
      },
      ordinalParse: /\d{1,2}\u00ba/,
      ordinal: "%d\u00ba"
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("pt", {
      months: "janeiro_fevereiro_mar\u00e7o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
      monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
      weekdays: "domingo_segunda-feira_ter\u00e7a-feira_quarta-feira_quinta-feira_sexta-feira_s\u00e1bado".split("_"),
      weekdaysShort: "dom_seg_ter_qua_qui_sex_s\u00e1b".split("_"),
      weekdaysMin: "dom_2\u00aa_3\u00aa_4\u00aa_5\u00aa_6\u00aa_s\u00e1b".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D [de] MMMM [de] YYYY",
        LLL: "D [de] MMMM [de] YYYY LT",
        LLLL: "dddd, D [de] MMMM [de] YYYY LT"
      },
      calendar: {
        sameDay: "[Hoje \u00e0s] LT",
        nextDay: "[Amanh\u00e3 \u00e0s] LT",
        nextWeek: "dddd [\u00e0s] LT",
        lastDay: "[Ontem \u00e0s] LT",
        lastWeek: function() {
          return this.day() === 0 || this.day() === 6 ? "[\u00daltimo] dddd [\u00e0s] LT" : "[\u00daltima] dddd [\u00e0s] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "em %s",
        past: "h\u00e1 %s",
        s: "segundos",
        m: "um minuto",
        mm: "%d minutos",
        h: "uma hora",
        hh: "%d horas",
        d: "um dia",
        dd: "%d dias",
        M: "um m\u00eas",
        MM: "%d meses",
        y: "um ano",
        yy: "%d anos"
      },
      ordinalParse: /\d{1,2}\u00ba/,
      ordinal: "%d\u00ba",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function relativeTimeWithPlural(number, withoutSuffix, key) {
      var format = {
          "mm": "minute",
          "hh": "ore",
          "dd": "zile",
          "MM": "luni",
          "yy": "ani"
        },
        separator = " ";
      if (number % 100 >= 20 || number >= 100 && number % 100 === 0) separator = " de ";
      return number + separator + format[key]
    }
    return moment.defineLocale("ro", {
      months: "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),
      monthsShort: "ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.".split("_"),
      weekdays: "duminic\u0103_luni_mar\u021bi_miercuri_joi_vineri_s\u00e2mb\u0103t\u0103".split("_"),
      weekdaysShort: "Dum_Lun_Mar_Mie_Joi_Vin_S\u00e2m".split("_"),
      weekdaysMin: "Du_Lu_Ma_Mi_Jo_Vi_S\u00e2".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY H:mm",
        LLLL: "dddd, D MMMM YYYY H:mm"
      },
      calendar: {
        sameDay: "[azi la] LT",
        nextDay: "[m\u00e2ine la] LT",
        nextWeek: "dddd [la] LT",
        lastDay: "[ieri la] LT",
        lastWeek: "[fosta] dddd [la] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "peste %s",
        past: "%s \u00een urm\u0103",
        s: "c\u00e2teva secunde",
        m: "un minut",
        mm: relativeTimeWithPlural,
        h: "o or\u0103",
        hh: relativeTimeWithPlural,
        d: "o zi",
        dd: relativeTimeWithPlural,
        M: "o lun\u0103",
        MM: relativeTimeWithPlural,
        y: "un an",
        yy: relativeTimeWithPlural
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function plural(word, num) {
      var forms = word.split("_");
      return num % 10 === 1 && num % 100 !==
        11 ? forms[0] : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
      var format = {
        "mm": withoutSuffix ? "\u043c\u0438\u043d\u0443\u0442\u0430_\u043c\u0438\u043d\u0443\u0442\u044b_\u043c\u0438\u043d\u0443\u0442" : "\u043c\u0438\u043d\u0443\u0442\u0443_\u043c\u0438\u043d\u0443\u0442\u044b_\u043c\u0438\u043d\u0443\u0442",
        "hh": "\u0447\u0430\u0441_\u0447\u0430\u0441\u0430_\u0447\u0430\u0441\u043e\u0432",
        "dd": "\u0434\u0435\u043d\u044c_\u0434\u043d\u044f_\u0434\u043d\u0435\u0439",
        "MM": "\u043c\u0435\u0441\u044f\u0446_\u043c\u0435\u0441\u044f\u0446\u0430_\u043c\u0435\u0441\u044f\u0446\u0435\u0432",
        "yy": "\u0433\u043e\u0434_\u0433\u043e\u0434\u0430_\u043b\u0435\u0442"
      };
      if (key === "m") return withoutSuffix ? "\u043c\u0438\u043d\u0443\u0442\u0430" : "\u043c\u0438\u043d\u0443\u0442\u0443";
      else return number + " " + plural(format[key], +number)
    }

    function monthsCaseReplace(m, format) {
      var months = {
          "nominative": "\u044f\u043d\u0432\u0430\u0440\u044c_\u0444\u0435\u0432\u0440\u0430\u043b\u044c_\u043c\u0430\u0440\u0442_\u0430\u043f\u0440\u0435\u043b\u044c_\u043c\u0430\u0439_\u0438\u044e\u043d\u044c_\u0438\u044e\u043b\u044c_\u0430\u0432\u0433\u0443\u0441\u0442_\u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044c_\u043e\u043a\u0442\u044f\u0431\u0440\u044c_\u043d\u043e\u044f\u0431\u0440\u044c_\u0434\u0435\u043a\u0430\u0431\u0440\u044c".split("_"),
          "accusative": "\u044f\u043d\u0432\u0430\u0440\u044f_\u0444\u0435\u0432\u0440\u0430\u043b\u044f_\u043c\u0430\u0440\u0442\u0430_\u0430\u043f\u0440\u0435\u043b\u044f_\u043c\u0430\u044f_\u0438\u044e\u043d\u044f_\u0438\u044e\u043b\u044f_\u0430\u0432\u0433\u0443\u0441\u0442\u0430_\u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044f_\u043e\u043a\u0442\u044f\u0431\u0440\u044f_\u043d\u043e\u044f\u0431\u0440\u044f_\u0434\u0435\u043a\u0430\u0431\u0440\u044f".split("_")
        },
        nounCase = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(format) ?
        "accusative" : "nominative";
      return months[nounCase][m.month()]
    }

    function monthsShortCaseReplace(m, format) {
      var monthsShort = {
          "nominative": "\u044f\u043d\u0432_\u0444\u0435\u0432_\u043c\u0430\u0440\u0442_\u0430\u043f\u0440_\u043c\u0430\u0439_\u0438\u044e\u043d\u044c_\u0438\u044e\u043b\u044c_\u0430\u0432\u0433_\u0441\u0435\u043d_\u043e\u043a\u0442_\u043d\u043e\u044f_\u0434\u0435\u043a".split("_"),
          "accusative": "\u044f\u043d\u0432_\u0444\u0435\u0432_\u043c\u0430\u0440_\u0430\u043f\u0440_\u043c\u0430\u044f_\u0438\u044e\u043d\u044f_\u0438\u044e\u043b\u044f_\u0430\u0432\u0433_\u0441\u0435\u043d_\u043e\u043a\u0442_\u043d\u043e\u044f_\u0434\u0435\u043a".split("_")
        },
        nounCase = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(format) ? "accusative" : "nominative";
      return monthsShort[nounCase][m.month()]
    }

    function weekdaysCaseReplace(m, format) {
      var weekdays = {
          "nominative": "\u0432\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435_\u043f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a_\u0432\u0442\u043e\u0440\u043d\u0438\u043a_\u0441\u0440\u0435\u0434\u0430_\u0447\u0435\u0442\u0432\u0435\u0440\u0433_\u043f\u044f\u0442\u043d\u0438\u0446\u0430_\u0441\u0443\u0431\u0431\u043e\u0442\u0430".split("_"),
          "accusative": "\u0432\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435_\u043f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a_\u0432\u0442\u043e\u0440\u043d\u0438\u043a_\u0441\u0440\u0435\u0434\u0443_\u0447\u0435\u0442\u0432\u0435\u0440\u0433_\u043f\u044f\u0442\u043d\u0438\u0446\u0443_\u0441\u0443\u0431\u0431\u043e\u0442\u0443".split("_")
        },
        nounCase = /\[ ?[\u0412\u0432] ?(?:\u043f\u0440\u043e\u0448\u043b\u0443\u044e|\u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e|\u044d\u0442\u0443)? ?\] ?dddd/.test(format) ?
        "accusative" : "nominative";
      return weekdays[nounCase][m.day()]
    }
    return moment.defineLocale("ru", {
      months: monthsCaseReplace,
      monthsShort: monthsShortCaseReplace,
      weekdays: weekdaysCaseReplace,
      weekdaysShort: "\u0432\u0441_\u043f\u043d_\u0432\u0442_\u0441\u0440_\u0447\u0442_\u043f\u0442_\u0441\u0431".split("_"),
      weekdaysMin: "\u0432\u0441_\u043f\u043d_\u0432\u0442_\u0441\u0440_\u0447\u0442_\u043f\u0442_\u0441\u0431".split("_"),
      monthsParse: [/^\u044f\u043d\u0432/i, /^\u0444\u0435\u0432/i, /^\u043c\u0430\u0440/i, /^\u0430\u043f\u0440/i,
        /^\u043c\u0430[\u0439|\u044f]/i, /^\u0438\u044e\u043d/i, /^\u0438\u044e\u043b/i, /^\u0430\u0432\u0433/i, /^\u0441\u0435\u043d/i, /^\u043e\u043a\u0442/i, /^\u043d\u043e\u044f/i, /^\u0434\u0435\u043a/i
      ],
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY \u0433.",
        LLL: "D MMMM YYYY \u0433., LT",
        LLLL: "dddd, D MMMM YYYY \u0433., LT"
      },
      calendar: {
        sameDay: "[\u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0432] LT",
        nextDay: "[\u0417\u0430\u0432\u0442\u0440\u0430 \u0432] LT",
        lastDay: "[\u0412\u0447\u0435\u0440\u0430 \u0432] LT",
        nextWeek: function() {
          return this.day() === 2 ? "[\u0412\u043e] dddd [\u0432] LT" : "[\u0412] dddd [\u0432] LT"
        },
        lastWeek: function(now) {
          if (now.week() !== this.week()) switch (this.day()) {
              case 0:
                return "[\u0412 \u043f\u0440\u043e\u0448\u043b\u043e\u0435] dddd [\u0432] LT";
              case 1:
              case 2:
              case 4:
                return "[\u0412 \u043f\u0440\u043e\u0448\u043b\u044b\u0439] dddd [\u0432] LT";
              case 3:
              case 5:
              case 6:
                return "[\u0412 \u043f\u0440\u043e\u0448\u043b\u0443\u044e] dddd [\u0432] LT"
            } else if (this.day() === 2) return "[\u0412\u043e] dddd [\u0432] LT";
            else return "[\u0412] dddd [\u0432] LT"
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0447\u0435\u0440\u0435\u0437 %s",
        past: "%s \u043d\u0430\u0437\u0430\u0434",
        s: "\u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434",
        m: relativeTimeWithPlural,
        mm: relativeTimeWithPlural,
        h: "\u0447\u0430\u0441",
        hh: relativeTimeWithPlural,
        d: "\u0434\u0435\u043d\u044c",
        dd: relativeTimeWithPlural,
        M: "\u043c\u0435\u0441\u044f\u0446",
        MM: relativeTimeWithPlural,
        y: "\u0433\u043e\u0434",
        yy: relativeTimeWithPlural
      },
      meridiemParse: /\u043d\u043e\u0447\u0438|\u0443\u0442\u0440\u0430|\u0434\u043d\u044f|\u0432\u0435\u0447\u0435\u0440\u0430/i,
      isPM: function(input) {
        return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u0435\u0440\u0430)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u043d\u043e\u0447\u0438";
        else if (hour < 12) return "\u0443\u0442\u0440\u0430";
        else if (hour < 17) return "\u0434\u043d\u044f";
        else return "\u0432\u0435\u0447\u0435\u0440\u0430"
      },
      ordinalParse: /\d{1,2}-(\u0439|\u0433\u043e|\u044f)/,
      ordinal: function(number, period) {
        switch (period) {
          case "M":
          case "d":
          case "DDD":
            return number + "-\u0439";
          case "D":
            return number + "-\u0433\u043e";
          case "w":
          case "W":
            return number + "-\u044f";
          default:
            return number
        }
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var months = "janu\u00e1r_febru\u00e1r_marec_apr\u00edl_m\u00e1j_j\u00fan_j\u00fal_august_september_okt\u00f3ber_november_december".split("_"),
      monthsShort = "jan_feb_mar_apr_m\u00e1j_j\u00fan_j\u00fal_aug_sep_okt_nov_dec".split("_");

    function plural(n) {
      return n > 1 && n < 5
    }

    function translate(number, withoutSuffix, key, isFuture) {
      var result = number + " ";
      switch (key) {
        case "s":
          return withoutSuffix || isFuture ? "p\u00e1r sek\u00fand" : "p\u00e1r sekundami";
        case "m":
          return withoutSuffix ? "min\u00fata" : isFuture ? "min\u00fatu" : "min\u00fatou";
        case "mm":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "min\u00faty" : "min\u00fat");
          else return result + "min\u00fatami";
          break;
        case "h":
          return withoutSuffix ? "hodina" : isFuture ? "hodinu" : "hodinou";
        case "hh":
          if (withoutSuffix ||
            isFuture) return result + (plural(number) ? "hodiny" : "hod\u00edn");
          else return result + "hodinami";
          break;
        case "d":
          return withoutSuffix || isFuture ? "de\u0148" : "d\u0148om";
        case "dd":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "dni" : "dn\u00ed");
          else return result + "d\u0148ami";
          break;
        case "M":
          return withoutSuffix || isFuture ? "mesiac" : "mesiacom";
        case "MM":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "mesiace" : "mesiacov");
          else return result + "mesiacmi";
          break;
        case "y":
          return withoutSuffix || isFuture ?
            "rok" : "rokom";
        case "yy":
          if (withoutSuffix || isFuture) return result + (plural(number) ? "roky" : "rokov");
          else return result + "rokmi";
          break
      }
    }
    return moment.defineLocale("sk", {
      months: months,
      monthsShort: monthsShort,
      monthsParse: function(months, monthsShort) {
        var i, _monthsParse = [];
        for (i = 0; i < 12; i++) _monthsParse[i] = new RegExp("^" + months[i] + "$|^" + monthsShort[i] + "$", "i");
        return _monthsParse
      }(months, monthsShort),
      weekdays: "nede\u013ea_pondelok_utorok_streda_\u0161tvrtok_piatok_sobota".split("_"),
      weekdaysShort: "ne_po_ut_st_\u0161t_pi_so".split("_"),
      weekdaysMin: "ne_po_ut_st_\u0161t_pi_so".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[dnes o] LT",
        nextDay: "[zajtra o] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[v nede\u013eu o] LT";
            case 1:
            case 2:
              return "[v] dddd [o] LT";
            case 3:
              return "[v stredu o] LT";
            case 4:
              return "[vo \u0161tvrtok o] LT";
            case 5:
              return "[v piatok o] LT";
            case 6:
              return "[v sobotu o] LT"
          }
        },
        lastDay: "[v\u010dera o] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
              return "[minul\u00fa nede\u013eu o] LT";
            case 1:
            case 2:
              return "[minul\u00fd] dddd [o] LT";
            case 3:
              return "[minul\u00fa stredu o] LT";
            case 4:
            case 5:
              return "[minul\u00fd] dddd [o] LT";
            case 6:
              return "[minul\u00fa sobotu o] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "pred %s",
        s: translate,
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: translate,
        dd: translate,
        M: translate,
        MM: translate,
        y: translate,
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function translate(number, withoutSuffix, key) {
      var result = number + " ";
      switch (key) {
        case "m":
          return withoutSuffix ? "ena minuta" : "eno minuto";
        case "mm":
          if (number === 1) result += "minuta";
          else if (number === 2) result += "minuti";
          else if (number === 3 || number === 4) result += "minute";
          else result += "minut";
          return result;
        case "h":
          return withoutSuffix ? "ena ura" : "eno uro";
        case "hh":
          if (number === 1) result += "ura";
          else if (number === 2) result += "uri";
          else if (number === 3 ||
            number === 4) result += "ure";
          else result += "ur";
          return result;
        case "dd":
          if (number === 1) result += "dan";
          else result += "dni";
          return result;
        case "MM":
          if (number === 1) result += "mesec";
          else if (number === 2) result += "meseca";
          else if (number === 3 || number === 4) result += "mesece";
          else result += "mesecev";
          return result;
        case "yy":
          if (number === 1) result += "leto";
          else if (number === 2) result += "leti";
          else if (number === 3 || number === 4) result += "leta";
          else result += "let";
          return result
      }
    }
    return moment.defineLocale("sl", {
      months: "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),
      monthsShort: "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
      weekdays: "nedelja_ponedeljek_torek_sreda_\u010detrtek_petek_sobota".split("_"),
      weekdaysShort: "ned._pon._tor._sre._\u010det._pet._sob.".split("_"),
      weekdaysMin: "ne_po_to_sr_\u010de_pe_so".split("_"),
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD. MM. YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[danes ob] LT",
        nextDay: "[jutri ob] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[v] [nedeljo] [ob] LT";
            case 3:
              return "[v] [sredo] [ob] LT";
            case 6:
              return "[v] [soboto] [ob] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[v] dddd [ob] LT"
          }
        },
        lastDay: "[v\u010deraj ob] LT",
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
            case 6:
              return "[prej\u0161nja] dddd [ob] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[prej\u0161nji] dddd [ob] LT"
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u010dez %s",
        past: "%s nazaj",
        s: "nekaj sekund",
        m: translate,
        mm: translate,
        h: translate,
        hh: translate,
        d: "en dan",
        dd: translate,
        M: "en mesec",
        MM: translate,
        y: "eno leto",
        yy: translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("sq", {
      months: "Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_N\u00ebntor_Dhjetor".split("_"),
      monthsShort: "Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_N\u00ebn_Dhj".split("_"),
      weekdays: "E Diel_E H\u00ebn\u00eb_E Mart\u00eb_E M\u00ebrkur\u00eb_E Enjte_E Premte_E Shtun\u00eb".split("_"),
      weekdaysShort: "Die_H\u00ebn_Mar_M\u00ebr_Enj_Pre_Sht".split("_"),
      weekdaysMin: "D_H_Ma_M\u00eb_E_P_Sh".split("_"),
      meridiemParse: /PD|MD/,
      isPM: function(input) {
        return input.charAt(0) === "M"
      },
      meridiem: function(hours, minutes, isLower) {
        return hours < 12 ? "PD" : "MD"
      },
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Sot n\u00eb] LT",
        nextDay: "[Nes\u00ebr n\u00eb] LT",
        nextWeek: "dddd [n\u00eb] LT",
        lastDay: "[Dje n\u00eb] LT",
        lastWeek: "dddd [e kaluar n\u00eb] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "n\u00eb %s",
        past: "%s m\u00eb par\u00eb",
        s: "disa sekonda",
        m: "nj\u00eb minut\u00eb",
        mm: "%d minuta",
        h: "nj\u00eb or\u00eb",
        hh: "%d or\u00eb",
        d: "nj\u00eb dit\u00eb",
        dd: "%d dit\u00eb",
        M: "nj\u00eb muaj",
        MM: "%d muaj",
        y: "nj\u00eb vit",
        yy: "%d vite"
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var translator = {
      words: {
        m: ["\u0458\u0435\u0434\u0430\u043d \u043c\u0438\u043d\u0443\u0442", "\u0458\u0435\u0434\u043d\u0435 \u043c\u0438\u043d\u0443\u0442\u0435"],
        mm: ["\u043c\u0438\u043d\u0443\u0442", "\u043c\u0438\u043d\u0443\u0442\u0435", "\u043c\u0438\u043d\u0443\u0442\u0430"],
        h: ["\u0458\u0435\u0434\u0430\u043d \u0441\u0430\u0442", "\u0458\u0435\u0434\u043d\u043e\u0433 \u0441\u0430\u0442\u0430"],
        hh: ["\u0441\u0430\u0442", "\u0441\u0430\u0442\u0430", "\u0441\u0430\u0442\u0438"],
        dd: ["\u0434\u0430\u043d", "\u0434\u0430\u043d\u0430", "\u0434\u0430\u043d\u0430"],
        MM: ["\u043c\u0435\u0441\u0435\u0446", "\u043c\u0435\u0441\u0435\u0446\u0430", "\u043c\u0435\u0441\u0435\u0446\u0438"],
        yy: ["\u0433\u043e\u0434\u0438\u043d\u0430", "\u0433\u043e\u0434\u0438\u043d\u0435", "\u0433\u043e\u0434\u0438\u043d\u0430"]
      },
      correctGrammaticalCase: function(number, wordKey) {
        return number === 1 ? wordKey[0] : number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]
      },
      translate: function(number, withoutSuffix, key) {
        var wordKey = translator.words[key];
        if (key.length === 1) return withoutSuffix ? wordKey[0] : wordKey[1];
        else return number + " " + translator.correctGrammaticalCase(number, wordKey)
      }
    };
    return moment.defineLocale("sr-cyrl", {
      months: ["\u0458\u0430\u043d\u0443\u0430\u0440",
        "\u0444\u0435\u0431\u0440\u0443\u0430\u0440", "\u043c\u0430\u0440\u0442", "\u0430\u043f\u0440\u0438\u043b", "\u043c\u0430\u0458", "\u0458\u0443\u043d", "\u0458\u0443\u043b", "\u0430\u0432\u0433\u0443\u0441\u0442", "\u0441\u0435\u043f\u0442\u0435\u043c\u0431\u0430\u0440", "\u043e\u043a\u0442\u043e\u0431\u0430\u0440", "\u043d\u043e\u0432\u0435\u043c\u0431\u0430\u0440", "\u0434\u0435\u0446\u0435\u043c\u0431\u0430\u0440"
      ],
      monthsShort: ["\u0458\u0430\u043d.", "\u0444\u0435\u0431.", "\u043c\u0430\u0440.", "\u0430\u043f\u0440.",
        "\u043c\u0430\u0458", "\u0458\u0443\u043d", "\u0458\u0443\u043b", "\u0430\u0432\u0433.", "\u0441\u0435\u043f.", "\u043e\u043a\u0442.", "\u043d\u043e\u0432.", "\u0434\u0435\u0446."
      ],
      weekdays: ["\u043d\u0435\u0434\u0435\u0459\u0430", "\u043f\u043e\u043d\u0435\u0434\u0435\u0459\u0430\u043a", "\u0443\u0442\u043e\u0440\u0430\u043a", "\u0441\u0440\u0435\u0434\u0430", "\u0447\u0435\u0442\u0432\u0440\u0442\u0430\u043a", "\u043f\u0435\u0442\u0430\u043a", "\u0441\u0443\u0431\u043e\u0442\u0430"],
      weekdaysShort: ["\u043d\u0435\u0434.",
        "\u043f\u043e\u043d.", "\u0443\u0442\u043e.", "\u0441\u0440\u0435.", "\u0447\u0435\u0442.", "\u043f\u0435\u0442.", "\u0441\u0443\u0431."
      ],
      weekdaysMin: ["\u043d\u0435", "\u043f\u043e", "\u0443\u0442", "\u0441\u0440", "\u0447\u0435", "\u043f\u0435", "\u0441\u0443"],
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD. MM. YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u0434\u0430\u043d\u0430\u0441 \u0443] LT",
        nextDay: "[\u0441\u0443\u0442\u0440\u0430 \u0443] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[\u0443] [\u043d\u0435\u0434\u0435\u0459\u0443] [\u0443] LT";
            case 3:
              return "[\u0443] [\u0441\u0440\u0435\u0434\u0443] [\u0443] LT";
            case 6:
              return "[\u0443] [\u0441\u0443\u0431\u043e\u0442\u0443] [\u0443] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[\u0443] dddd [\u0443] LT"
          }
        },
        lastDay: "[\u0458\u0443\u0447\u0435 \u0443] LT",
        lastWeek: function() {
          var lastWeekDays = ["[\u043f\u0440\u043e\u0448\u043b\u0435] [\u043d\u0435\u0434\u0435\u0459\u0435] [\u0443] LT", "[\u043f\u0440\u043e\u0448\u043b\u043e\u0433] [\u043f\u043e\u043d\u0435\u0434\u0435\u0459\u043a\u0430] [\u0443] LT",
            "[\u043f\u0440\u043e\u0448\u043b\u043e\u0433] [\u0443\u0442\u043e\u0440\u043a\u0430] [\u0443] LT", "[\u043f\u0440\u043e\u0448\u043b\u0435] [\u0441\u0440\u0435\u0434\u0435] [\u0443] LT", "[\u043f\u0440\u043e\u0448\u043b\u043e\u0433] [\u0447\u0435\u0442\u0432\u0440\u0442\u043a\u0430] [\u0443] LT", "[\u043f\u0440\u043e\u0448\u043b\u043e\u0433] [\u043f\u0435\u0442\u043a\u0430] [\u0443] LT", "[\u043f\u0440\u043e\u0448\u043b\u0435] [\u0441\u0443\u0431\u043e\u0442\u0435] [\u0443] LT"
          ];
          return lastWeekDays[this.day()]
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0437\u0430 %s",
        past: "\u043f\u0440\u0435 %s",
        s: "\u043d\u0435\u043a\u043e\u043b\u0438\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434\u0438",
        m: translator.translate,
        mm: translator.translate,
        h: translator.translate,
        hh: translator.translate,
        d: "\u0434\u0430\u043d",
        dd: translator.translate,
        M: "\u043c\u0435\u0441\u0435\u0446",
        MM: translator.translate,
        y: "\u0433\u043e\u0434\u0438\u043d\u0443",
        yy: translator.translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var translator = {
      words: {
        m: ["jedan minut", "jedne minute"],
        mm: ["minut", "minute", "minuta"],
        h: ["jedan sat", "jednog sata"],
        hh: ["sat", "sata", "sati"],
        dd: ["dan", "dana", "dana"],
        MM: ["mesec", "meseca", "meseci"],
        yy: ["godina", "godine", "godina"]
      },
      correctGrammaticalCase: function(number, wordKey) {
        return number === 1 ? wordKey[0] : number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]
      },
      translate: function(number, withoutSuffix, key) {
        var wordKey = translator.words[key];
        if (key.length ===
          1) return withoutSuffix ? wordKey[0] : wordKey[1];
        else return number + " " + translator.correctGrammaticalCase(number, wordKey)
      }
    };
    return moment.defineLocale("sr", {
      months: ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"],
      monthsShort: ["jan.", "feb.", "mar.", "apr.", "maj", "jun", "jul", "avg.", "sep.", "okt.", "nov.", "dec."],
      weekdays: ["nedelja", "ponedeljak", "utorak", "sreda", "\u010detvrtak", "petak", "subota"],
      weekdaysShort: ["ned.", "pon.", "uto.", "sre.", "\u010det.",
        "pet.", "sub."
      ],
      weekdaysMin: ["ne", "po", "ut", "sr", "\u010de", "pe", "su"],
      longDateFormat: {
        LT: "H:mm",
        LTS: "LT:ss",
        L: "DD. MM. YYYY",
        LL: "D. MMMM YYYY",
        LLL: "D. MMMM YYYY LT",
        LLLL: "dddd, D. MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[danas u] LT",
        nextDay: "[sutra u] LT",
        nextWeek: function() {
          switch (this.day()) {
            case 0:
              return "[u] [nedelju] [u] LT";
            case 3:
              return "[u] [sredu] [u] LT";
            case 6:
              return "[u] [subotu] [u] LT";
            case 1:
            case 2:
            case 4:
            case 5:
              return "[u] dddd [u] LT"
          }
        },
        lastDay: "[ju\u010de u] LT",
        lastWeek: function() {
          var lastWeekDays = ["[pro\u0161le] [nedelje] [u] LT", "[pro\u0161log] [ponedeljka] [u] LT", "[pro\u0161log] [utorka] [u] LT", "[pro\u0161le] [srede] [u] LT", "[pro\u0161log] [\u010detvrtka] [u] LT", "[pro\u0161log] [petka] [u] LT", "[pro\u0161le] [subote] [u] LT"];
          return lastWeekDays[this.day()]
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "za %s",
        past: "pre %s",
        s: "nekoliko sekundi",
        m: translator.translate,
        mm: translator.translate,
        h: translator.translate,
        hh: translator.translate,
        d: "dan",
        dd: translator.translate,
        M: "mesec",
        MM: translator.translate,
        y: "godinu",
        yy: translator.translate
      },
      ordinalParse: /\d{1,2}\./,
      ordinal: "%d.",
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("sv", {
      months: "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),
      monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
      weekdays: "s\u00f6ndag_m\u00e5ndag_tisdag_onsdag_torsdag_fredag_l\u00f6rdag".split("_"),
      weekdaysShort: "s\u00f6n_m\u00e5n_tis_ons_tor_fre_l\u00f6r".split("_"),
      weekdaysMin: "s\u00f6_m\u00e5_ti_on_to_fr_l\u00f6".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "YYYY-MM-DD",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[Idag] LT",
        nextDay: "[Imorgon] LT",
        lastDay: "[Ig\u00e5r] LT",
        nextWeek: "dddd LT",
        lastWeek: "[F\u00f6rra] dddd[en] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "om %s",
        past: "f\u00f6r %s sedan",
        s: "n\u00e5gra sekunder",
        m: "en minut",
        mm: "%d minuter",
        h: "en timme",
        hh: "%d timmar",
        d: "en dag",
        dd: "%d dagar",
        M: "en m\u00e5nad",
        MM: "%d m\u00e5nader",
        y: "ett \u00e5r",
        yy: "%d \u00e5r"
      },
      ordinalParse: /\d{1,2}(e|a)/,
      ordinal: function(number) {
        var b = number % 10,
          output = ~~(number % 100 / 10) === 1 ? "e" : b === 1 ? "a" : b === 2 ? "a" : b === 3 ? "e" : "e";
        return number + output
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("ta", {
      months: "\u0b9c\u0ba9\u0bb5\u0bb0\u0bbf_\u0baa\u0bbf\u0baa\u0bcd\u0bb0\u0bb5\u0bb0\u0bbf_\u0bae\u0bbe\u0bb0\u0bcd\u0b9a\u0bcd_\u0b8f\u0baa\u0bcd\u0bb0\u0bb2\u0bcd_\u0bae\u0bc7_\u0b9c\u0bc2\u0ba9\u0bcd_\u0b9c\u0bc2\u0bb2\u0bc8_\u0b86\u0b95\u0bb8\u0bcd\u0b9f\u0bcd_\u0b9a\u0bc6\u0baa\u0bcd\u0b9f\u0bc6\u0bae\u0bcd\u0baa\u0bb0\u0bcd_\u0b85\u0b95\u0bcd\u0b9f\u0bc7\u0bbe\u0baa\u0bb0\u0bcd_\u0ba8\u0bb5\u0bae\u0bcd\u0baa\u0bb0\u0bcd_\u0b9f\u0bbf\u0b9a\u0bae\u0bcd\u0baa\u0bb0\u0bcd".split("_"),
      monthsShort: "\u0b9c\u0ba9\u0bb5\u0bb0\u0bbf_\u0baa\u0bbf\u0baa\u0bcd\u0bb0\u0bb5\u0bb0\u0bbf_\u0bae\u0bbe\u0bb0\u0bcd\u0b9a\u0bcd_\u0b8f\u0baa\u0bcd\u0bb0\u0bb2\u0bcd_\u0bae\u0bc7_\u0b9c\u0bc2\u0ba9\u0bcd_\u0b9c\u0bc2\u0bb2\u0bc8_\u0b86\u0b95\u0bb8\u0bcd\u0b9f\u0bcd_\u0b9a\u0bc6\u0baa\u0bcd\u0b9f\u0bc6\u0bae\u0bcd\u0baa\u0bb0\u0bcd_\u0b85\u0b95\u0bcd\u0b9f\u0bc7\u0bbe\u0baa\u0bb0\u0bcd_\u0ba8\u0bb5\u0bae\u0bcd\u0baa\u0bb0\u0bcd_\u0b9f\u0bbf\u0b9a\u0bae\u0bcd\u0baa\u0bb0\u0bcd".split("_"),
      weekdays: "\u0b9e\u0bbe\u0baf\u0bbf\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0ba4\u0bbf\u0b99\u0bcd\u0b95\u0b9f\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0b9a\u0bc6\u0bb5\u0bcd\u0bb5\u0bbe\u0baf\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0baa\u0bc1\u0ba4\u0ba9\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0bb5\u0bbf\u0baf\u0bbe\u0bb4\u0b95\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0bb5\u0bc6\u0bb3\u0bcd\u0bb3\u0bbf\u0b95\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8_\u0b9a\u0ba9\u0bbf\u0b95\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8".split("_"),
      weekdaysShort: "\u0b9e\u0bbe\u0baf\u0bbf\u0bb1\u0bc1_\u0ba4\u0bbf\u0b99\u0bcd\u0b95\u0bb3\u0bcd_\u0b9a\u0bc6\u0bb5\u0bcd\u0bb5\u0bbe\u0baf\u0bcd_\u0baa\u0bc1\u0ba4\u0ba9\u0bcd_\u0bb5\u0bbf\u0baf\u0bbe\u0bb4\u0ba9\u0bcd_\u0bb5\u0bc6\u0bb3\u0bcd\u0bb3\u0bbf_\u0b9a\u0ba9\u0bbf".split("_"),
      weekdaysMin: "\u0b9e\u0bbe_\u0ba4\u0bbf_\u0b9a\u0bc6_\u0baa\u0bc1_\u0bb5\u0bbf_\u0bb5\u0bc6_\u0b9a".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY, LT",
        LLLL: "dddd, D MMMM YYYY, LT"
      },
      calendar: {
        sameDay: "[\u0b87\u0ba9\u0bcd\u0bb1\u0bc1] LT",
        nextDay: "[\u0ba8\u0bbe\u0bb3\u0bc8] LT",
        nextWeek: "dddd, LT",
        lastDay: "[\u0ba8\u0bc7\u0bb1\u0bcd\u0bb1\u0bc1] LT",
        lastWeek: "[\u0b95\u0b9f\u0ba8\u0bcd\u0ba4 \u0bb5\u0bbe\u0bb0\u0bae\u0bcd] dddd, LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s \u0b87\u0bb2\u0bcd",
        past: "%s \u0bae\u0bc1\u0ba9\u0bcd",
        s: "\u0b92\u0bb0\u0bc1 \u0b9a\u0bbf\u0bb2 \u0bb5\u0bbf\u0ba8\u0bbe\u0b9f\u0bbf\u0b95\u0bb3\u0bcd",
        m: "\u0b92\u0bb0\u0bc1 \u0ba8\u0bbf\u0bae\u0bbf\u0b9f\u0bae\u0bcd",
        mm: "%d \u0ba8\u0bbf\u0bae\u0bbf\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
        h: "\u0b92\u0bb0\u0bc1 \u0bae\u0ba3\u0bbf \u0ba8\u0bc7\u0bb0\u0bae\u0bcd",
        hh: "%d \u0bae\u0ba3\u0bbf \u0ba8\u0bc7\u0bb0\u0bae\u0bcd",
        d: "\u0b92\u0bb0\u0bc1 \u0ba8\u0bbe\u0bb3\u0bcd",
        dd: "%d \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd",
        M: "\u0b92\u0bb0\u0bc1 \u0bae\u0bbe\u0ba4\u0bae\u0bcd",
        MM: "%d \u0bae\u0bbe\u0ba4\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
        y: "\u0b92\u0bb0\u0bc1 \u0bb5\u0bb0\u0bc1\u0b9f\u0bae\u0bcd",
        yy: "%d \u0b86\u0ba3\u0bcd\u0b9f\u0bc1\u0b95\u0bb3\u0bcd"
      },
      ordinalParse: /\d{1,2}\u0bb5\u0ba4\u0bc1/,
      ordinal: function(number) {
        return number + "\u0bb5\u0ba4\u0bc1"
      },
      meridiemParse: /\u0baf\u0bbe\u0bae\u0bae\u0bcd|\u0bb5\u0bc8\u0b95\u0bb1\u0bc8|\u0b95\u0bbe\u0bb2\u0bc8|\u0ba8\u0ba3\u0bcd\u0baa\u0b95\u0bb2\u0bcd|\u0b8e\u0bb1\u0bcd\u0baa\u0bbe\u0b9f\u0bc1|\u0bae\u0bbe\u0bb2\u0bc8/,
      meridiem: function(hour, minute, isLower) {
        if (hour < 2) return " \u0baf\u0bbe\u0bae\u0bae\u0bcd";
        else if (hour < 6) return " \u0bb5\u0bc8\u0b95\u0bb1\u0bc8";
        else if (hour < 10) return " \u0b95\u0bbe\u0bb2\u0bc8";
        else if (hour < 14) return " \u0ba8\u0ba3\u0bcd\u0baa\u0b95\u0bb2\u0bcd";
        else if (hour < 18) return " \u0b8e\u0bb1\u0bcd\u0baa\u0bbe\u0b9f\u0bc1";
        else if (hour < 22) return " \u0bae\u0bbe\u0bb2\u0bc8";
        else return " \u0baf\u0bbe\u0bae\u0bae\u0bcd"
      },
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "\u0baf\u0bbe\u0bae\u0bae\u0bcd") return hour < 2 ? hour : hour + 12;
        else if (meridiem === "\u0bb5\u0bc8\u0b95\u0bb1\u0bc8" || meridiem === "\u0b95\u0bbe\u0bb2\u0bc8") return hour;
        else if (meridiem === "\u0ba8\u0ba3\u0bcd\u0baa\u0b95\u0bb2\u0bcd") return hour >=
          10 ? hour : hour + 12;
        else return hour + 12
      },
      week: {
        dow: 0,
        doy: 6
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("th", {
      months: "\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21_\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c_\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21_\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19_\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21_\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19_\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21_\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21_\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19_\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21_\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19_\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21".split("_"),
      monthsShort: "\u0e21\u0e01\u0e23\u0e32_\u0e01\u0e38\u0e21\u0e20\u0e32_\u0e21\u0e35\u0e19\u0e32_\u0e40\u0e21\u0e29\u0e32_\u0e1e\u0e24\u0e29\u0e20\u0e32_\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32_\u0e01\u0e23\u0e01\u0e0e\u0e32_\u0e2a\u0e34\u0e07\u0e2b\u0e32_\u0e01\u0e31\u0e19\u0e22\u0e32_\u0e15\u0e38\u0e25\u0e32_\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32_\u0e18\u0e31\u0e19\u0e27\u0e32".split("_"),
      weekdays: "\u0e2d\u0e32\u0e17\u0e34\u0e15\u0e22\u0e4c_\u0e08\u0e31\u0e19\u0e17\u0e23\u0e4c_\u0e2d\u0e31\u0e07\u0e04\u0e32\u0e23_\u0e1e\u0e38\u0e18_\u0e1e\u0e24\u0e2b\u0e31\u0e2a\u0e1a\u0e14\u0e35_\u0e28\u0e38\u0e01\u0e23\u0e4c_\u0e40\u0e2a\u0e32\u0e23\u0e4c".split("_"),
      weekdaysShort: "\u0e2d\u0e32\u0e17\u0e34\u0e15\u0e22\u0e4c_\u0e08\u0e31\u0e19\u0e17\u0e23\u0e4c_\u0e2d\u0e31\u0e07\u0e04\u0e32\u0e23_\u0e1e\u0e38\u0e18_\u0e1e\u0e24\u0e2b\u0e31\u0e2a_\u0e28\u0e38\u0e01\u0e23\u0e4c_\u0e40\u0e2a\u0e32\u0e23\u0e4c".split("_"),
      weekdaysMin: "\u0e2d\u0e32._\u0e08._\u0e2d._\u0e1e._\u0e1e\u0e24._\u0e28._\u0e2a.".split("_"),
      longDateFormat: {
        LT: "H \u0e19\u0e32\u0e2c\u0e34\u0e01\u0e32 m \u0e19\u0e32\u0e17\u0e35",
        LTS: "LT s \u0e27\u0e34\u0e19\u0e32\u0e17\u0e35",
        L: "YYYY/MM/DD",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY \u0e40\u0e27\u0e25\u0e32 LT",
        LLLL: "\u0e27\u0e31\u0e19dddd\u0e17\u0e35\u0e48 D MMMM YYYY \u0e40\u0e27\u0e25\u0e32 LT"
      },
      meridiemParse: /\u0e01\u0e48\u0e2d\u0e19\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07|\u0e2b\u0e25\u0e31\u0e07\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07/,
      isPM: function(input) {
        return input === "\u0e2b\u0e25\u0e31\u0e07\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07"
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 12) return "\u0e01\u0e48\u0e2d\u0e19\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07";
        else return "\u0e2b\u0e25\u0e31\u0e07\u0e40\u0e17\u0e35\u0e48\u0e22\u0e07"
      },
      calendar: {
        sameDay: "[\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49 \u0e40\u0e27\u0e25\u0e32] LT",
        nextDay: "[\u0e1e\u0e23\u0e38\u0e48\u0e07\u0e19\u0e35\u0e49 \u0e40\u0e27\u0e25\u0e32] LT",
        nextWeek: "dddd[\u0e2b\u0e19\u0e49\u0e32 \u0e40\u0e27\u0e25\u0e32] LT",
        lastDay: "[\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e27\u0e32\u0e19\u0e19\u0e35\u0e49 \u0e40\u0e27\u0e25\u0e32] LT",
        lastWeek: "[\u0e27\u0e31\u0e19]dddd[\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27 \u0e40\u0e27\u0e25\u0e32] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0e2d\u0e35\u0e01 %s",
        past: "%s\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27",
        s: "\u0e44\u0e21\u0e48\u0e01\u0e35\u0e48\u0e27\u0e34\u0e19\u0e32\u0e17\u0e35",
        m: "1 \u0e19\u0e32\u0e17\u0e35",
        mm: "%d \u0e19\u0e32\u0e17\u0e35",
        h: "1 \u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07",
        hh: "%d \u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07",
        d: "1 \u0e27\u0e31\u0e19",
        dd: "%d \u0e27\u0e31\u0e19",
        M: "1 \u0e40\u0e14\u0e37\u0e2d\u0e19",
        MM: "%d \u0e40\u0e14\u0e37\u0e2d\u0e19",
        y: "1 \u0e1b\u0e35",
        yy: "%d \u0e1b\u0e35"
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("tl-ph", {
      months: "Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),
      monthsShort: "Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),
      weekdays: "Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),
      weekdaysShort: "Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),
      weekdaysMin: "Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "MM/D/YYYY",
        LL: "MMMM D, YYYY",
        LLL: "MMMM D, YYYY LT",
        LLLL: "dddd, MMMM DD, YYYY LT"
      },
      calendar: {
        sameDay: "[Ngayon sa] LT",
        nextDay: "[Bukas sa] LT",
        nextWeek: "dddd [sa] LT",
        lastDay: "[Kahapon sa] LT",
        lastWeek: "dddd [huling linggo] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "sa loob ng %s",
        past: "%s ang nakalipas",
        s: "ilang segundo",
        m: "isang minuto",
        mm: "%d minuto",
        h: "isang oras",
        hh: "%d oras",
        d: "isang araw",
        dd: "%d araw",
        M: "isang buwan",
        MM: "%d buwan",
        y: "isang taon",
        yy: "%d taon"
      },
      ordinalParse: /\d{1,2}/,
      ordinal: function(number) {
        return number
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    var suffixes = {
      1: "'inci",
      5: "'inci",
      8: "'inci",
      70: "'inci",
      80: "'inci",
      2: "'nci",
      7: "'nci",
      20: "'nci",
      50: "'nci",
      3: "'\u00fcnc\u00fc",
      4: "'\u00fcnc\u00fc",
      100: "'\u00fcnc\u00fc",
      6: "'nc\u0131",
      9: "'uncu",
      10: "'uncu",
      30: "'uncu",
      60: "'\u0131nc\u0131",
      90: "'\u0131nc\u0131"
    };
    return moment.defineLocale("tr", {
      months: "Ocak_\u015eubat_Mart_Nisan_May\u0131s_Haziran_Temmuz_A\u011fustos_Eyl\u00fcl_Ekim_Kas\u0131m_Aral\u0131k".split("_"),
      monthsShort: "Oca_\u015eub_Mar_Nis_May_Haz_Tem_A\u011fu_Eyl_Eki_Kas_Ara".split("_"),
      weekdays: "Pazar_Pazartesi_Sal\u0131_\u00c7ar\u015famba_Per\u015fembe_Cuma_Cumartesi".split("_"),
      weekdaysShort: "Paz_Pts_Sal_\u00c7ar_Per_Cum_Cts".split("_"),
      weekdaysMin: "Pz_Pt_Sa_\u00c7a_Pe_Cu_Ct".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd, D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[bug\u00fcn saat] LT",
        nextDay: "[yar\u0131n saat] LT",
        nextWeek: "[haftaya] dddd [saat] LT",
        lastDay: "[d\u00fcn] LT",
        lastWeek: "[ge\u00e7en hafta] dddd [saat] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s sonra",
        past: "%s \u00f6nce",
        s: "birka\u00e7 saniye",
        m: "bir dakika",
        mm: "%d dakika",
        h: "bir saat",
        hh: "%d saat",
        d: "bir g\u00fcn",
        dd: "%d g\u00fcn",
        M: "bir ay",
        MM: "%d ay",
        y: "bir y\u0131l",
        yy: "%d y\u0131l"
      },
      ordinalParse: /\d{1,2}'(inci|nci|\u00fcnc\u00fc|nc\u0131|uncu|\u0131nc\u0131)/,
      ordinal: function(number) {
        if (number === 0) return number + "'\u0131nc\u0131";
        var a = number % 10,
          b = number % 100 - a,
          c = number >= 100 ? 100 : null;
        return number + (suffixes[a] || suffixes[b] || suffixes[c])
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("tzm-latn", {
      months: "innayr_br\u02e4ayr\u02e4_mar\u02e4s\u02e4_ibrir_mayyw_ywnyw_ywlywz_\u0263w\u0161t_\u0161wtanbir_kt\u02e4wbr\u02e4_nwwanbir_dwjnbir".split("_"),
      monthsShort: "innayr_br\u02e4ayr\u02e4_mar\u02e4s\u02e4_ibrir_mayyw_ywnyw_ywlywz_\u0263w\u0161t_\u0161wtanbir_kt\u02e4wbr\u02e4_nwwanbir_dwjnbir".split("_"),
      weekdays: "asamas_aynas_asinas_akras_akwas_asimwas_asi\u1e0dyas".split("_"),
      weekdaysShort: "asamas_aynas_asinas_akras_akwas_asimwas_asi\u1e0dyas".split("_"),
      weekdaysMin: "asamas_aynas_asinas_akras_akwas_asimwas_asi\u1e0dyas".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[asdkh g] LT",
        nextDay: "[aska g] LT",
        nextWeek: "dddd [g] LT",
        lastDay: "[assant g] LT",
        lastWeek: "dddd [g] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "dadkh s yan %s",
        past: "yan %s",
        s: "imik",
        m: "minu\u1e0d",
        mm: "%d minu\u1e0d",
        h: "sa\u025ba",
        hh: "%d tassa\u025bin",
        d: "ass",
        dd: "%d ossan",
        M: "ayowr",
        MM: "%d iyyirn",
        y: "asgas",
        yy: "%d isgasn"
      },
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("tzm", {
      months: "\u2d49\u2d4f\u2d4f\u2d30\u2d62\u2d54_\u2d31\u2d55\u2d30\u2d62\u2d55_\u2d4e\u2d30\u2d55\u2d5a_\u2d49\u2d31\u2d54\u2d49\u2d54_\u2d4e\u2d30\u2d62\u2d62\u2d53_\u2d62\u2d53\u2d4f\u2d62\u2d53_\u2d62\u2d53\u2d4d\u2d62\u2d53\u2d63_\u2d56\u2d53\u2d5b\u2d5c_\u2d5b\u2d53\u2d5c\u2d30\u2d4f\u2d31\u2d49\u2d54_\u2d3d\u2d5f\u2d53\u2d31\u2d55_\u2d4f\u2d53\u2d61\u2d30\u2d4f\u2d31\u2d49\u2d54_\u2d37\u2d53\u2d4a\u2d4f\u2d31\u2d49\u2d54".split("_"),
      monthsShort: "\u2d49\u2d4f\u2d4f\u2d30\u2d62\u2d54_\u2d31\u2d55\u2d30\u2d62\u2d55_\u2d4e\u2d30\u2d55\u2d5a_\u2d49\u2d31\u2d54\u2d49\u2d54_\u2d4e\u2d30\u2d62\u2d62\u2d53_\u2d62\u2d53\u2d4f\u2d62\u2d53_\u2d62\u2d53\u2d4d\u2d62\u2d53\u2d63_\u2d56\u2d53\u2d5b\u2d5c_\u2d5b\u2d53\u2d5c\u2d30\u2d4f\u2d31\u2d49\u2d54_\u2d3d\u2d5f\u2d53\u2d31\u2d55_\u2d4f\u2d53\u2d61\u2d30\u2d4f\u2d31\u2d49\u2d54_\u2d37\u2d53\u2d4a\u2d4f\u2d31\u2d49\u2d54".split("_"),
      weekdays: "\u2d30\u2d59\u2d30\u2d4e\u2d30\u2d59_\u2d30\u2d62\u2d4f\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4f\u2d30\u2d59_\u2d30\u2d3d\u2d54\u2d30\u2d59_\u2d30\u2d3d\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4e\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d39\u2d62\u2d30\u2d59".split("_"),
      weekdaysShort: "\u2d30\u2d59\u2d30\u2d4e\u2d30\u2d59_\u2d30\u2d62\u2d4f\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4f\u2d30\u2d59_\u2d30\u2d3d\u2d54\u2d30\u2d59_\u2d30\u2d3d\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4e\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d39\u2d62\u2d30\u2d59".split("_"),
      weekdaysMin: "\u2d30\u2d59\u2d30\u2d4e\u2d30\u2d59_\u2d30\u2d62\u2d4f\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4f\u2d30\u2d59_\u2d30\u2d3d\u2d54\u2d30\u2d59_\u2d30\u2d3d\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d4e\u2d61\u2d30\u2d59_\u2d30\u2d59\u2d49\u2d39\u2d62\u2d30\u2d59".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "dddd D MMMM YYYY LT"
      },
      calendar: {
        sameDay: "[\u2d30\u2d59\u2d37\u2d45 \u2d34] LT",
        nextDay: "[\u2d30\u2d59\u2d3d\u2d30 \u2d34] LT",
        nextWeek: "dddd [\u2d34] LT",
        lastDay: "[\u2d30\u2d5a\u2d30\u2d4f\u2d5c \u2d34] LT",
        lastWeek: "dddd [\u2d34] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u2d37\u2d30\u2d37\u2d45 \u2d59 \u2d62\u2d30\u2d4f %s",
        past: "\u2d62\u2d30\u2d4f %s",
        s: "\u2d49\u2d4e\u2d49\u2d3d",
        m: "\u2d4e\u2d49\u2d4f\u2d53\u2d3a",
        mm: "%d \u2d4e\u2d49\u2d4f\u2d53\u2d3a",
        h: "\u2d59\u2d30\u2d44\u2d30",
        hh: "%d \u2d5c\u2d30\u2d59\u2d59\u2d30\u2d44\u2d49\u2d4f",
        d: "\u2d30\u2d59\u2d59",
        dd: "%d o\u2d59\u2d59\u2d30\u2d4f",
        M: "\u2d30\u2d62o\u2d53\u2d54",
        MM: "%d \u2d49\u2d62\u2d62\u2d49\u2d54\u2d4f",
        y: "\u2d30\u2d59\u2d33\u2d30\u2d59",
        yy: "%d \u2d49\u2d59\u2d33\u2d30\u2d59\u2d4f"
      },
      week: {
        dow: 6,
        doy: 12
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    function plural(word, num) {
      var forms = word.split("_");
      return num % 10 === 1 && num % 100 !== 11 ? forms[0] : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
      var format = {
        "mm": "\u0445\u0432\u0438\u043b\u0438\u043d\u0430_\u0445\u0432\u0438\u043b\u0438\u043d\u0438_\u0445\u0432\u0438\u043b\u0438\u043d",
        "hh": "\u0433\u043e\u0434\u0438\u043d\u0430_\u0433\u043e\u0434\u0438\u043d\u0438_\u0433\u043e\u0434\u0438\u043d",
        "dd": "\u0434\u0435\u043d\u044c_\u0434\u043d\u0456_\u0434\u043d\u0456\u0432",
        "MM": "\u043c\u0456\u0441\u044f\u0446\u044c_\u043c\u0456\u0441\u044f\u0446\u0456_\u043c\u0456\u0441\u044f\u0446\u0456\u0432",
        "yy": "\u0440\u0456\u043a_\u0440\u043e\u043a\u0438_\u0440\u043e\u043a\u0456\u0432"
      };
      if (key === "m") return withoutSuffix ? "\u0445\u0432\u0438\u043b\u0438\u043d\u0430" : "\u0445\u0432\u0438\u043b\u0438\u043d\u0443";
      else if (key === "h") return withoutSuffix ? "\u0433\u043e\u0434\u0438\u043d\u0430" : "\u0433\u043e\u0434\u0438\u043d\u0443";
      else return number + " " + plural(format[key], +number)
    }

    function monthsCaseReplace(m, format) {
      var months = {
          "nominative": "\u0441\u0456\u0447\u0435\u043d\u044c_\u043b\u044e\u0442\u0438\u0439_\u0431\u0435\u0440\u0435\u0437\u0435\u043d\u044c_\u043a\u0432\u0456\u0442\u0435\u043d\u044c_\u0442\u0440\u0430\u0432\u0435\u043d\u044c_\u0447\u0435\u0440\u0432\u0435\u043d\u044c_\u043b\u0438\u043f\u0435\u043d\u044c_\u0441\u0435\u0440\u043f\u0435\u043d\u044c_\u0432\u0435\u0440\u0435\u0441\u0435\u043d\u044c_\u0436\u043e\u0432\u0442\u0435\u043d\u044c_\u043b\u0438\u0441\u0442\u043e\u043f\u0430\u0434_\u0433\u0440\u0443\u0434\u0435\u043d\u044c".split("_"),
          "accusative": "\u0441\u0456\u0447\u043d\u044f_\u043b\u044e\u0442\u043e\u0433\u043e_\u0431\u0435\u0440\u0435\u0437\u043d\u044f_\u043a\u0432\u0456\u0442\u043d\u044f_\u0442\u0440\u0430\u0432\u043d\u044f_\u0447\u0435\u0440\u0432\u043d\u044f_\u043b\u0438\u043f\u043d\u044f_\u0441\u0435\u0440\u043f\u043d\u044f_\u0432\u0435\u0440\u0435\u0441\u043d\u044f_\u0436\u043e\u0432\u0442\u043d\u044f_\u043b\u0438\u0441\u0442\u043e\u043f\u0430\u0434\u0430_\u0433\u0440\u0443\u0434\u043d\u044f".split("_")
        },
        nounCase = /D[oD]? *MMMM?/.test(format) ?
        "accusative" : "nominative";
      return months[nounCase][m.month()]
    }

    function weekdaysCaseReplace(m, format) {
      var weekdays = {
          "nominative": "\u043d\u0435\u0434\u0456\u043b\u044f_\u043f\u043e\u043d\u0435\u0434\u0456\u043b\u043e\u043a_\u0432\u0456\u0432\u0442\u043e\u0440\u043e\u043a_\u0441\u0435\u0440\u0435\u0434\u0430_\u0447\u0435\u0442\u0432\u0435\u0440_\u043f\u2019\u044f\u0442\u043d\u0438\u0446\u044f_\u0441\u0443\u0431\u043e\u0442\u0430".split("_"),
          "accusative": "\u043d\u0435\u0434\u0456\u043b\u044e_\u043f\u043e\u043d\u0435\u0434\u0456\u043b\u043e\u043a_\u0432\u0456\u0432\u0442\u043e\u0440\u043e\u043a_\u0441\u0435\u0440\u0435\u0434\u0443_\u0447\u0435\u0442\u0432\u0435\u0440_\u043f\u2019\u044f\u0442\u043d\u0438\u0446\u044e_\u0441\u0443\u0431\u043e\u0442\u0443".split("_"),
          "genitive": "\u043d\u0435\u0434\u0456\u043b\u0456_\u043f\u043e\u043d\u0435\u0434\u0456\u043b\u043a\u0430_\u0432\u0456\u0432\u0442\u043e\u0440\u043a\u0430_\u0441\u0435\u0440\u0435\u0434\u0438_\u0447\u0435\u0442\u0432\u0435\u0440\u0433\u0430_\u043f\u2019\u044f\u0442\u043d\u0438\u0446\u0456_\u0441\u0443\u0431\u043e\u0442\u0438".split("_")
        },
        nounCase = /(\[[\u0412\u0432\u0423\u0443]\]) ?dddd/.test(format) ? "accusative" : /\[?(?:\u043c\u0438\u043d\u0443\u043b\u043e\u0457|\u043d\u0430\u0441\u0442\u0443\u043f\u043d\u043e\u0457)? ?\] ?dddd/.test(format) ?
        "genitive" : "nominative";
      return weekdays[nounCase][m.day()]
    }

    function processHoursFunction(str) {
      return function() {
        return str + "\u043e" + (this.hours() === 11 ? "\u0431" : "") + "] LT"
      }
    }
    return moment.defineLocale("uk", {
      months: monthsCaseReplace,
      monthsShort: "\u0441\u0456\u0447_\u043b\u044e\u0442_\u0431\u0435\u0440_\u043a\u0432\u0456\u0442_\u0442\u0440\u0430\u0432_\u0447\u0435\u0440\u0432_\u043b\u0438\u043f_\u0441\u0435\u0440\u043f_\u0432\u0435\u0440_\u0436\u043e\u0432\u0442_\u043b\u0438\u0441\u0442_\u0433\u0440\u0443\u0434".split("_"),
      weekdays: weekdaysCaseReplace,
      weekdaysShort: "\u043d\u0434_\u043f\u043d_\u0432\u0442_\u0441\u0440_\u0447\u0442_\u043f\u0442_\u0441\u0431".split("_"),
      weekdaysMin: "\u043d\u0434_\u043f\u043d_\u0432\u0442_\u0441\u0440_\u0447\u0442_\u043f\u0442_\u0441\u0431".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD.MM.YYYY",
        LL: "D MMMM YYYY \u0440.",
        LLL: "D MMMM YYYY \u0440., LT",
        LLLL: "dddd, D MMMM YYYY \u0440., LT"
      },
      calendar: {
        sameDay: processHoursFunction("[\u0421\u044c\u043e\u0433\u043e\u0434\u043d\u0456 "),
        nextDay: processHoursFunction("[\u0417\u0430\u0432\u0442\u0440\u0430 "),
        lastDay: processHoursFunction("[\u0412\u0447\u043e\u0440\u0430 "),
        nextWeek: processHoursFunction("[\u0423] dddd ["),
        lastWeek: function() {
          switch (this.day()) {
            case 0:
            case 3:
            case 5:
            case 6:
              return processHoursFunction("[\u041c\u0438\u043d\u0443\u043b\u043e\u0457] dddd [").call(this);
            case 1:
            case 2:
            case 4:
              return processHoursFunction("[\u041c\u0438\u043d\u0443\u043b\u043e\u0433\u043e] dddd [").call(this)
          }
        },
        sameElse: "L"
      },
      relativeTime: {
        future: "\u0437\u0430 %s",
        past: "%s \u0442\u043e\u043c\u0443",
        s: "\u0434\u0435\u043a\u0456\u043b\u044c\u043a\u0430 \u0441\u0435\u043a\u0443\u043d\u0434",
        m: relativeTimeWithPlural,
        mm: relativeTimeWithPlural,
        h: "\u0433\u043e\u0434\u0438\u043d\u0443",
        hh: relativeTimeWithPlural,
        d: "\u0434\u0435\u043d\u044c",
        dd: relativeTimeWithPlural,
        M: "\u043c\u0456\u0441\u044f\u0446\u044c",
        MM: relativeTimeWithPlural,
        y: "\u0440\u0456\u043a",
        yy: relativeTimeWithPlural
      },
      meridiemParse: /\u043d\u043e\u0447\u0456|\u0440\u0430\u043d\u043a\u0443|\u0434\u043d\u044f|\u0432\u0435\u0447\u043e\u0440\u0430/,
      isPM: function(input) {
        return /^(\u0434\u043d\u044f|\u0432\u0435\u0447\u043e\u0440\u0430)$/.test(input)
      },
      meridiem: function(hour, minute, isLower) {
        if (hour < 4) return "\u043d\u043e\u0447\u0456";
        else if (hour < 12) return "\u0440\u0430\u043d\u043a\u0443";
        else if (hour < 17) return "\u0434\u043d\u044f";
        else return "\u0432\u0435\u0447\u043e\u0440\u0430"
      },
      ordinalParse: /\d{1,2}-(\u0439|\u0433\u043e)/,
      ordinal: function(number, period) {
        switch (period) {
          case "M":
          case "d":
          case "DDD":
          case "w":
          case "W":
            return number + "-\u0439";
          case "D":
            return number +
              "-\u0433\u043e";
          default:
            return number
        }
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("uz", {
      months: "\u044f\u043d\u0432\u0430\u0440\u044c_\u0444\u0435\u0432\u0440\u0430\u043b\u044c_\u043c\u0430\u0440\u0442_\u0430\u043f\u0440\u0435\u043b\u044c_\u043c\u0430\u0439_\u0438\u044e\u043d\u044c_\u0438\u044e\u043b\u044c_\u0430\u0432\u0433\u0443\u0441\u0442_\u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044c_\u043e\u043a\u0442\u044f\u0431\u0440\u044c_\u043d\u043e\u044f\u0431\u0440\u044c_\u0434\u0435\u043a\u0430\u0431\u0440\u044c".split("_"),
      monthsShort: "\u044f\u043d\u0432_\u0444\u0435\u0432_\u043c\u0430\u0440_\u0430\u043f\u0440_\u043c\u0430\u0439_\u0438\u044e\u043d_\u0438\u044e\u043b_\u0430\u0432\u0433_\u0441\u0435\u043d_\u043e\u043a\u0442_\u043d\u043e\u044f_\u0434\u0435\u043a".split("_"),
      weekdays: "\u042f\u043a\u0448\u0430\u043d\u0431\u0430_\u0414\u0443\u0448\u0430\u043d\u0431\u0430_\u0421\u0435\u0448\u0430\u043d\u0431\u0430_\u0427\u043e\u0440\u0448\u0430\u043d\u0431\u0430_\u041f\u0430\u0439\u0448\u0430\u043d\u0431\u0430_\u0416\u0443\u043c\u0430_\u0428\u0430\u043d\u0431\u0430".split("_"),
      weekdaysShort: "\u042f\u043a\u0448_\u0414\u0443\u0448_\u0421\u0435\u0448_\u0427\u043e\u0440_\u041f\u0430\u0439_\u0416\u0443\u043c_\u0428\u0430\u043d".split("_"),
      weekdaysMin: "\u042f\u043a_\u0414\u0443_\u0421\u0435_\u0427\u043e_\u041f\u0430_\u0416\u0443_\u0428\u0430".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY LT",
        LLLL: "D MMMM YYYY, dddd LT"
      },
      calendar: {
        sameDay: "[\u0411\u0443\u0433\u0443\u043d \u0441\u043e\u0430\u0442] LT [\u0434\u0430]",
        nextDay: "[\u042d\u0440\u0442\u0430\u0433\u0430] LT [\u0434\u0430]",
        nextWeek: "dddd [\u043a\u0443\u043d\u0438 \u0441\u043e\u0430\u0442] LT [\u0434\u0430]",
        lastDay: "[\u041a\u0435\u0447\u0430 \u0441\u043e\u0430\u0442] LT [\u0434\u0430]",
        lastWeek: "[\u0423\u0442\u0433\u0430\u043d] dddd [\u043a\u0443\u043d\u0438 \u0441\u043e\u0430\u0442] LT [\u0434\u0430]",
        sameElse: "L"
      },
      relativeTime: {
        future: "\u042f\u043a\u0438\u043d %s \u0438\u0447\u0438\u0434\u0430",
        past: "\u0411\u0438\u0440 \u043d\u0435\u0447\u0430 %s \u043e\u043b\u0434\u0438\u043d",
        s: "\u0444\u0443\u0440\u0441\u0430\u0442",
        m: "\u0431\u0438\u0440 \u0434\u0430\u043a\u0438\u043a\u0430",
        mm: "%d \u0434\u0430\u043a\u0438\u043a\u0430",
        h: "\u0431\u0438\u0440 \u0441\u043e\u0430\u0442",
        hh: "%d \u0441\u043e\u0430\u0442",
        d: "\u0431\u0438\u0440 \u043a\u0443\u043d",
        dd: "%d \u043a\u0443\u043d",
        M: "\u0431\u0438\u0440 \u043e\u0439",
        MM: "%d \u043e\u0439",
        y: "\u0431\u0438\u0440 \u0439\u0438\u043b",
        yy: "%d \u0439\u0438\u043b"
      },
      week: {
        dow: 1,
        doy: 7
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("vi", {
      months: "th\u00e1ng 1_th\u00e1ng 2_th\u00e1ng 3_th\u00e1ng 4_th\u00e1ng 5_th\u00e1ng 6_th\u00e1ng 7_th\u00e1ng 8_th\u00e1ng 9_th\u00e1ng 10_th\u00e1ng 11_th\u00e1ng 12".split("_"),
      monthsShort: "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
      weekdays: "ch\u1ee7 nh\u1eadt_th\u1ee9 hai_th\u1ee9 ba_th\u1ee9 t\u01b0_th\u1ee9 n\u0103m_th\u1ee9 s\u00e1u_th\u1ee9 b\u1ea3y".split("_"),
      weekdaysShort: "CN_T2_T3_T4_T5_T6_T7".split("_"),
      weekdaysMin: "CN_T2_T3_T4_T5_T6_T7".split("_"),
      longDateFormat: {
        LT: "HH:mm",
        LTS: "LT:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM [n\u0103m] YYYY",
        LLL: "D MMMM [n\u0103m] YYYY LT",
        LLLL: "dddd, D MMMM [n\u0103m] YYYY LT",
        l: "DD/M/YYYY",
        ll: "D MMM YYYY",
        lll: "D MMM YYYY LT",
        llll: "ddd, D MMM YYYY LT"
      },
      calendar: {
        sameDay: "[H\u00f4m nay l\u00fac] LT",
        nextDay: "[Ng\u00e0y mai l\u00fac] LT",
        nextWeek: "dddd [tu\u1ea7n t\u1edbi l\u00fac] LT",
        lastDay: "[H\u00f4m qua l\u00fac] LT",
        lastWeek: "dddd [tu\u1ea7n r\u1ed3i l\u00fac] LT",
        sameElse: "L"
      },
      relativeTime: {
        future: "%s t\u1edbi",
        past: "%s tr\u01b0\u1edbc",
        s: "v\u00e0i gi\u00e2y",
        m: "m\u1ed9t ph\u00fat",
        mm: "%d ph\u00fat",
        h: "m\u1ed9t gi\u1edd",
        hh: "%d gi\u1edd",
        d: "m\u1ed9t ng\u00e0y",
        dd: "%d ng\u00e0y",
        M: "m\u1ed9t th\u00e1ng",
        MM: "%d th\u00e1ng",
        y: "m\u1ed9t n\u0103m",
        yy: "%d n\u0103m"
      },
      ordinalParse: /\d{1,2}/,
      ordinal: function(number) {
        return number
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("zh-cn", {
      months: "\u4e00\u6708_\u4e8c\u6708_\u4e09\u6708_\u56db\u6708_\u4e94\u6708_\u516d\u6708_\u4e03\u6708_\u516b\u6708_\u4e5d\u6708_\u5341\u6708_\u5341\u4e00\u6708_\u5341\u4e8c\u6708".split("_"),
      monthsShort: "1\u6708_2\u6708_3\u6708_4\u6708_5\u6708_6\u6708_7\u6708_8\u6708_9\u6708_10\u6708_11\u6708_12\u6708".split("_"),
      weekdays: "\u661f\u671f\u65e5_\u661f\u671f\u4e00_\u661f\u671f\u4e8c_\u661f\u671f\u4e09_\u661f\u671f\u56db_\u661f\u671f\u4e94_\u661f\u671f\u516d".split("_"),
      weekdaysShort: "\u5468\u65e5_\u5468\u4e00_\u5468\u4e8c_\u5468\u4e09_\u5468\u56db_\u5468\u4e94_\u5468\u516d".split("_"),
      weekdaysMin: "\u65e5_\u4e00_\u4e8c_\u4e09_\u56db_\u4e94_\u516d".split("_"),
      longDateFormat: {
        LT: "Ah\u70b9mm",
        LTS: "Ah\u70b9m\u5206s\u79d2",
        L: "YYYY-MM-DD",
        LL: "YYYY\u5e74MMMD\u65e5",
        LLL: "YYYY\u5e74MMMD\u65e5LT",
        LLLL: "YYYY\u5e74MMMD\u65e5ddddLT",
        l: "YYYY-MM-DD",
        ll: "YYYY\u5e74MMMD\u65e5",
        lll: "YYYY\u5e74MMMD\u65e5LT",
        llll: "YYYY\u5e74MMMD\u65e5ddddLT"
      },
      meridiemParse: /\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "\u51cc\u6668" || meridiem === "\u65e9\u4e0a" || meridiem === "\u4e0a\u5348") return hour;
        else if (meridiem === "\u4e0b\u5348" || meridiem === "\u665a\u4e0a") return hour + 12;
        else return hour >= 11 ? hour : hour + 12
      },
      meridiem: function(hour, minute, isLower) {
        var hm =
          hour * 100 + minute;
        if (hm < 600) return "\u51cc\u6668";
        else if (hm < 900) return "\u65e9\u4e0a";
        else if (hm < 1130) return "\u4e0a\u5348";
        else if (hm < 1230) return "\u4e2d\u5348";
        else if (hm < 1800) return "\u4e0b\u5348";
        else return "\u665a\u4e0a"
      },
      calendar: {
        sameDay: function() {
          return this.minutes() === 0 ? "[\u4eca\u5929]Ah[\u70b9\u6574]" : "[\u4eca\u5929]LT"
        },
        nextDay: function() {
          return this.minutes() === 0 ? "[\u660e\u5929]Ah[\u70b9\u6574]" : "[\u660e\u5929]LT"
        },
        lastDay: function() {
          return this.minutes() === 0 ? "[\u6628\u5929]Ah[\u70b9\u6574]" :
            "[\u6628\u5929]LT"
        },
        nextWeek: function() {
          var startOfWeek, prefix;
          startOfWeek = moment().startOf("week");
          prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? "[\u4e0b]" : "[\u672c]";
          return this.minutes() === 0 ? prefix + "dddAh\u70b9\u6574" : prefix + "dddAh\u70b9mm"
        },
        lastWeek: function() {
          var startOfWeek, prefix;
          startOfWeek = moment().startOf("week");
          prefix = this.unix() < startOfWeek.unix() ? "[\u4e0a]" : "[\u672c]";
          return this.minutes() === 0 ? prefix + "dddAh\u70b9\u6574" : prefix + "dddAh\u70b9mm"
        },
        sameElse: "LL"
      },
      ordinalParse: /\d{1,2}(\u65e5|\u6708|\u5468)/,
      ordinal: function(number, period) {
        switch (period) {
          case "d":
          case "D":
          case "DDD":
            return number + "\u65e5";
          case "M":
            return number + "\u6708";
          case "w":
          case "W":
            return number + "\u5468";
          default:
            return number
        }
      },
      relativeTime: {
        future: "%s\u5185",
        past: "%s\u524d",
        s: "\u51e0\u79d2",
        m: "1\u5206\u949f",
        mm: "%d\u5206\u949f",
        h: "1\u5c0f\u65f6",
        hh: "%d\u5c0f\u65f6",
        d: "1\u5929",
        dd: "%d\u5929",
        M: "1\u4e2a\u6708",
        MM: "%d\u4e2a\u6708",
        y: "1\u5e74",
        yy: "%d\u5e74"
      },
      week: {
        dow: 1,
        doy: 4
      }
    })
  });
  (function(factory) {
    factory(moment)
  })(function(moment) {
    return moment.defineLocale("zh-tw", {
      months: "\u4e00\u6708_\u4e8c\u6708_\u4e09\u6708_\u56db\u6708_\u4e94\u6708_\u516d\u6708_\u4e03\u6708_\u516b\u6708_\u4e5d\u6708_\u5341\u6708_\u5341\u4e00\u6708_\u5341\u4e8c\u6708".split("_"),
      monthsShort: "1\u6708_2\u6708_3\u6708_4\u6708_5\u6708_6\u6708_7\u6708_8\u6708_9\u6708_10\u6708_11\u6708_12\u6708".split("_"),
      weekdays: "\u661f\u671f\u65e5_\u661f\u671f\u4e00_\u661f\u671f\u4e8c_\u661f\u671f\u4e09_\u661f\u671f\u56db_\u661f\u671f\u4e94_\u661f\u671f\u516d".split("_"),
      weekdaysShort: "\u9031\u65e5_\u9031\u4e00_\u9031\u4e8c_\u9031\u4e09_\u9031\u56db_\u9031\u4e94_\u9031\u516d".split("_"),
      weekdaysMin: "\u65e5_\u4e00_\u4e8c_\u4e09_\u56db_\u4e94_\u516d".split("_"),
      longDateFormat: {
        LT: "Ah\u9edemm",
        LTS: "Ah\u9edem\u5206s\u79d2",
        L: "YYYY\u5e74MMMD\u65e5",
        LL: "YYYY\u5e74MMMD\u65e5",
        LLL: "YYYY\u5e74MMMD\u65e5LT",
        LLLL: "YYYY\u5e74MMMD\u65e5ddddLT",
        l: "YYYY\u5e74MMMD\u65e5",
        ll: "YYYY\u5e74MMMD\u65e5",
        lll: "YYYY\u5e74MMMD\u65e5LT",
        llll: "YYYY\u5e74MMMD\u65e5ddddLT"
      },
      meridiemParse: /\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,
      meridiemHour: function(hour, meridiem) {
        if (hour === 12) hour = 0;
        if (meridiem === "\u65e9\u4e0a" || meridiem === "\u4e0a\u5348") return hour;
        else if (meridiem === "\u4e2d\u5348") return hour >= 11 ? hour : hour + 12;
        else if (meridiem === "\u4e0b\u5348" || meridiem === "\u665a\u4e0a") return hour + 12
      },
      meridiem: function(hour, minute, isLower) {
        var hm = hour * 100 + minute;
        if (hm < 900) return "\u65e9\u4e0a";
        else if (hm < 1130) return "\u4e0a\u5348";
        else if (hm < 1230) return "\u4e2d\u5348";
        else if (hm < 1800) return "\u4e0b\u5348";
        else return "\u665a\u4e0a"
      },
      calendar: {
        sameDay: "[\u4eca\u5929]LT",
        nextDay: "[\u660e\u5929]LT",
        nextWeek: "[\u4e0b]ddddLT",
        lastDay: "[\u6628\u5929]LT",
        lastWeek: "[\u4e0a]ddddLT",
        sameElse: "L"
      },
      ordinalParse: /\d{1,2}(\u65e5|\u6708|\u9031)/,
      ordinal: function(number, period) {
        switch (period) {
          case "d":
          case "D":
          case "DDD":
            return number + "\u65e5";
          case "M":
            return number + "\u6708";
          case "w":
          case "W":
            return number + "\u9031";
          default:
            return number
        }
      },
      relativeTime: {
        future: "%s\u5167",
        past: "%s\u524d",
        s: "\u5e7e\u79d2",
        m: "\u4e00\u5206\u9418",
        mm: "%d\u5206\u9418",
        h: "\u4e00\u5c0f\u6642",
        hh: "%d\u5c0f\u6642",
        d: "\u4e00\u5929",
        dd: "%d\u5929",
        M: "\u4e00\u500b\u6708",
        MM: "%d\u500b\u6708",
        y: "\u4e00\u5e74",
        yy: "%d\u5e74"
      }
    })
  });
  moment.locale("en");

  function makeGlobal(shouldDeprecate) {
    if (typeof ender !== "undefined") return;
    oldGlobalMoment = globalScope.moment;
    if (shouldDeprecate) globalScope.moment = deprecate("Accessing Moment through the global scope is " + "deprecated, and will be removed in an upcoming " + "release.", moment);
    else globalScope.moment = moment
  }
  if (hasModule) module.exports = moment;
  else if (typeof define === "function" && define.amd) {
    define(function(require,
      exports, module) {
      if (module.config && module.config() && module.config().noGlobal === true) globalScope.moment = oldGlobalMoment;
      return moment
    });
    makeGlobal(true)
  } else makeGlobal()
}).call(this);
