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
        return oneRunner.gotoAsync('https://store.salesforce.com/apex/customerinvoicelist')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'a.paginate_button'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('salesforce',{date:date.format("YYYY-MM")},'getInvoicesURLS')
        .each((url) => {
          return oneRunner.gotoAsync(url)
          .then(() => {
            return oneRunner.clientSideFunctionAsync('salesforce',{},'gourl')
          })
          .then((url) => {
            return oneRunner.gotoAsync(url)
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
      .gotoAsync('https://login.salesforce.com/')
      .then(() => {
        return oneRunner.elementExistsAsync('span.icon-settings-bolt')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#rememberUn')
          })
          .then(() => {
            return oneRunner.clickAsync('input#Login')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'span.icon-settings-bolt', loginError:'div.loginError[style*="display: block;"]'}, {two:'input[value="Verify"][id="save"]'});
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
