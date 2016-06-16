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
        return oneRunner.waitForCssAsync({table:'div.summary-facture'})
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync("directenergie",date)
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
      .gotoAsync('https://clients.direct-energie.com/mes-factures/ma-facture/')
      .then(() => {
        return oneRunner.elementExistsAsync('div.summary-facture')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#tx_deauthentification_login', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#tx_deauthentification_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#tx_deauthentification_mdp_mem')
          })
          .then(() => {
            return oneRunner.clickAsync('#tx_deauthentification_mdp_oublie')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'div.summary-facture', loginError:'div.alerte:not([style*="display:none"])'}, {});
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
