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
        return oneRunner.clientSideFunctionAsync('zapier',{date:date.format("YYYY-MM")},'getInvoicesURLS')
      })
      .each((url) => {
        return oneRunner.gotoAsync(url)
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
      .gotoAsync('https://zapier.com/app/settings/invoices')
      .then(() => {
        return oneRunner.elementExistsAsync('div.container.invoices')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(4000)
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'div.container.invoices', loginError:'#email'}, {'twostep': 'form[action="/sessions/two-factor"]'});
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
