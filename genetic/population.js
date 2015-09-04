'use strict';

var Immutable = require('immutable');

function Population(options) {
  var Options = Immutable.Record({
    populationSize: 100
  });
  this.options = new Options(options);
  this.generation = 0;
  this.members = Immutable.List();
}

Population.prototype.addMember = function addMember(chromosome) {
  this.members = this.members.push(chromosome);
};

Population.prototype.getMembers = function getMembers() {
  return this.members;
};

module.exports = Population;
