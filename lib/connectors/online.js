'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.waitForCssAsync('tr th')
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('online', date);
      })
      .then(resolve)
      .catch(reject)

    });
  }
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = 'https://console.online.net/fr/bill/list';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#username',
            ok:'#usermenubtnphone',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .waitForCssAsync('#username')
          .then(() => {
            return oneRunner.typeTextAsync('#username', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"][name="_submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          login:'.alert-error',
          ok:'#usermenubtnphone',
        }, {})
      })
      .then((ex) => {
        if (ex.ex.login) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(() => {
        resolve();
      })
      .catch(reject);
    })

  }
}


exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
