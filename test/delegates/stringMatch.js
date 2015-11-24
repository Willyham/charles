'use strict';

var Immutable = require('immutable');
var levenshtein = require('fast-levenshtein');

var Charles = require('../../index');

var alphaNumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';
function pickRandomCharacter() {
  return alphaNumeric.charAt(Math.floor(Math.random() * alphaNumeric.length));
}
function randomStringOfLength(n) {
  return Immutable.Range(0, n).map(pickRandomCharacter).join('');
}

var target = 'Hello World';

var stringMatch = Immutable.fromJS({

  createRandomChromosome: function createChromosome(callback) {
    callback(null, new Charles.Chromosome({
      value: randomStringOfLength(target.length)
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

  mutateChromosome: function mutateChromosome(chromosome, callback) {
    var value = chromosome.genes.get('value');
    var index = Math.floor(Math.random() * value.length);
    var newValue = value.substr(0, index) + pickRandomCharacter() + value.substr(index + 1);
    chromosome.genes = chromosome.genes.set('value', newValue);
    callback(null, chromosome);
  },

  getFitnessOfChromosome: function getFitnessOfChromosome(chromosome, callback) {
    var fitness = levenshtein.get(chromosome.genes.get('value'), target);
    callback(null, fitness);
  },

  shouldStopSimulation: function shouldStopSimulation(population, callback) {
    if (population.generation === 500) {
      callback(null, true);
      return;
    }
    var fittest = population.getFittestChromosome();
    callback(null, fittest.genes.get('value') === target);
  }
});

module.exports = stringMatch;
