'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function FrichtiConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.clientSideFunctionAsync('frichti',{date:date.format("YYYY-MM")},'fetchurl')
        .each((url) => {
          return oneRunner.gotoAsync(url)
          .then(() => {
            return oneRunner.waitForDownloadAsync('frichti',date)
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
      .gotoAsync('http://frichti.co/account')
      .then(() => {

        return oneRunner.elementExistsAsync('a#customer_logout_link')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#customer_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#customer_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"][value="Se connecter"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a#customer_logout_link', loginError:'div.errors:not([style*="display: none"])'}, {});
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


exports.billFetcher = FrichtiConnector;
exports.logMeIn = logMeIn;
