'use strict';
var test = require('tape');
var sinon = require('sinon');
var Immutable = require('immutable');

var Charles = require('../');

var sandbox = sinon.sandbox.create();

var SimpleChromosome = Charles.Chromosome({
  a: null,
  b: null
});

var simpleDelegates = Immutable.fromJS({
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

test('It should create a new population with the correct size', function createPop(t) {
  t.plan(1);

  var options = {
    populationSize: 10
  };
  var experiment = new Charles.Experiment(options, simpleDelegates.toJS());
  experiment.init().then(function checkResults() {
    t.equal(experiment.populuation.getMembers().count(), 10);
  });
});

test('It should not run before init', function testNoInit(t) {
  t.plan(1);
  var experiment = new Charles.Experiment({}, simpleDelegates.toJS());
  t.throws(experiment.run.bind(experiment));
});

test('It should stop immediately', function testStop(t) {
  t.plan(2);
  var shouldStopSimulation = sandbox.spy(function stopSim(generation, population, callback) {
    callback(null, generation === 0);
  });

  var delegates = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var experiment = new Charles.Experiment({}, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(shouldStopSimulation.calledOnce);
      t.equal(experiment.populuation.generation, 0);
      sandbox.restore();
    });
});

test('It should run for N generations', function testGenerationLoop(t) {
  t.plan(1);
  var shouldStopSimulation = sandbox.spy(function stopSim(generation, population, callback) {
    callback(null, generation === 2);
  });

  var delegates = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var experiment = new Charles.Experiment({}, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(shouldStopSimulation.calledThrice);
      sandbox.restore();
    });
});

test('It should calculate new fitness', function testCalcFitness(t) {
  t.plan(3);
  var shouldStopSimulation = function stopSim(generation, population, callback) {
    callback(null, generation === 1);
  };
  var getFitnessOfChromosome = sandbox.spy(function getFitness(chromosome, callback) {
    callback(null, 1);
  });

  var options = {
    populationSize: 2
  };

  var delegatesWithStop = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var delegates = delegatesWithStop.set('getFitnessOfChromosome', getFitnessOfChromosome);
  var experiment = new Charles.Experiment(options, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(getFitnessOfChromosome.calledTwice);
      var members = experiment.populuation.getMembers();
      members.forEach(function checkFitness(fitness) {
        t.equal(fitness, 1);
      });
      sandbox.restore();
    });
});

// TODO: Test cull by seeding with [1..100] fitness and check number culled
// TODO: Test breed by culling all and checking breedFunc called `pop` times
// TODO: Test crossover by pop of 1 with (x,y) becomes (y,x)
