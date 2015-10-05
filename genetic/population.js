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
  // Members is a map of chromosome to fitness
  this.members = Immutable.Map();
}

function getRandomKeyFromMap(map) {
  var size = map.size;
  var index = Math.floor(Math.random() * size);
  return map.skip(index).take(1).keySeq().first();
}

Population.prototype.calculateFitness = function calculateFitness(fitnessFunc) {
  var self = this;
  function calcFitness(priorFitness, chromosome) {
    return fitnessFunc(chromosome)
      .then(function setFitness(fitness) {
        self.setFitnessForMember(chromosome, fitness);
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
  var allFitness = this.members.valueSeq().toArray();
  var popStats = new Stats().push(allFitness);
  var percentile = popStats.percentile(this.options.cullPercentage);
  this.members = this.members.filter(function isStrongEnough(value) {
    return value >= percentile;
  });
  return P.resolve();
};

Population.prototype.fillByBreeding = function fillByBreeding(breedFunc) {
  if (this.members.size >= this.options.populationSize) {
    return P.resolve(this.members);
  }
  var parent1 = getRandomKeyFromMap(this.members);
  var parent2 = getRandomKeyFromMap(this.members);
  var self = this;
  return breedFunc(parent1, parent2)
    .then(function addChild(child) {
      // Add child with fitness of 0, it'll be recalculated on next generation
      self.members = self.members.set(child, 0);
    })
    .then(function callRecursive() {
      // Keep filling until we reach the right population size
      return self.fillByBreeding(breedFunc);
    });
};

Population.prototype.addMember = function addMember(chromosome) {
  this.members = this.members.set(chromosome, 0);
};

Population.prototype.setFitnessForMember = function setFitnessForMember(chromosome, fitness) {
  this.members = this.members.set(chromosome, fitness);
};

Population.prototype.getMembers = function getMembers() {
  return this.members;
};

Population.prototype.incrementGeneration = function increaseGeneration() {
  this.generation++;
};

module.exports = Population;
