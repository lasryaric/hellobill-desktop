'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');
const sendHTML = require('../htmlSend').htmlSend;

function Connector() {


  this.run = function(date, credentials, oneRunner) {
    const logMe = new logMeIn();

    return new bluebird.Promise((resolve, reject) => {

      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.waitForCssAsync('.table-order-history tr a')
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('adobe',{},'getHTML')
        .then((result) => {
            return sendHTML(result,'adobe')
        })
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
          return oneRunner.waitOnCurrentThreadAsync(2000)
        })
        .then(() => {
          return oneRunner.getAttributeAsync('iframe#billingList', 'src')
        })
        .then((srcs) => {
          return oneRunner.gotoAsync(srcs[0]);
        })
        .then(() => {
          return oneRunner.clientSideFunctionAsync('adobe',{},'getHTML')
          .then((result) => {
              return sendHTML(result,'adobe')
          })
        })
        .then(() => {
          return oneRunner.waitForDownloadAsync('adobe', date);
        })
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
      .gotoAsync('https://accounts.adobe.com/orders')
      .then(() => {
        return oneRunner.waitForCssAsync({signin:'#adobeid_signin', ok:'.table-order-history'})
      })
      .then((ex) => {

        if (true === ex.ex.signin) {
          return oneRunner
          .typeTextAsync('#adobeid_username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#adobeid_password', credentials.password)
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(100)
          })
          .then(() => {
            return oneRunner.clickAsync('#sign_in')
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          passwordTooShort:'label[for="adobeid_password"].error',
          wrongCreds:'.error.backend.rengaerror',
          ok:'.table-order-history',
        }, {})
      })
      .then((ex) => {
        if (true === ex.ex.passwordTooShort || true === ex.ex.wrongCreds) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Adobe');
        }
      })
      .then(resolve)
      .catch(reject)
    });
  }

}

exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
