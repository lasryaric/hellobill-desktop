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
        return oneRunner.waitForCssAsync({dropdown:'li#account_nav .dropdown_trigger'})
      })
      .then(() => {
        return oneRunner.clickAsync('li#account_nav .dropdown_trigger')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({account:'li#account_nav a[href*="accounts"]:not([href*="switch"]):not([href*="products"])'})
      })
      .then(() => {
        return oneRunner.clickAsync('li#account_nav a[href*="accounts"]:not([href*="switch"]):not([href*="products"])')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({invoices:'a[href*="payments"]'})
      })
      .then(() => {
        return oneRunner.clickAsync('a[href*="payments"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'table#payment_transactions'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('newrelic', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
        .each((url) => {
          return oneRunner
          .gotoAsync(url)
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
      .gotoAsync('https://login.newrelic.com/login')
      .then(() => {

        return oneRunner.elementExistsAsync('#account_nav')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#login_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#login_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#login_remember_me')
          })
          .then(() => {
            return oneRunner.clickAsync('#login_submit')
          })
          .then(() => {
            return oneRunner.waitForPageAsync()
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'#account_nav', loginError:'.flash.error'}, {})
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
