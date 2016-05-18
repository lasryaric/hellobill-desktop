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
        return oneRunner.gotoAsync('https://espaceclientv3.orange.fr/?cont=ECO');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('.liens_contrat[href*="factures-accueil"]')
      })
      .then(() => {
        return oneRunner.getAttributeAsync('.liens_contrat[href*="factures-accueil"]', 'href');
      })
      .each((href) => {
        return oneRunner.gotoAsync(href)
        .then(() => {
          return oneRunner.gotoAsync('https://espaceclientv3.orange.fr/?page=factures-historique')
        })
        .then(() => {
          return oneRunner.waitForDownloadAsync('orange', date);
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
      const loginURL = 'https://espaceclientv3.orange.fr/?cont=ECO';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#AuthentForm',
            ok:'#bntAccueil',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#default_f_credential', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#default_f_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#default_f_memorize_password_csCheckbox')
          })
          .then(() => {
            return oneRunner.clickAsync('#default_f_memorize_password');
          })
          .then(() => {
            return oneRunner.clickAsync('#AuthentForm input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'#default_password_error[style=""]',
              ok:'#bntAccueil'
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
