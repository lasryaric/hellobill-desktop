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
        return pageReady(oneRunner);
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('sfr', date);
      })
      .then(resolve)
      .catch(reject)

    });
  }
}

function pageReady(oneRunner) {
  return new bluebird.Promise((resolve, reject) => {
    return oneRunner.elementExistsAsync('a[id="lien plus de factures"]')
    .then((ex) => {
      if (ex.elementExists) {
        return oneRunner.clickAsync('a[id="lien plus de factures"]')
        .then(() => {
          return oneRunner.waitOnCurrentThreadAsync(300);
        })
        .then(() => {
          return pageReady(oneRunner);
        })
      }
    }).then(() => {
      resolve();
    })
    .catch(reject);
  })
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = "https://espace-client.sfr.fr/facture-mobile/";

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner
        .waitForCssAsync({
          ok:'.scInfosPerso',
          notok:'#username',
        })
      })
      .then((ex) => {
        if (ex.ex.notok) {
          return oneRunner.typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#loginForm [type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          login:'#error-panel',
          ok:'.scInfosPerso',
        }, null)
      })
      .then((ex) => {
        if (ex.ex.login) {
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
