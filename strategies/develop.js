var _ = require('lodash');
var log = require('../core/log');
var config = require('../core/util.js').getConfig();
var settings = config.develop;
var ADVICE = {
  long: 'long',
  short: 'short'
};
var strat = {};

strat.init = function() {
  this.currentAdvice = ADVICE.short;
  this.requiredHistory = config.tradingAdvisor.historySize;
  this.trend = {
    bbands: {
      contracting: false,
      duration: 0,
      width: 0
    },
    macd: {
      // direction: 'none',
      // duration: 0,
      // persisted: false,
      // adviced: false
    },
    rsi: {
      rsi: 50,
      direction: '',
      duration: 0
      // direction: 'none',
      // duration: 0,
      // persisted: false,
      // adviced: false
    }
  };

  this.addTalibIndicator('bbands', 'bbands', settings.BBANDS.talib);
  this.addTalibIndicator('macd', 'macd', settings.MACD.talib);
  this.addTalibIndicator('rsi', 'rsi', settings.RSI.talib);
  this.addTalibIndicator('sma', 'sma', settings.SMA.talib);
  this.addTalibIndicator('stochrsi', 'stochrsi', settings.STOCHRSI.talib);
  this.addTalibIndicator('willr', 'willr', settings.WILLR.talib);
};

strat.update = function(candle) { };

strat.log = function(candle) {
  // var digits = 8;

  // var bbands = this.talibIndicators.bbands.result;
  // log.debug('calculated BBANDS properties for candle:');
  // log.debug('\t', 'bband upper:', bbands.outRealUpperBand);
  // log.debug('\t', 'bband middle:', bbands.outRealMiddleBand);
  // log.debug('\t', 'bband lower:', bbands.outRealLowerBand);
  
  // var rsi = this.talibIndicators.rsi.result.outReal;
  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', (rsi || 0).toFixed(digits));

  // var macd = this.talibIndicators.macd.result;
  // var real = macd.outMACD;
  // var signal = macd.outMACDSignal;
  // var hist = macd.outMACDHist;
  // log.debug('calculated MACD properties for candle:');
  // log.debug('\t', 'macd:', (real || 0).toFixed(digits));
  // log.debug('\t', 'signal:', (signal || 0).toFixed(digits));
  // log.debug('\t', 'hist:', (hist || 0).toFixed(digits));
};

strat.bbands = function(candle) {
  // BBANDS
  var trend = this.trend.bbands;
  var bbands = this.talibIndicators.bbands.result;
  var upper = bbands.outRealUpperBand;
  var middle = bbands.outRealMiddleBand;
  var lower = bbands.outRealLowerBand;
  var width = (upper - lower) / middle;
  var contracting = trend.width > width;
  var duration = trend.contracting === contracting ? trend.duration + 1 : 0;

  this.trend.bbands = {
    contracting: contracting,
    duration: duration,
    width: width
  };

  log.debug('BBANDS:', this.trend.bbands);
};

strat.macd = function(candle) {
  // MACD
  // var macd = this.talibIndicators.macd.result;
  // var macddiff = this.indicators.macd.result;

  // if (macddiff > settings.MACD.thresholds.up) {
  //   // new trend detected
  //   if (this.trend.macd.direction !== 'up') {
  //     // reset the state for the new trend
  //     this.trend.macd = {
  //       duration: 0,
  //       persisted: false,
  //       direction: 'up',
  //       adviced: false
  //     };
  //   }

  //   this.trend.macd.duration++;

  //   log.debug('In uptrend since', this.trend.macd.duration, 'candle(s)');

  //   if (this.trend.macd.duration >= settings.MACD.thresholds.persistence) {
  //     this.trend.macd.persisted = true;
  //   }

  //   if (this.trend.macd.persisted && !this.trend.macd.adviced) {
  //     this.trend.macd.adviced = true;
  //     return ADVICE.long;
  //   } else return;

  // } else if (macddiff < settings.MACD.thresholds.down) {
  //   // new trend detected
  //   if (this.trend.macd.direction !== 'down') {
  //     // reset the state for the new trend
  //     this.trend.macd = {
  //       duration: 0,
  //       persisted: false,
  //       direction: 'down',
  //       adviced: false
  //     };
  //   }

  //   this.trend.macd.duration++;

  //   log.debug('In downtrend since', this.trend.macd.duration, 'candle(s)');

  //   if (this.trend.macd.duration >= settings.MACD.thresholds.persistence) {
  //     this.trend.macd.persisted = true;
  //   }

  //   if (this.trend.macd.persisted && !this.trend.macd.adviced) {
  //     this.trend.macd.adviced = true;
  //     return ADVICE.short;
  //   } else return;

  // } else {
  //   log.debug('In no trend');
  //   return;
  // }
};

strat.rsi = function(candle) {
  // RSI
  var trend = this.trend.rsi
  var rsi = this.talibIndicators.rsi.result.outReal;
  var direction = trend.rsi < rsi ? 'up' : 'down';
  var duration = trend.direction === direction ? trend.duration + 1 : 0;

  this.trend.rsi = {
    rsi: rsi,
    direction: direction,
    duration: duration
  }

  log.debug('RSI:', this.trend.rsi);

  // if (rsi > settings.RSI.thresholds.high) {
  //   // new trend detected
  //   if (this.trend.rsi.direction !== 'high') {
  //     this.trend.rsi = {
  //       duration: 0,
  //       persisted: false,
  //       direction: 'high',
  //       adviced: false
  //     };
  //   }

  //   this.trend.rsi.duration++;

  //   log.debug('RSI', 'High since', this.trend.rsi.duration, 'candle(s)');

  //   if (this.trend.rsi.duration >= settings.RSI.thresholds.persistence) {
  //     this.trend.rsi.persisted = true;
  //   }

  //   if (this.trend.rsi.persisted && !this.trend.rsi.adviced) {
  //     this.trend.rsi.adviced = true;
  //     return ADVICE.short
  //   } else return
    
  // } else if (rsi < settings.RSI.thresholds.low) {
  //   // new trend detected
  //   if (this.trend.rsi.direction !== 'low') {
  //     this.trend.rsi = {
  //       duration: 0,
  //       persisted: false,
  //       direction: 'low',
  //       adviced: false
  //     };
  //   }

  //   this.trend.rsi.duration++;

  //   log.debug('RSI', 'Low since', this.trend.rsi.duration, 'candle(s)');

  //   if (this.trend.rsi.duration >= settings.RSI.thresholds.persistence) {
  //     this.trend.rsi.persisted = true;
  //   }

  //   if (this.trend.rsi.persisted && !this.trend.rsi.adviced) {
  //     this.trend.rsi.adviced = true;
  //     return ADVICE.long
  //   } else return

  // } else {
  //   log.debug('RSI:', 'No trend');
  //   return
  // }
};

strat.check = function(candle) {
  this.bbands();
  this.rsi();

  var bbands = this.trend.bbands;
  var rsi = this.trend.rsi;

  if (this.currentAdvice !== ADVICE.long && !bbands.contracting && rsi.rsi < 40 && rsi.direction === 'up' && rsi.duration < 2) {
    log.debug('date:', candle.start.format());
    log.debug('candle high:', candle.high);
    log.debug('candle low:', candle.low);
    log.debug('candle close:', candle.close);
    this.currentAdvice = ADVICE.long;
    this.advice(this.currentAdvice);
  }

  if (this.currentAdvice !== ADVICE.short && bbands.contracting && bbands.duration < 2 && rsi.rsi > 70 && rsi.direction === 'down') {
    log.debug('date:', candle.start.format());
    log.debug('candle high:', candle.high);
    log.debug('candle low:', candle.low);
    log.debug('candle close:', candle.close);
    this.currentAdvice = ADVICE.short;
    this.advice(this.currentAdvice);
  }
  // log.debug('advice:', advice);

  // if (advice.bbands === long && advice.rsi === long && this.currentAdvice !== long) {
  //   log.debug('TAKE POSITION:', long);
  //   this.currentAdvice = long;
  //   this.advice(long);
  // } else if (advice.bbands === short && advice.rsi === short && this.currentAdvice !== short) {
  //   log.debug('TAKE POSITION:', short);
  //   this.currentAdvice = short;
  //   this.advice(short);
  // } else {
  //   this.advice();
  // }
};

module.exports = strat;
