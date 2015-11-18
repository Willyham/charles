'use strict';

var Immutable = require('immutable');
var P = require('bluebird');
var R = require('ramda');

/* istanbul ignore next */
function asyncNoop() {
  var callback = arguments[arguments.length - 1];
  callback(null);
}

function Experiment(options, population, delegates) {
  var Options = Immutable.Record({
    shouldMinimize: false,
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
  var fitnessFunc = this.delegates.getFitnessOfChromosome;
  var calculateFitness = this.population.calculateFitness.bind(this.population, fitnessFunc);

  return this.population.seed(this.delegates.createRandomChromosome)
    .then(calculateFitness)
    .then(setIsInitialized)
    .nodeify(callback);
};

Experiment.prototype.run = function run(callback) {
  if (!this.isInitialized) {
    throw new Error('Must initialize before running');
  }
  var crossoverFunc = this.delegates.crossoverChromosomes;
  var fitnessFunc = this.delegates.getFitnessOfChromosome;

  var cull = this.population.cull.bind(this.population, this.options.shouldMinimize);
  var breed = this.population.fillByBreeding.bind(this.population, crossoverFunc, fitnessFunc);

  var self = this;
  function runLoop() {
    return self.delegates.shouldStopSimulation(self.population)
      .then(function onStopResult(shouldStop) {
        if (shouldStop) {
          return P.resolve().nodeify(callback);
        }

        // Do evolutionary work here
        self.population.incrementGeneration();
        return self.population.calculateFitness(fitnessFunc)
          .then(cull)
          .then(breed)
          .then(runLoop);
      });
  }
  return runLoop();
};

module.exports = Experiment;
