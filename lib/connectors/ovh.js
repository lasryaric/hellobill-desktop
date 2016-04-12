'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const url = require('url');


function Connector() {
  const facebookURLDateFormat = 'YYYY-MM-DD';

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.waitForCssAsync('a[href="#/billing/history"]')
      })
      .then(() => {
        return oneRunner.clickAsync('a[href="#/billing/history"]');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('.billing-table tbody.data-body tr')
      })
      .then(() => {
        return oneRunner
        .waitForDownloadAsync('ovh', date);
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
      .gotoAsync('https://www.ovh.com/cgi-bin/gotomanager.cgi')
      .then(() => {
        return oneRunner.waitForCssAsync({login:'input[type="password"]', ok:'.wreckme.pull-left'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .typeTextAsync('input[placeholder="Account ID"]', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('input[type="password"]', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('form button[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
          .then(() => {
            return oneRunner.waitForCssAsync({login:'input[type="password"]', ok:'.wreckme.pull-left'})
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
