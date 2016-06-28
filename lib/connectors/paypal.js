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
        return oneRunner.waitForCssAsync({activity:'#activity .activity-row'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('paypal',{date:date.format("YYYY-MM")},'down')
        .each((url) => {
          return oneRunner.gotoAsync(url)
          .then(() => {
            return oneRunner.waitForCssAsync({head:'td.heading h1'})
          })
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date)
          })
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
      const loginURL = 'https://www.paypal.com/businessexp/transactions';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'form[action*="/signin"]',
            ok:'a[href*="/logout"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(1000)
          })
          .then(() => {
            return oneRunner.clickAsync('#btnLogin') //.then(() => { return new Promise(() => {}) })
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          notok: 'p[role="alert"]',
          ok:'a[href*="/logout"]',
        }, null)
      })
      .then((ex) => {
        if (ex.ex.notok) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
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
