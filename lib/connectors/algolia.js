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
          return oneRunner.gotoAsync('https://www.algolia.com/users/edit')
        })
        .then(() => {
          return oneRunner.waitForCssAsync({inv:'a[href="#tab-invoices"]'})
        })
        .then(() => {
          return oneRunner.clickAsync('a[href="#tab-invoices"]')
        })
        .then(() => {
          return oneRunner.waitForCssAsync({table:'table.table.table-striped.b-t tbody'})
        })
        .then(() => {
          return oneRunner.waitOnCurrentThreadAsync(3000)
        })
        .then(() => {
          return oneRunner.waitForDownloadAsync('algolia',date)
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
      .gotoAsync('https://www.algolia.com/users/sign_in')
      .then(() => {
        return oneRunner.waitForCssAsync({tab:'a[href*="sign_out"]',login:'#user_email'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#user_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#user_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"][value="Login"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'a[href*="sign_out"]', loginError:'div.has-error'}, {});
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
