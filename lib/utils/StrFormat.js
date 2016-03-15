'use strict';
const _ = require('lodash')

function hashMapToString(hash) {
  const arr = [];

  for (var k in hash) {
      arr.push(k+'='+hash[k]);
  }
  arr.sort();

  return arr.join(', ');
}

exports.hashMapToString = hashMapToString;
