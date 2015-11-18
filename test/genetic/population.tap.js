'use strict';

var test = require('tape');
var P = require('bluebird');
var sinon = require('sinon');

var Charles = require('../../');
var simpleDelegates = require('../delegates/simple');

var sandbox = sinon.sandbox.create();

test('It should seed a new population with the correct size', function createPop(t) {
  t.plan(1);

  var population = new Charles.Population({
    populationSize: 10
  });

  var createChromosome = P.promisify(simpleDelegates.get('createRandomChromosome'));
  population.seed(createChromosome)
    .then(function calculateFitness() {
      t.equal(population.getMembers().count(), 10);
    });
});

test('It should calculate fitness for all chromosomes', function testFitness(t) {
  t.plan(1);

  var getFitnessOfChromosome = function getFitnessOfChromosome(chromosome, callback) {
    callback(null, 1);
  };
  var fitnessFunc = P.promisify(getFitnessOfChromosome);

  var sumFunc = function sum(memo, chromosome) {
    memo = memo + chromosome.fitness;
    return memo;
  };

  var population = new Charles.Population({
    populationSize: 10
  });

  var createChromosome = P.promisify(simpleDelegates.get('createRandomChromosome'));
  population.seed(createChromosome)
    .then(function calculateFitness() {
      return population.calculateFitness(fitnessFunc);
    })
    .then(function testMembers() {
      var values = population.getMembers().valueSeq();
      var sumOfFitness = values.reduce(sumFunc, 0);
      t.equal(sumOfFitness, 10);
    });
});

test('It should cull the correct number of chromosomes', function testCull(t) {
  t.plan(1);

  var fitness = 0;
  var getFitnessOfChromosome = function getFitnessOfChromosome(chromosome) {
    fitness++;
    return P.resolve(fitness);
  };

  var population = new Charles.Population({
    populationSize: 100,
    cullPercentage: 50
  });

  var createChromosome = P.promisify(simpleDelegates.get('createRandomChromosome'));
  population.seed(createChromosome)
    .then(function calculateFitness() {
      return population.calculateFitness(getFitnessOfChromosome);
    })
    .then(population.cull.bind(population))
    .then(function testMembers() {
      t.equal(population.getMembers().size, 50);
    });
});

test('It should fill remaining chromosomes by breeding', function testBreed(t) {
  t.plan(2);

  var population = new Charles.Population({
    populationSize: 10
  });
  population.addMember(new Charles.Chromosome({
    a: 1,
    b: 2
  }));
  population.addMember(new Charles.Chromosome({
    a: 2,
    b: 3
  }));

  var breedFunc = sandbox.spy(P.promisify(simpleDelegates.get('crossoverChromosomes')));
  var fitnessFunc = P.promisify(simpleDelegates.get('getFitnessOfChromosome'));

  population.fillByBreeding(breedFunc, fitnessFunc)
    .then(function testMembers() {
      t.equal(breedFunc.getCalls().length, 8);
      t.equal(population.getMembers().size, 10);
    });
});
