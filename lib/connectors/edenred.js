'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');
const axios = require('axios')


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
        .then(() => {
          return oneRunner.clientSideFunctionAsync('edenred',{date:date.format("YYYY-MM")},'getInvoicesURLS')
          .each((url) => {
            return oneRunner.gotoAsync(url)
            .then(() => {
              return oneRunner.clientSideFunctionAsync('edenred',{},'changeInvoice')
              .then(() => {
                return oneRunner.savePageAsPDFAsync(date)
              })
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
      .gotoAsync('https://www.espaceclient.edenred.fr/')
      .then(() => {
        return oneRunner.elementExistsAsync('a[href*="historique-des-commandes"]')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#UserName', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#Password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#RememberMe')
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a[href*="historique-des-commandes"]', loginError:'div.validation-summary-errors'}, {});
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
