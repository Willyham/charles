'use strict';
var test = require('tape');
var sinon = require('sinon');

var Charles = require('../');
var simpleDelegates = require('./delegates/simple');
var maxProductDelegates = require('./delegates/maxProduct');

var sandbox = sinon.sandbox.create();

test('It should not run before init', function testNoInit(t) {
  t.plan(1);
  var population = new Charles.Population();
  var experiment = new Charles.Experiment({}, population, simpleDelegates.toJS());
  t.throws(experiment.run.bind(experiment));
});

test('It should stop immediately', function testStop(t) {
  t.plan(2);
  var shouldStopSimulation = sandbox.spy(function stopSim(population, callback) {
    callback(null, population.generation === 0);
  });

  var delegates = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var population = new Charles.Population();
  var experiment = new Charles.Experiment({}, population, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(shouldStopSimulation.calledOnce);
      t.equal(experiment.population.generation, 0);
      sandbox.restore();
    });
});

test('It should run for N generations', function testGenerationLoop(t) {
  t.plan(1);
  var shouldStopSimulation = sandbox.spy(function stopSim(population, callback) {
    callback(null, population.generation === 2);
  });

  var delegates = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var population = new Charles.Population();
  var experiment = new Charles.Experiment({}, population, delegates.toJS());
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
    callback(null, population.generation === 1);
  };
  var getFitnessOfChromosome = sandbox.spy(function getFitness(chromosome, callback) {
    callback(null, 1);
  });

  var population = new Charles.Population({
    populationSize: 2
  });

  var delegatesWithStop = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var delegates = delegatesWithStop.set('getFitnessOfChromosome', getFitnessOfChromosome);
  var experiment = new Charles.Experiment({}, population, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(getFitnessOfChromosome.calledTwice);
      var members = experiment.population.getMembers();
      members.forEach(function checkFitness(chromosome) {
        t.equal(chromosome.fitness, 1);
      });
      sandbox.restore();
    });
});

// Not quite there yet
test.skip('It should run a complete experiment', function testFull(t) {
  var population = new Charles.Population({
    populationSize: 100
  });
  var experiment = new Charles.Experiment({}, population, maxProductDelegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.end();
    });
});


// TODO: Test crossover by pop of 1 with (x,y) becomes (y,x)
