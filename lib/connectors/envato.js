'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner
        .gotoAsync('http://themeforest.net/user/'+credentials.username.toLowerCase()+'/statement?range=last_year&marketplace=&search_type=range')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'table#stored_statement'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('envato', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      })
      .each((url) => {
        return oneRunner
        .gotoAsync(url)
        .then(() => {
          return oneRunner.savePageAsPDFAsync(date)
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
      .gotoAsync('https://account.envato.com/sign_in?to=themeforest')
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(5000)
      })
      .then(() => {
        return oneRunner.elementExistsAsync('a#sign-out-button')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#user_username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#user_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a#sign-out-button', loginError:'div.error-box'}, {});
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


exports.billFetcher = GithubConnector;
exports.logMeIn = logMeIn;
