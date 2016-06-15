'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoInAppAsync('https://www.payplug.com/portal/#/invoices')
      })
      .then(() => {
        return oneRunner
        .waitForCssAsync({invoice:'tr[ng-repeat="invoice in invoices"]'})
      })
      .then(() => {
        return oneRunner
        .clientSideFunctionAsync('payplug', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      })
      .each((url) => {
        return oneRunner.gotoAsync(url)
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
      const loginURL = 'https://www.payplug.com/portal/login';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#login-email',
            ok:'a[href*="payments"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#login-email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#login-password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok: 'p.form-error', //appears if the credentials are wrong
              ok:'a[href*="payments"]',
            })
          })
          .then((ex) => {
            if (ex.ex.notok) {
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
