'use strict';

var test = require('tape');
var P = require('bluebird');

var Charles = require('../../');
var simpleDelegates = require('../delegates/simple');

test('It should cull the correct number of chromosomes', function testCull(t) {
  t.plan(1);

  var fitness = 0;
  var getFitnessOfChromosome = function getFitnessOfChromosome(chromosome, callback) {
    fitness++;
    callback(null, fitness);
  };
  var fitnessFunc = P.promisify(getFitnessOfChromosome);

  var population = new Charles.Population({
    populationSize: 100,
    cullPercentage: 50
  });

  var createChromosome = P.promisify(simpleDelegates.get('createRandomChromosome'));
  population.seed(createChromosome)
    .then(function calculateFitness() {
      return population.calculateFitness(fitnessFunc);
    })
    .then(population.cull.bind(population))
    .then(function testMembers() {
      t.equal(population.getMembers().size, 50);
    });
});
