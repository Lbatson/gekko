var _ = require('lodash');
var log = require('../core/log');
var config = require('../core/util.js').getConfig();
var settings = config.develop;
var ADVICE = {
  long: 'long',
  short: 'short'
};
var DIRECTION = {
  up: 'up',
  down: 'down'
};
var strat = {};

strat.init = function() {
  this.lastAdvice = ADVICE.short;
  this.requiredHistory = config.tradingAdvisor.historySize;
  this.trend = {
    bbands: {
      direction: '',
      duration: 0,
      upper: 0,
      middle: 0,
      lower: 0,
      contracting: false,
      width: 0
    },
    macd: {
      direction: '',
      duration: 0,
      macd: 0,
      signal: 0,
      signalDirection: '',
      signalDuration: 0,
      hist: 0,
      histDirection: '',
      histDuration: 0,
      histAbove: false
    },
    rsi: {
      direction: '',
      duration: 0,
      rsi: 50
    }
  };

  this.addTalibIndicator('bbands', 'bbands', settings.BBANDS.talib);
  this.addTalibIndicator('macd', 'macd', settings.MACD.talib);
  this.addTalibIndicator('rsi', 'rsi', settings.RSI.talib);
  // this.addTalibIndicator('sma', 'sma', settings.SMA.talib);
  // this.addTalibIndicator('stochrsi', 'stochrsi', settings.STOCHRSI.talib);
  // this.addTalibIndicator('willr', 'willr', settings.WILLR.talib);
};

strat.update = function(candle) { };

strat.log = function(candle) { };

strat.bbands = function(candle) {
  var trend = this.trend.bbands;
  var indicator = this.talibIndicators.bbands.result;
  var upper = indicator.outRealUpperBand;
  var middle = indicator.outRealMiddleBand;
  var lower = indicator.outRealLowerBand;
  var width = ((upper - lower) / middle) * 100;
  var contracting = trend.width > width;
  var direction = trend.middle < middle ? DIRECTION.up : DIRECTION.down;
  var duration = trend.direction === direction ? trend.duration + 1 : 0;

  this.trend.bbands = {
    direction: direction,
    duration: duration,
    upper: upper,
    middle: middle,
    lower: lower,
    contracting: contracting,
    width: width
  };

  console.log('BBANDS:', JSON.stringify(this.trend.bbands, null, 2));
};

strat.macd = function(candle) {
  var trend = this.trend.macd;
  var indicator = this.talibIndicators.macd.result;
  var macd = indicator.outMACD;
  var signal = indicator.outMACDSignal;
  var hist = indicator.outMACDHist;
  var signalDirection = trend.signal < signal ? DIRECTION.up: DIRECTION.down;
  var signalDuration = trend.signalDirection === signalDirection ? trend.signalDuration + 1 : 0;
  var histDirection = trend.hist < hist ? DIRECTION.up : DIRECTION.down;
  var histDuration = trend.histDirection === histDirection ? trend.histDuration + 1 : 0;
  var direction = trend.macd < macd ? DIRECTION.up: DIRECTION.down;
  var duration = trend.direction === direction ? trend.duration + 1 : 0;
  var histAbove = hist > 0;

  this.trend.macd = {
    direction: direction,
    duration: duration,
    macd: macd,
    signal: signal,
    signalDirection: signalDirection,
    signalDuration: signalDuration,
    hist: hist,
    histDirection: histDirection,
    histDuration: histDuration,
    histAbove: histAbove
  };

  console.log('MACD:', JSON.stringify(this.trend.macd, null, 2));
};

strat.rsi = function(candle) {
  var trend = this.trend.rsi
  var rsi = this.talibIndicators.rsi.result.outReal;
  var direction = trend.rsi < rsi ? DIRECTION.up : DIRECTION.down;
  var duration = trend.direction === direction ? trend.duration + 1 : 0;

  this.trend.rsi = {
    direction: direction,
    duration: duration,
    rsi: rsi,
  }

  console.log('RSI:', JSON.stringify(this.trend.rsi, null, 2));
};

strat.check = function(candle) {
  var printCandle = function() {
    log.debug('date:', candle.start.format());
    log.debug('candle high:', candle.high);
    log.debug('candle low:', candle.low);
    log.debug('candle close:', candle.close);
  }
  var advise = function(advice) {
    this.lastAdvice = advice;
    this.advice(this.lastAdvice);
  }.bind(this);

  printCandle();
  this.bbands();
  this.macd();
  this.rsi();

  var bbands = this.trend.bbands;
  var macd = this.trend.macd;
  var rsi = this.trend.rsi;

  var buy = this.lastAdvice !== ADVICE.long;
  var sell = this.lastAdvice !== ADVICE.short;
  var crossLowerBBand = bbands.lower < candle.low + (candle.low * 0.0025);
  var crossUpperBBand = bbands.upper > candle.high - (candle.high * 0.0025);
  var bbandDirectionUp = bbands.direction === DIRECTION.up;
  var bbandDirectionDown = bbands.direction === DIRECTION.down;
  var macdDirectionUp = macd.direction === DIRECTION.up && macd.duration > 0;
  var macdDirectionDown = macd.direction === DIRECTION.down && macd.duration > 0;
  var macdHistDirectionUp = macd.histDirection === DIRECTION.up && macd.histDuration > 1;
  var macdHistDirectionDown = macd.histDirection === DIRECTION.down && macd.histDuration > 1;
  var rsiRanged = (rsi.rsi > 40) && (rsi.rsi < 60);
  var rsiDirectionUp = rsi.direction === DIRECTION.up;
  var rsiDirectionDown = rsi.direction === DIRECTION.down;

  // log.debug('buy', buy);
  // log.debug('sell', sell);
  // log.debug('crossLowerBBand', crossLowerBBand);
  // log.debug('crossUpperBBand', crossUpperBBand);
  // log.debug('bbandDirectionUp', bbandDirectionUp);
  // log.debug('bbandDirectionDown', bbandDirectionDown);
  // log.debug('rsiRanged', rsiRanged);
  // log.debug('rsiDirectionUp', rsiDirectionUp);
  // log.debug('rsiDirectionDown', rsiDirectionDown);
  console.log('\n');

// 2017-09-07 15:36:21 (DEBUG):  date: 2017-08-07T17:05:00-05:00
// 2017-09-07 15:36:21 (DEBUG):  candle high: 3371.06
// 2017-09-07 15:36:21 (DEBUG):  candle low: 3362.65
// 2017-09-07 15:36:21 (DEBUG):  candle close: 3365.55
// BBANDS: {
//   "direction": "up",
//   "duration": 0,
//   "upper": 3373.7125153746547,
//   "middle": 3354.3645000000024,
//   "lower": 3335.01648462535,
//   "contracting": false,
//   "width": 1.1536024409185264
// }
// MACD: {
//   "direction": "up",
//   "duration": 3,
//   "macd": 2.26176644577572,
//   "signal": 1.5156509106054106,
//   "signalDirection": "up",
//   "signalDuration": 1,
//   "hist": 0.7461155351703095,
//   "histDirection": "up",
//   "histDuration": 3,
//   "aboveLine": true
// }
// RSI: {
//   "direction": "down",
//   "duration": 0,
//   "rsi": 55.548444764369506
// }
  if (buy && macdHistDirectionUp && !macd.histAbove && !bbands.contracting) {
    advise(ADVICE.long);
  }

// 2017-09-07 15:36:21 (DEBUG):  date: 2017-08-07T18:35:00-05:00
// 2017-09-07 15:36:21 (DEBUG):  candle high: 3391.99
// 2017-09-07 15:36:21 (DEBUG):  candle low: 3387
// 2017-09-07 15:36:21 (DEBUG):  candle close: 3391.04
// BBANDS: {
//   "direction": "up",
//   "duration": 6,
//   "upper": 3401.8057865197093,
//   "middle": 3365.1630000000027,
//   "lower": 3328.520213480296,
//   "contracting": true,
//   "width": 2.1777718654167124
// }
// MACD: {
//   "direction": "up",
//   "duration": 9,
//   "macd": 10.100846089764673,
//   "signal": 6.4928137701676985,
//   "signalDirection": "up",
//   "signalDuration": 7,
//   "hist": 3.6080323195969743,
//   "histDirection": "down",
//   "histDuration": 1,
//   "aboveLine": true
// }
// RSI: {
//   "direction": "up",
//   "duration": 0,
//   "rsi": 62.96623780844537
// }
  if (sell && macdHistDirectionDown && macd.histAbove && bbands.contracting) {
    advise(ADVICE.short);
  }
};

module.exports = strat;
