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
        return oneRunner.gotoAsync('https://account.godaddy.com/orders');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('.orders-container')
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('godaddy', {date:date.format("YYYY-MM")}, 'getlinks')
      })
      .each((url) => {
        return oneRunner
        .gotoAsync(url)
        .then(() => {
          return oneRunner.waitForCssAsync({print:'span.qa-print-action'})
        })
        .then(() => {
          return oneRunner.clientSideFunctionAsync('godaddy', {}, 'replaceprint')
        })
        .then(() => {
          return oneRunner.savePageAsPDFAsync(date)
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
      const loginURL = 'https://sso.godaddy.com/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#username',
            ok:'span.is-logged-in',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#submitBtn')
          })
          .then(() => {
            return oneRunner.validateLoginAsync({
              login:'#errorMessage[style*="display: block"]',
              ok:'span.is-logged-in',
            }, {})
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
