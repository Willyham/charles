'use strict';

var Immutable = require('immutable');
var P = require('bluebird');
var R = require('ramda');

function asyncNoop() {
  var callback = arguments[arguments.length - 1];
  callback(null);
}

function Experiment(options, population, delegates) {
  var Options = Immutable.Record({
    mutationProbability: 0.1,
    crossoverProbability: 0.5
  });

  var Delegates = Immutable.Record({
    createRandomChromosome: asyncNoop,
    getFitnessOfChromosome: asyncNoop,
    mutateChromosome: asyncNoop,
    crossoverChromosomes: asyncNoop,
    shouldStopSimulation: asyncNoop
  });

  this.options = new Options(options);

  // Promisify all delegates for internal use.
  this.delegates = new Delegates(delegates);
  this.delegates = this.delegates.toSeq().map(P.promisify).toObject();

  // Initial setup
  this.population = population;
  this.setInitialized(false);
}

Experiment.prototype.setInitialized = function setInitialized(value) {
  this.isInitialized = value;
};

Experiment.prototype.init = function init(callback) {
  var setIsInitialized = R.partial(this.setInitialized.bind(this), true);
  return this.population.seed(this.delegates.createRandomChromosome)
    .then(setIsInitialized)
    .nodeify(callback);
};

Experiment.prototype.run = function run(callback) {
  if (!this.isInitialized) {
    throw new Error('Must initialize before running');
  }
  var cull = this.population.cull.bind(this.population);
  var breed = this.population.fillByBreeding.bind(this.population, this.delegates.crossoverChromosomes);

  var self = this;
  function runLoop() {
    var generation = self.population.generation;
    var members = self.population.getMembers();

    return self.delegates.shouldStopSimulation(generation, members)
      .then(function onStopResult(shouldStop) {
        if (shouldStop) {
          return P.resolve().nodeify(callback);
        }

        // Do evolutionary work here
        self.population.incrementGeneration();
        return self.population.calculateFitness(self.delegates.getFitnessOfChromosome)
          .then(cull)
          .then(breed)
          .then(runLoop);
      });
  }
  return runLoop();
};

module.exports = Experiment;
