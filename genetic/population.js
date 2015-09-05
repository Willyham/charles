'use strict';

var Immutable = require('immutable');
var P = require('bluebird');

function Population(options) {
  var Options = Immutable.Record({
    populationSize: 100
  });
  this.options = new Options(options);
  this.generation = 0;
  // Members is a map of chromosome to fitness
  this.members = Immutable.Map();
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
