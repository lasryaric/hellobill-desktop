'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function SalesforceConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://www.upwork.com/billing-history')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({url:'div.jsAccountingFilterPanel'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('upwork',{date:date.format("YYYY-MM")},'gourl')
      })
      .then((url) => {
        return oneRunner.gotoAsync(url)
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('upwork',date)
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
      .gotoAsync('https://www.upwork.com/login')
      .then(() => {
        return oneRunner.elementExistsAsync('a[href="/e/jobs/"]')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.clickAsync('#login_username')
          .then(() => {
            return oneRunner.typeTextAsync('#login_username', credentials.username)
          })
          .then(() => {
            return oneRunner.clickAsync('#login_password')
          })
          .then(() => {
            return oneRunner.typeTextAsync('#login_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#login_rememberme')
          })
          .then(() => {
            return oneRunner.clientSideFunctionAsync('upwork',{},'loginbut')
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(2000)
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
        return oneRunner.validateLoginAsync({ok:'a[href="/e/jobs/"]', loginError:'div.alert.alert-danger', message:'span[data-ng-controller="clientInterstitial"]'}, {two:'input[value="Verify"][id="save"]'});
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


exports.billFetcher = SalesforceConnector;
exports.logMeIn = logMeIn;
