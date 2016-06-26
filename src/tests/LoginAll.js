'use strict';

const bluebird = require('bluebird');
const TestCredentials = require(__dirname+'/../../lib/TestCredentials');
var uuid = require('node-uuid');

var results = {};

const mUserMe = {
  _id:'testUser1',
  email:'aric@hellobill.io',
}

var credentials = [
  // {
  //   _id:'github_1',
  //   name: 'github',
  //   credentials:{password:'Jo31pal00!!!', username:'lasry.aric@gmail.com'}
  // },
  {
    _id:'adobe_1',
    name: 'adobe',
    credentials:{password:'Jo31pal0!?!', username:'aric@tilden.io'}
  },
  {
    _id:'adwords_1',
    name: 'adwords',
    credentials:{password:'Jo31pal00!!!', username:'accounting@hellobill.io'}
  },
];

function testAll(mUserMe, models) {
  bluebird.each(models, (model) => {
    model._id = 'test_credentials_randomized_'+uuid.v4();
    console.log('============ Working on:', model)
    return TestCredentials(mUserMe, model)
    .then(() => {
      results[model.name] ='ok';
      console.log('Ok testing:', model._id)
    })
    .catch((err) => {
      results[model.name] ='NOT OK!!!';
      console.log('error testing ', model._id)
    })
  })
  .catch((err) => {
    console.log('error testing credentials:', err)
  })
  .then(() => {
    console.log('done all', results)
  })
}

function runTests() {
  return testAll(mUserMe, credentials);
}

module.exports = {
  runTests: runTests
};
