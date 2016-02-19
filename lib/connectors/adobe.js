'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');

function Connector() {

  this.run = function(date, credentials, oneRunner, callback) {


    oneRunner
    .gotoAsync('https://accounts.adobe.com')
    .then(() => {
      return oneRunner.elementExistsAsync('[data-menu-id="profile"]')
    })
    .then((elementExists) => {
      winston.info('elementExists? : ', elementExists)
      if (!elementExists.elementExists) {
        return oneRunner
        .typeTextAsync('#adobeid_username', credentials.username)
        .then(() => {
          return oneRunner.typeTextAsync('#adobeid_password', credentials.password)
        })
        .then(() => {
          return oneRunner.waitOnCurrentThreadAsync(100)
        })
        .then(() => {
          return oneRunner.clickAndWaitForPageAsync('#sign_in')
        })
      }
    })
    .then(() => {
      return oneRunner.gotoAsync('https://accounts.adobe.com/orders')
    })
    .then(() => {
      return oneRunner.waitOnCurrentThreadAsync(3000)
    })
    .then(() => {
      return oneRunner.elementExistsAsync('#adobeid_username')
    })
    .then((elementExists) => {
      if(elementExists.elementExists) {
          return oneRunner
          .typeTextAsync('#adobeid_password', credentials.password)
          .then(() => {
            return oneRunner.typeTextAsync('#adobeid_password', credentials.password)
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(100)
          })
          .then(() => {
            return oneRunner.clickAndWaitForPageAsync('#sign_in')
          })
          .then(() => {
            winston.info('wait for page now!')
            return oneRunner.waitForPageAsync();
          })
      }
    })
    .then(() => {
      return oneRunner.elementExistsAsync("[ng-show='ims.isUserSignedIn']")
    })
    .then((ex) => {
      if (ex.elementExists === false) {
        throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Adobe');
      }
    })
    .then(() => {
      return oneRunner.waitForCssAsync('.table-order-history tr a')
    })
    .then(() => {
      return oneRunner.getInnerHTMLAsync('.table-order-history tr a')
    })
    .then((orders) => {
      return orders;
    })
    .each((order) => {

      const url = "/orders/"+order;
      return oneRunner
      .gotoAsync(url)
      .then(() => {
          return oneRunner.waitForCssAsync('iframe#billingList')
      })
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(5000)
      })
      .then(() => {
        return oneRunner.getAttributeAsync('iframe#billingList', 'src')
      })
      .then((srcs) => {
        return oneRunner.gotoAsync(srcs[0]);
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('adobe', date);
      })
    })
    .then(() => {
      callback();
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = Connector;
