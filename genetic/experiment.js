'use strict';

var Immutable = require('immutable');
var P = require('bluebird');
var R = require('ramda');

var Chromosome = require('./chromosome');
var Population = require('./population');

function asyncNoop() {
  var callback = arguments[arguments.length - 1];
  callback(null);
}

function Experiment(options, delegates) {
  // TODO Ensure chromosome is Record
  var Options = Immutable.Record({
    mutationProbability: 0.1,
    crossoverProbability: 0.5,
    populationSize: 100,
    chromosome: Chromosome()
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
  this.populuation = new Population();
  this.setInitialized(false);
}

Experiment.prototype.setInitialized = function setInitialized(value) {
  this.isInitialized = value;
};

Experiment.prototype.init = function init(callback) {
  var self = this;

  var getChromosomePromises = Immutable.Range(0, Infinity)
    .map(function createRandom() {
      return self.delegates.createRandomChromosome();
    })
    .takeUntil(function isFullPopulation(chromosome, iteration) {
      return iteration === self.options.populationSize;
    })
    .toArray();

  var addToPopulation = this.populuation.addMember.bind(this.populuation);
  var addAllToPopulation = R.forEach(addToPopulation);

  var setIsInitialized = R.partial(this.setInitialized.bind(this), true);

  return P.all(getChromosomePromises)
    .then(addAllToPopulation)
    .then(setIsInitialized)
    .nodeify(callback);
};

Experiment.prototype.run = function run(callback) {
  if (!this.isInitialized) {
    throw new Error('Must initialize before running');
  }

  var self = this;
  function runLoop() {
    var generation = self.populuation.generation;
    var members = self.populuation.getMembers();

    return self.delegates.shouldStopSimulation(generation, members)
      .then(function onStopResult(shouldStop) {
        if (shouldStop) {
          return P.resolve().nodeify(callback);
        }

        // Do evolutionary work here
        self.populuation.incrementGeneration();
        return self.populuation.calculateFitness(self.delegates.getFitnessOfChromosome)
          .then(runLoop);
      });
  }
  return runLoop();
};

module.exports = Experiment;
