'use strict';

var test = require('tape');
var P = require('bluebird');
var sinon = require('sinon');

var Charles = require('../../');
var simpleDelegates = require('../delegates/simple');

var createChromosome = P.promisify(simpleDelegates.get('createRandomChromosome'));
var crossoverChromosome = P.promisify(simpleDelegates.get('crossoverChromosomes'));

var sandbox = sinon.sandbox.create();

test('It should seed a new population with the correct size', function createPop(t) {
  t.plan(1);

  var population = new Charles.Population({
    populationSize: 10
  });

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
  t.plan(3);

  var fitness = 0;
  var getFitnessOfChromosome = function getFitnessOfChromosome(chromosome) {
    fitness++;
    return P.resolve(fitness);
  };

  var population = new Charles.Population({
    populationSize: 100,
    cullPercentage: 80
  });

  population.seed(createChromosome)
    .then(function calculateFitness() {
      return population.calculateFitness(getFitnessOfChromosome);
    })
    .then(function doCull() {
      population.cull();
    })
    .then(function testMembers() {
      var members = population.getMembers();
      t.equal(members.size, 20);
      t.equal(members.first().fitness, 100);
      t.equal(members.last().fitness, 81);
    });
});

test('It should cull the correct number of chromosomes when minimizing', function testCull(t) {
  t.plan(3);

  var fitness = 0;
  var getFitnessOfChromosome = function getFitnessOfChromosome(chromosome) {
    fitness++;
    return P.resolve(fitness);
  };

  var population = new Charles.Population({
    populationSize: 100,
    cullPercentage: 80,
    minimizeFitness: true
  });

  population.seed(createChromosome)
    .then(function calculateFitness() {
      return population.calculateFitness(getFitnessOfChromosome);
    })
    .then(function doCull() {
      population.cull();
    })
    .then(function testMembers() {
      var members = population.getMembers();
      t.equal(members.size, 20);
      t.equal(members.first().fitness, 1);
      t.equal(members.last().fitness, 20);
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

  var breedFunc = sandbox.spy(crossoverChromosome);

  population.fillByBreeding(breedFunc)
    .then(function testMembers() {
      t.equal(breedFunc.getCalls().length, 8);
      t.equal(population.getMembers().size, 10);
      sandbox.restore();
    });
});
