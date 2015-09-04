'use strict';
var test = require('tape');

var Charles = require('../');

test('It should create a new population with the correct size', function createPop(t) {
  t.plan(1);

  var MyChromosome = Charles.Chromosome({
    a: null,
    b: null
  });

  var delegates = {
    createRandomChromosome: function createChromosome(callback) {
      callback(null, new MyChromosome({
        a: Math.random(),
        b: Math.random()
      }));
    }
  };

  var options = {
    populationSize: 10
  };
  var experiment = new Charles.Experiment(options, delegates);
  experiment.init().then(function checkResults() {
    t.equal(experiment.populuation.getMembers().count(), 10);
  });
});

