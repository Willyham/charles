'use strict';
var test = require('tape');

var charles = require('../');

test('charles', function t(assert) {
  assert.ok(typeof charles === 'function',
    'exported correctly');

  assert.end();
});
