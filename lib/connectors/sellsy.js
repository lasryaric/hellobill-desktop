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
        return oneRunner.gotoAsync('https://www.sellsy.com/?_f=prefsAccount&action=subscription');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('div#historyBlock tr th')
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('sellsy', date);
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
      const loginURL = 'https://www.sellsy.com/?_f=dashboard&load';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#login_email',
            ok:'.fa-power-off', //logout button
            okoverlapp:'.introjs-overlay', //logged in but notification on screen
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.gotoAsync(loginURL)
          .then(() => {
            return oneRunner.typeTextAsync('#login_email', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#login_pwd', credentials.password)
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(100);
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
          .then(() => {
            return oneRunner.validateLoginAsync({
              login:'.formError',
              ok:'.fa-power-off', //logout button
              okoverlapp:'.introjs-overlay', //logged in but notification on screen
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
