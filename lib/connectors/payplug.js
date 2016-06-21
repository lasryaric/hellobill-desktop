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
        return oneRunner.waitForCssAsync({table:'tr[ng-repeat="invoice in invoices"]'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('payplug',{date:date.format("YYYY-MM")},'getInvoicesURLS')
        .each((url) => {
          return oneRunner.gotoAsync(url)
          .then(() => {
            return oneRunner.waitForCssAsync({invoice:'div#invoice-header'})
          })
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date)
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
      .gotoAsync('https://www.payplug.com/portal/#/invoices')
      .then(() => {
        return oneRunner.waitForCssAsync({ok:'table.invoices-list',login:'form#loginForm'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#login-email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#login-password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"][value="Login"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'table.invoices-list', loginError:'div.has-error'}, {});
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
