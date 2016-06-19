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
        return oneRunner.waitForCssAsync({pay:'a[href*="/payments/"]'})
      })
      .then(() => {
        return oneRunner.clickAsync('a[href*="/payments/"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'table.table tr'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('sentry',{date:date.format("YYYY-MM")},'getInvoicesURLS')
        .each((url) => {
          return oneRunner.gotoAsync(url)
          .then(() => {
            return oneRunner.waitForDownloadAsync('sentry',date)
          })
        })
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
      .gotoAsync('https://app.getsentry.com/')
      .then(() => {
        return oneRunner.elementExistsAsync('a[href*="/stats/"]')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#id_username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#id_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('button[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a[href*="/stats/"]', loginError:'div.alert-danger'}, {});
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
