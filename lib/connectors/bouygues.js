'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const url = 'https://www.bouyguestelecom.fr/parcours/mes-factures?mois='+date.format('YYYYMM');

        return oneRunner.gotoAsync(url)
      })
      .then(() => {
        return oneRunner
        .waitForDownloadAsync('bouygues', date);
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
      .gotoAsync('http://www.bouyguestelecom.fr/mon-compte/')
      .then(() => {
        return oneRunner.waitForCssAsync({login:'#log_data', ok:'a[href="/mon-compte/mes-factures"]'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#bt_valider')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
          .then(() => {
            return oneRunner.waitForCssAsync({login:'#log_data', billing:'a[href="/mon-compte/mes-factures"]'})
          })
          .then((ex) => {
            if (ex.ex.login) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Bouygues Telecom');
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
