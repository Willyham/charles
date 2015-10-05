'use strict';

var Immutable = require('immutable');

var Charles = require('../../index');

var SimpleChromosome = Charles.Chromosome({
  a: null,
  b: null
});

var simpleDelegates = Immutable.fromJS({

  Chromosome: SimpleChromosome,

  createRandomChromosome: function createChromosome(callback) {
    callback(null, new SimpleChromosome({
      a: Math.random(),
      b: Math.random()
    }));
  },

  crossoverChromosomes: function crossoverChromosome(parent1, parent2, callback) {
    callback(null, new SimpleChromosome({
      a: parent1.get('a'),
      b: parent2.get('b')
    }));
  },

  getFitnessOfChromosome: function getFitnessOfChromosome(chromosome, callback) {
    callback(null, Math.floor(Math.random() * 100) + 1);
  }
});

module.exports = simpleDelegates;
