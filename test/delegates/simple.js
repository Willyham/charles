'use strict';

var Immutable = require('immutable');

var Charles = require('../../index');

var simpleDelegates = Immutable.fromJS({

  createRandomChromosome: function createChromosome(callback) {
    callback(null, new Charles.Chromosome({
      a: Math.random(),
      b: Math.random()
    }));
  },

  crossoverChromosomes: function crossoverChromosome(parent1, parent2, callback) {
    callback(null, new Charles.Chromosome({
      a: parent1.genes.get('a'),
      b: parent2.genes.get('b')
    }));
  },

  mutateChromosome: function mutateChromosome(chromosome, callback) {
    chromosome.genes = chromosome.genes.set('a', Math.random());
    callback(null, chromosome);
  },

  getFitnessOfChromosome: function getFitnessOfChromosome(chromosome, callback) {
    callback(null, Math.floor(Math.random() * 100) + 1);
  }
});

module.exports = simpleDelegates;
