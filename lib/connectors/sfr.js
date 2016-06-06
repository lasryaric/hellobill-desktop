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
        return pageReady();
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('orange', date);
      })
      .then(resolve)
      .catch(reject)

    });
  }
}

function pageReady() {
  return new bluebird.Promise((resolve, reject) => {
    return oneRunner
    .waitForCssAsync({
      more: '#lien\\20 plus\\20 de\\20 factures',
    })
    .then((ex) => {
      if (ex.ex.more) {
        return oneRunner
        .clickAsync('#lien\\20 plus\\20 de\\20 factures')
        .then(() => {
          return pageReady();
        })
      }
    }).then(() => {
      resolve();
    })
    .catch(reject);
  });
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = 'https://espace-client.sfr.fr/facture-mobile/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#loginForm',
            ok:'.scInfosPerso',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#loginForm input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'#error-panel',
              ok:'.scInfosPerso'
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
