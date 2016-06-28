'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://www.dropbox.com/payments');
      })
      .then(() => {
        return oneRunner.waitForCssAsync({bills:'.user-payments table tr.table-row'})
      })
      .then(() => {
        return oneRunner
        .clientSideFunctionAsync('dropbox', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      })
      .each((url) => {
          return oneRunner
          .gotoAsync(url)
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date);
          })
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

      return oneRunner
      .gotoAsync('https://www.dropbox.com')
      .then(() => {
        return oneRunner.waitForCssAsync({login:'.register-form__name-fields', ok:'#header-account-menu'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.clickRealAsync('#sign-in')
          .then(() => {
            return oneRunner.waitForCssAsync({signin:'#sign-in'})
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(1000);
          })
          .then(() => {
              return oneRunner.typeTextAsync('.login-form input[name="login_email"]', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('.login-form input[name="login_password"]', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('.login-form button[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({login:'.error-message', ok:'#header-account-menu'}, {'twostep':'.two-factor-form'})
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
