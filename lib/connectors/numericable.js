'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');
const axios = require('axios')


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
        .then(() => {
          return oneRunner.gotoAsync('https://moncompte.numericable.fr/pages/billing/Invoice.aspx')
          .then(() => {
            return oneRunner.waitForCssAsync({invoice:'#firstFact'})
          })
          .then(() => {
            return oneRunner.waitForDownloadAsync('numericable',date)
          })
        })
      .then(resolve)
      .catch(reject)
    })
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('http://offres.numericable.fr/')
      .then(() => {
        return oneRunner.clickAsync('a[href*="moncompte.numericable.fr"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({tab:'#serviceTab_abo',login:'input[name="login"]'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('input[name="login"]', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('input[name="pwd"]', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'#serviceTab_abo', loginError:'label[class="error"]'}, {});
      })
      .then((ex) => {
        if (ex.ex.loginError === true) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)

    })
  }
}


exports.billFetcher = GithubConnector;
exports.logMeIn = logMeIn;
