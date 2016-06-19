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
        return oneRunner.waitForCssAsync({dropdown:'a[href="/info"]'})
      })
      .then(() => {
        return oneRunner.clickAsync('a[href="/info"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({payment:'a[href="/payment"]'})
      })
      .then(() => {
        return oneRunner.clickAsync('a[href="/payment"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({invoice:'a[href*="/transaction"]'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('balsamiq', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
        .each((url) => {
          return oneRunner
          .gotoAsync(url)
          .then(() => {
            return oneRunner.waitForDownloadAsync('balsamiq',date)
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
      .gotoAsync('https://www.mybalsamiq.com/login')
      .then(() => {

        return oneRunner.elementExistsAsync('a[href*="signout"]')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('input[name="username"]', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('input[name="password"]', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#rememberMe')
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync()
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a[href*="signout"]', loginError:'div#notification[style="left: 453.5px; opacity: 50; top: 0px; display: block;"]'}, {})
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
