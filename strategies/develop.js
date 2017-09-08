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
      rsi: 50,
      lowDuration: 0,
      highDuration: 0
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
  var lowDuration = rsi < 30 && rsi > 15 ? trend.lowDuration + 1 : 0;
  var highDuration = rsi > 70 ? trend.highDuration + 1 : 0;
  var direction = trend.rsi < rsi ? DIRECTION.up : DIRECTION.down;
  var duration = trend.direction === direction ? trend.duration + 1 : 0;

  this.trend.rsi = {
    direction: direction,
    duration: duration,
    rsi: rsi,
    lowDuration: lowDuration,
    highDuration: highDuration
  };

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

  if (buy && !macd.histAbove && rsi.lowDuration > 2) {
    advise(ADVICE.long);
  }

  if (sell && macd.histAbove && macd.macd > 0 && macdHistDirectionDown && macd.hist > 2.5) {
    advise(ADVICE.short);
  }
  // if (sell && macd.histAbove && rsi.highDuration > 2) {
  //   advise(ADVICE.short);
  // }

  // if (buy && macdHistDirectionUp && !macd.histAbove && !bbands.contracting) {
  //   advise(ADVICE.long);
  // }

  // if (sell && macdHistDirectionDown && macd.histAbove && bbands.contracting) {
  //   advise(ADVICE.short);
  // }
};

module.exports = strat;
