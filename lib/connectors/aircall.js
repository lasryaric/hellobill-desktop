'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {
      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();

      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://dashboard-v2.aircall.io/company')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({tab:'div[ng-if*="tab.invoices"]'})
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('aircall',date)
      })
      .then(resolve)
      .catch(reject)
    });
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://dashboard.aircall.io/login')
      .then(() => {
        return oneRunner.waitForCssAsync({signin:'form[action="/users/sign_in"]', ok:'a[ng-click="home.logout()"]'})
      })
      .then((ex) => {
        if (ex.ex.signin) {
          return oneRunner.typeTextAsync('#user_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#user_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('button[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({error:'span.flash-message.error', ok:'a[ng-click="home.logout()"]'}, {});
      })
      .then((ex) => {
        if (true === ex.ex.error) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)
    })
  }
}

exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
