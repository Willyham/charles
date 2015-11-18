'use strict';

var Immutable = require('immutable');
var levenshtein = require('fast-levenshtein');

var Charles = require('../../index');

var alphaNumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function pickRandomCharacter() {
  return alphaNumeric.charAt(Math.floor(Math.random() * alphaNumeric.length));
}
function randomStringOfLength(n) {
  return Immutable.Range(0, n).map(pickRandomCharacter).join('');
}

var target = 'Beans';

var stringMatch = Immutable.fromJS({

  createRandomChromosome: function createChromosome(callback) {
    callback(null, new Charles.Chromosome({
      value: randomStringOfLength(5)
    }));
  },

  crossoverChromosomes: function crossoverChromosome(parent1, parent2, callback) {
    var value1 = parent1.genes.get('value');
    var value2 = parent2.genes.get('value');
    var pivot = Math.floor(value1.length / 2);
    var first = value1.substring(0, pivot);
    var second = value2.substring(pivot, value1.length);

    callback(null, new Charles.Chromosome({
      value: first + second
    }));
  },

  getFitnessOfChromosome: function getFitnessOfChromosome(chromosome, callback) {
    var fitness = levenshtein.get(chromosome.genes.get('value'), target);
    callback(null, fitness);
  },

  shouldStopSimulation: function shouldStopSimulation(population, callback) {
    var fittest = population.getFittestChromosome();
    callback(null, fittest.genes.get('value') === target);
  }
});

module.exports = stringMatch;
