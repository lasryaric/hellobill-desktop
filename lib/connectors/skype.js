'use strict';


const bluebird = require('bluebird');


function SkypeConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    bluebird.promisifyAll(oneRunner);

    oneRunner
    .gotoAsync('https://go.skype.com/myaccount')
    .then(() => {
      console.log('skype waiting for page to load', new Date())
      return oneRunner.waitOnCurrentThreadAsync(2000)
    })
    .then(() => {
      console.log('going to check signin', new Date());
      return oneRunner.elementExistsAsync('#signIn')
    })
    .then((elementExists) => {
      if (elementExists.elementExists) {
        return oneRunner.gotoAsync('https://go.skype.com/myaccount')
        .then(() => {
            return oneRunner.typeTextAsync('#username', credentials.username)
        })
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

      return null;
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
  }

  bluebird.promisifyAll(this);

}


module.exports = SkypeConnector;
