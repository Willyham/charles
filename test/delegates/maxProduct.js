'use strict';

var Immutable = require('immutable');

var Charles = require('../../index');

function pickRandomDigit() {
  return Math.floor(Math.random() * 9) + 1;
}
function sum(memo, value) {
  memo += value;
  return memo;
}

var target = 9 * 5;

var maxProduct = Immutable.fromJS({

  createRandomChromosome: function createChromosome(callback) {
    callback(null, new Charles.Chromosome({
      1: pickRandomDigit(),
      2: pickRandomDigit(),
      3: pickRandomDigit(),
      4: pickRandomDigit(),
      5: pickRandomDigit()
    }));
  },

  crossoverChromosomes: function crossoverChromosome(parent1, parent2, callback) {
    callback(null, new Charles.Chromosome({
      1: parent1.genes.get('1'),
      2: parent1.genes.get('2'),
      3: parent1.genes.get('3'),
      4: parent2.genes.get('4'),
      5: parent2.genes.get('5')
    }));
  },

  getFitnessOfChromosome: function getFitnessOfChromosome(chromosome, callback) {
    var fitness = chromosome.genes.valueSeq().reduce(sum, 0);
    callback(null, fitness);
  },

  shouldStopSimulation: function shouldStopSimulation(population, callback) {
    var fittest = population.getFittestChromosome();
    console.log(fittest);
    callback(null, fittest.fitness === target);
  }
});

module.exports = maxProduct;
