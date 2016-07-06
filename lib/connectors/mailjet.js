'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {
      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();

      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.waitForCssAsync({tab:'td[aria-describedby*="paid_at"]'})
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('mailjet',date)
      })
      .then(resolve)
      .catch(reject)
    });
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://app.mailjet.com/account/billing')
      .then(() => {
        return oneRunner.waitForCssAsync({signin:'form.form-register', ok:'span[class="username-first-letter"]'})
      })
      .then((ex) => {
        if (ex.ex.signin) {
          return oneRunner.typeTextAsync('#login', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({error:'img[alt="warning"]', ok:'span[class="username-first-letter"]'}, {});
      })
      .then((ex) => {
        if (true === ex.ex.error) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)
    })
  }
}

exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
