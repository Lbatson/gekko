var _ = require('lodash');
var log = require('../core/log');
var config = require('../core/util').getConfig();
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
  this.buyinprice = 0;
  this.price = 0;
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
};

strat.update = function(candle) {
  this.price = candle.close;
};

strat.log = function(candle) {
  log.debug('date:', candle.start.format());
  log.debug('candle high:', candle.high);
  log.debug('candle low:', candle.low);
  log.debug('candle close:', candle.close);
};

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
};

strat.check = function(candle) {
  // Calculate trends
  this.bbands();
  this.macd();
  this.rsi();
  console.log(JSON.stringify(this.trend, null, 2), '\n');

  // Trend data
  var bbands = this.trend.bbands;
  var macd = this.trend.macd;
  var rsi = this.trend.rsi;

  var buy = this.lastAdvice !== ADVICE.long;
  var sell = this.lastAdvice !== ADVICE.short;

  // // Stop loss
  // var stoploss = parseFloat((((this.buyinprice / this.price) * 100).toFixed(0) - 100));
  // stoploss = stoploss < 1 ? 1 : stoploss;

  // if (sell && stoploss > settings.stoploss) {
  //   log.debug('EXECUTE STOPLOSS:', stoploss, this.price);
  //   this.buyinprice = 0;
  //   this.lastAdvice = ADVICE.short;
  //   this.advice(this.lastAdvice);
  //   return;
  // }

  if (buy && !macd.histAbove && rsi.lowDuration > 2) {
    this.buyinprice = candle.close;
    this.lastAdvice = ADVICE.long;
  }

  if (sell && macd.histAbove && macd.macd > 0 && macd.histDirection === DIRECTION.down && macd.histDuration > 1 && macd.hist > 2.5) {
    this.buyinprice = 0;
    this.lastAdvice = ADVICE.short;
  }

  this.advice(this.lastAdvice);

  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) start time:      2017-08-01 00:55:00
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) end time:      2017-09-08 23:55:00
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) timespan:      a month
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) sharpe ratio:      -1.900422285292949
  // 2017-09-09 21:34:51 (INFO):
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) start price:       2819.61 USD
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) end price:       4350 USD
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) Market:        54.27665528%
  // 2017-09-09 21:34:51 (INFO):
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) amount of trades:    99
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) original simulated balance:  100.00000000 USD
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) current simulated balance:   153.65029682 USD
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) simulated profit:    53.65029682 USD (53.65029682%)
  // 2017-09-09 21:34:51 (INFO): (PROFIT REPORT) simulated yearly profit:   502.64877021 USD (502.64877021%)
};

module.exports = strat;
