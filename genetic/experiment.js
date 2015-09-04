'use strict';

var Immutable = require('immutable');
var P = require('bluebird');
var R = require('ramda');

var Chromosome = require('./chromosome');
var Population = require('./population');

function noop(callback) {}

function Experiment(options, delegates) {
  // TODO Ensure chromosome is Record
  var Options = Immutable.Record({
    mutationProbability: 0.1,
    crossoverProbability: 0.5,
    populationSize: 100,
    chromosome: Chromosome()
  });

  var Delegates = Immutable.Record({
    createRandomChromosome: noop,
    getFitnessOfChromosome: noop,
    mutateChromosome: noop,
    crossoverChromosomes: noop,
    shouldStopSimulation: noop
  });

  this.options = new Options(options);

  // Promisify all delegates for internal use.
  this.delegates = new Delegates(delegates);
  this.delegates = this.delegates.toSeq().map(P.promisify).toObject();

  // Initial setup
  this.populuation = new Population();
}

Experiment.prototype.init = function init(callback) {
  var self = this;
  var listOfPopulationSize = R.times([].push, this.options.populationSize);
  var createPromises = P.map(listOfPopulationSize, function createRandom(id) {
    return self.delegates.createRandomChromosome();
  });

  var addToPopulation = this.populuation.addMember.bind(this.populuation);
  var addAllToPopulation = R.forEach(addToPopulation);

  return createPromises
    .then(addAllToPopulation)
    .nodeify(callback);
};

module.exports = Experiment;
