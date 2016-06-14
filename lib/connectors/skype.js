'use strict';


const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');

function SkypeConnector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {


      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const url = 'https://secure.skype.com/wallet/account/orders?month='+date.format("YYYY-MM");

        return oneRunner.gotoAsync(url)
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('skype', date);
      })
      .then(() => {
        return resolve();
      })
      .catch(reject)
    })
  }
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      oneRunner
      .gotoAsync('https://go.skype.com/myaccount')

      .then(() => {
        return oneRunner.waitForCssAsync({signin:'#signIn', myaccount:'.isAuthenticated'})
      })
      .then((ex) => {
        if (ex.ex.signin === true) {
          return oneRunner.typeTextAsync('#username', credentials.username)

          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('label[for="persistent"]')
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(500)
          })
          .then(() => {
            return oneRunner.clickAndWaitForPageAsync('#signIn');
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({signin:'#signIn', myaccount:'.isAuthenticated'}, null)
      })
      .then((ex) => {
        if (ex.signin) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Skype');
        }
      })
      .then(() => {
        return resolve();
      })
      .catch(reject)
    })

  }
}


exports.billFetcher = SkypeConnector;
exports.logMeIn = logMeIn;
