'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://'+credentials.compname+'.zendesk.com/settings/account#invoices');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('table.payments_table')
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('zendesk', date);
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
      const loginURL = 'https://'+credentials.compname+'.zendesk.com/agent/dashboard';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'body.access-unauthenticated',
            ok:'a.admin',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .clientSideFunctionAsync('zendesk', {}, 'getiframe')
          .then((url) => {
            return oneRunner.gotoAsync(url)
          })
          .then(() => {
            return oneRunner.waitForCssAsync('#user_email')
          })
          .then(() => {
            return oneRunner.typeTextAsync('#user_email', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#user_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#remember_me')
          })
          .then(() => {
            return oneRunner.clickAsync('input[name="commit"][type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'.flash-error',
              ok:'input#return_to',
            })
          })
          .then((ex) => {
            if (ex.ex.login) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
            }
          })
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
