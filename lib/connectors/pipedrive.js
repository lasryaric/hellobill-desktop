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
        return oneRunner
        .waitForDownloadAsync('pipedrive',date)
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
      const loginURL = 'https://alumneye.pipedrive.com/settings/billing/invoices';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#login_form',
            ok:'.userInfo',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#login', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#remember')
          })
          .then(() => {
            return oneRunner.clickAsync('.submit-button.id--login') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok: '.input-error',
              ok:'.userInfo',
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
