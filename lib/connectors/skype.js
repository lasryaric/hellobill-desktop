'use strict';


const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');

function SkypeConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    bluebird.promisifyAll(oneRunner);

    oneRunner
    .gotoAsync('https://go.skype.com/myaccount')
    .then(() => {
      return oneRunner.waitOnCurrentThreadAsync(2000)
    })
    .then(() => {
      winston.info('going to check signin', new Date());
      return oneRunner.elementExistsAsync('#signIn')
    })
    .then((elementExists) => {
      if (elementExists.elementExists) {
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
      return oneRunner.elementExistsAsync('.isAuthenticated')
    })
    .then((ex) => {
      if (ex.elementExists === false) {
        throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Skype');
      }
    })
    .then(() => {
      const url = 'https://secure.skype.com/wallet/account/orders?month='+date.format("YYYY-MM");

      return oneRunner.gotoAsync(url)
    })
    .then(() => {
      return oneRunner.waitForDownloadAsync('skype', date);
    })
    .then(() => {
      callback();
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = SkypeConnector;
