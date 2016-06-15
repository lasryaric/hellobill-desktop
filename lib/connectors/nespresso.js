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
        return oneRunner.gotoAsync('https://www.nespresso.com/us/en/myaccount/orders/changeList?number=15');
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('nespresso', {date:date.format("YYYY-MM")}, 'down')
      })
      .each((url) => {
        return oneRunner
        .gotoAsync(url)
        .then(() => {
          return oneRunner.clientSideFunctionAsync('nespresso', {}, 'change')
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
      const loginURL = 'https://www.nespresso.com/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'a.user-menu-trigger',
            ok:'#customer-name div[data-ng-show="userLogged"]:not([class*="display-none"])',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.clickAsync('a.user-menu-trigger')
          .then(() => {
            return oneRunner.typeTextAsync('#ta-header-username', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#ta-header-password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('div.user-login-submit button')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'label.error-message',
              ok:'#customer-name div[data-ng-show="userLogged"]:not([class*="display-none"])',
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
