# Species

Asynchronous genetic programming framework for Node.

Species allows you to quickly run simple evolutionary computation problems by defining a set of
delegate functions which describe the properties of your chromosomes and how they interact.

[![asciicast](https://asciinema.org/a/93hlyriy2pl8aa35pk9rpw8m5.png)](https://asciinema.org/a/93hlyriy2pl8aa35pk9rpw8m5)

# Install

`npm install species`

# Usage

First, you must define 5 *async* functions which describe how your Chromosomes interact. These functions are:

- **shouldStopSimulation** - Tells species if/when the simulation should stop
- **createRandomChromosome** - The seed function to create a random initial chromosome
- **crossoverChromosomes** - Given 2 parent chromosomes, produce a new child chromosome (mating)
- **mutateChromosome** - Given a chromosome, produce a new, mutated chromosome
- **getFitnessOfChromosome** - Given a chromosome, calculate its fitness score

After these functions are defined, simply initialize and run a Species experiment:

```javascript
var Species = require('species');

var chromosomeFunctions = {
  shouldStopSimulation: function(population, callback) { ... },
  createRandomChromosome: function(callback) { ... },
  crossoverChromosome: function(parent1, parent2, callback) { ... },
  mutateChromosome: function(chromosome, callback) { ... },
  shouldStopSimulation: function(population, callback) { ... }
};

// Create a new population
var population = new Species.Population({
  populationSize: 100
});

// Define experiment options
var experimentOptions = {
  mutationProbability: 0.1
};

// Create and run experiment
var experiment = new Species.Experiment(experimentOptions, population, chromosomeFunctions);

experiment.init()
  .then(experiment.run.bind(experiment))
  .then(function checkResults() {
    console.log(population.getFittestChromosome(), population.generation);
  });
```

For examples of sets of chromosome functions, please see the test folder or the species-examples pacakge (TODO).

### Options

Aside from specifiying your chromosome functions, you can also tweak some other settings such as the probabilities of mutation occuring. These are the currently supported properties, their types, default values and descriptions:

```
mutationProbability: Number (0.1) - Chance of mutating each chromosome per generation,
crossoverProbability: Number (0.5) - Chance of breeding 2 chromosomes per generation (NOT IMPLEMENTED)
```

Likewise, you can set properties of the population:

```
populationSize: Number (100), - Number of chromosomes per population
cullPercentage: Number (10), - What percentage of low performers to kill each generation
minimizeFitness: Boolean (false) - Is lower fitness better?
```

To run a mimimizing experienment (where target fitness is 0, set `minimizeFitness` to true). 

### Discussion

Species provides the framework for running evolutionary computation problems. This means it is concerned only with the generational aspects of a simulation rather than any knowledge of the data. Many people re-invent these complex interactions for each experiment, leading to code that is bloated and not reusable. Species decouples the experimentation from the framework, allowing you to focus on the interactions between your chromosomes.

Each EA is slightly different. Species currently follows a method which calcuates fitnesses, culls low performers, fills population by breeding then mutates at random:

```
self.population.incrementGeneration();
return self.population.calculateFitness(fitnessFunc)
  .then(cull)
  .then(breed)
  .then(mutate)
  .then(runLoop);
});
```
The selection method for breeding is purely random, and each child which is created is instantly fed back into the pool for potential parents. 

### Development/Contributing

There is still a lot to do, but it works as a proof of concept. More probability flags are needed to tweak experiements, along with different selection methods for breeding.

There are also significant performance issues in the current implementation. However, a trivial string matching example is able to run at about 500 generations per second in a node environment (but significantly less in the browser) on my "Intel® Core™ i7-3517U CPU @ 1.90GHz × 4" which is not an especially powerful machine.

`npm test`

Please keep coverage at 100%
