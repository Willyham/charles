'use strict';

var Immutable = require('immutable');

function Chromosome(genes, fitness) {
  fitness = fitness || null;
  this.genes = Immutable.Map(genes);
  this.fitness = fitness;
}

Chromosome.prototype.setFitness = function setFitness(fitness) {
  this.fitness = fitness;
};

module.exports = Chromosome;
