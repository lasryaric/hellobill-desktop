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
        return oneRunner
        .clientSideFunctionAsync('gandi', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      })
      .each((url) => {
        console.log('working on url*******:', url)
          const originalURL = oneRunner.getURL();

          return oneRunner
          .gotoAsync(url)
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date);
          })
          .then(() => {
            return oneRunner.gotoAsync(originalURL);
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
      .gotoAsync('https://www.gandi.net/admin/billing/invoices?filter.~invoice_num=&filter.%3Edate=&filter.%3Cdate=&perpage=500&page=0')
      .then(() => {
        return oneRunner.waitForCssAsync({login:'#loginform', ok:'#bills_list_form'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .typeTextAsync('#logintext', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#passwordtext', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#loginform input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({login:'#loginform', billing:'#bills_list_form'}, {})
      })
      .then((ex) => {
        if (ex.ex.login) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Gandi');
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
