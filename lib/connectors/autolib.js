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
          return oneRunner.clientSideFunctionAsync('autolib',{date:date.format("YYYY-MM")},'goUrl')
          .then((url) => {
            return oneRunner.gotoAsync(url)
          })
          .then(() => {
            return oneRunner.waitForCssAsync({invoice:'table.table-bills'})
          })
          .then(() => {
            return oneRunner.waitForDownloadAsync('autolib',date)
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
      .gotoAsync('https://www.autolib.eu/account/home/')
      .then(() => {
        return oneRunner.waitForCssAsync({tab:'h3.authenticated',login:'a[href*="/account/login/"]'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.clickAsync('a[href*="/account/login/"]')
          .then(() => {
            return oneRunner.waitForCssAsync({user:'#id_username'})
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(1000);
          })
          .then(() => {
            return oneRunner.clickAsync('#id_username', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#id_username', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#id_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input[type="submit"]')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'h3.authenticated', loginError:'div.form-global-error'}, {});
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
