'use strict';

var R = require('ramda');
var P = require('bluebird');
var Immutable = require('immutable');
var Stats = require('fast-stats').Stats;

function Population(options) {
  var Options = Immutable.Record({
    populationSize: 100,
    cullPercentage: 10
  });
  this.options = new Options(options);
  this.generation = 0;
  // Members is a list of chromosomes
  this.members = Immutable.List();
}

Population.prototype.calculateFitness = function calculateFitness(fitnessFunc) {
  function calcFitness(chromosome) {
    return fitnessFunc(chromosome)
      .then(function setFitness(fitness) {
        chromosome.setFitness(fitness);
      });
  }

  return P.all(this.members.map(calcFitness).toArray());
};

Population.prototype.seed = function seed(seedFunc) {
  var self = this;
  var getChromosomePromises = Immutable.Range(0, Infinity)
    .map(R.nAry(0, seedFunc))
    .takeUntil(function isFullPopulation(chromosome, iteration) {
      return iteration === self.options.populationSize;
    })
    .toArray();

  var addAllToPopulation = R.forEach(this.addMember.bind(this));
  return P.all(getChromosomePromises).then(addAllToPopulation);
};

Population.prototype.cull = function cull() {
  var allFitness = this.members.toArray().map(R.prop('fitness'));
  var popStats = new Stats().push(allFitness);
  var percentile = popStats.percentile(this.options.cullPercentage);
  var newMembers = this.members.filter(function isStrongEnough(chromosome) {
    return chromosome.fitness > percentile;
  });
  if (newMembers.size <= 2) {
    // TODO: What should we do here? Need to ensure there's enough to breed
    return P.resolve();
  }
  this.members = newMembers;
  return P.resolve();
};

Population.prototype.fillByBreeding = function fillByBreeding(breedFunc, fitnessFunc) {
  if (this.members.size >= this.options.populationSize) {
    return P.resolve(this.members);
  }
  var parent1 = this.getRandomChromosome();
  var parent2 = this.getRandomChromosome();
  var self = this;
  return breedFunc(parent1, parent2)
    .then(function addChild(child) {
      return fitnessFunc(child).then(function onFitness(fitness) {
        child.setFitness(fitness);
        self.addMember(child);
      });
    })
    .then(function callRecursive() {
      // Keep filling until we reach the right population size
      return self.fillByBreeding(breedFunc, fitnessFunc);
    });
};

Population.prototype.addMember = function addMember(chromosome) {
  this.members = this.members.push(chromosome);
};

Population.prototype.getMembers = function getMembers() {
  return this.members;
};

Population.prototype.getRandomChromosome = function getRandomChromosome() {
  var index = Math.floor(Math.random() * this.members.size);
  return this.members.skip(index).take(1).get(0);
};

Population.prototype.getFittestChromosome = function getFittestChromosome() {
  return this.members.maxBy(R.prop('fitness'));
};

Population.prototype.incrementGeneration = function increaseGeneration() {
  this.generation++;
};

module.exports = Population;
