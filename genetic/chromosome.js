'use strict';

var Immutable = require('immutable');

function Chromosome(options) {
  return Immutable.Record(options);
}

module.exports = Chromosome;
