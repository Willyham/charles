'use strict';
var test = require('tape');
var sinon = require('sinon');

var Species = require('../');
var simpleDelegates = require('./delegates/simple');
var maxProductDelegates = require('./delegates/product').maxProduct;
var minProductDelegates = require('./delegates/product').minProduct;
var stringMatchDelegates = require('./delegates/stringMatch');

var sandbox = sinon.sandbox.create();

test('It should not run before init', function testNoInit(t) {
  t.plan(1);
  var population = new Species.Population();
  var experiment = new Species.Experiment({}, population, simpleDelegates.toJS());
  t.throws(experiment.run.bind(experiment));
});

test('It should stop immediately', function testStop(t) {
  t.plan(2);
  var shouldStopSimulation = sandbox.spy(function stopSim(population, callback) {
    callback(null, population.generation === 0);
  });

  var delegates = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var population = new Species.Population();
  var experiment = new Species.Experiment({}, population, delegates.toJS());
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
  var population = new Species.Population();
  var experiment = new Species.Experiment({}, population, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(shouldStopSimulation.calledThrice);
      sandbox.restore();
    });
});

test('It should calculate new fitness', function testCalcFitness(t) {
  t.plan(3);
  var shouldStopSimulation = function stopSim(population, callback) {
    callback(null, population.generation === 1);
  };

  // Increase make population with fitness 1 - 10
  var fitness = 1;
  var getFitnessOfChromosome = sandbox.spy(function getFitness(chromosome, callback) {
    fitness++;
    callback(null, fitness);
  });

  var population = new Species.Population({
    populationSize: 10
  });

  var delegatesWithStop = simpleDelegates.set('shouldStopSimulation', shouldStopSimulation);
  var delegates = delegatesWithStop.set('getFitnessOfChromosome', getFitnessOfChromosome);
  var experiment = new Species.Experiment({}, population, delegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.ok(getFitnessOfChromosome.called);
      var members = experiment.population.getMembers();
      t.equal(members.size, 10);
      t.true(members.valueSeq().every(function hasValue(member) {
        return typeof member.fitness === 'number';
      }));
      sandbox.restore();
    });
});

test('It should run a complete experiment', function testFull(t) {
  var population = new Species.Population({
    populationSize: 100
  });
  var experiment = new Species.Experiment({}, population, maxProductDelegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.end();
    });
});

test('It should run a minimizing experiment', function testFull(t) {
  var population = new Species.Population({
    populationSize: 100,
    minimizeFitness: true
  });
  var experiment = new Species.Experiment({}, population, minProductDelegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.end();
    });
});

test('It should solve a more complex problem', function testFull(t) {
  var population = new Species.Population({
    populationSize: 100,
    minimizeFitness: true
  });
  var experiment = new Species.Experiment({mutationProbability: 0.1}, population, stringMatchDelegates.toJS());
  experiment.init()
    .then(experiment.run.bind(experiment))
    .then(function checkResults() {
      t.end();
    });
});
