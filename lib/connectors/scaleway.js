'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function SentryConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoInAppAsync('https://cloud.scaleway.com/#/billing')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({tr:'tr[ng-repeat*="invoice"]'})
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('scaleway',date)
      })
      .then(resolve)
      .catch(reject)
    })
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://cloud.scaleway.com')
      .then(() => {
        return oneRunner.elementExistsAsync('div.dashboard')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#login-email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#login-password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('button[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'div.dashboard', loginError:'div.has-error'}, {});
      })
      .then((ex) => {
        if (ex.ex.loginError === true) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)

    })
  }
}


exports.billFetcher = SentryConnector;
exports.logMeIn = logMeIn;
