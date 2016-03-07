'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    bluebird.promisifyAll(oneRunner);


    oneRunner
    .gotoAsync('https://console.aws.amazon.com/billing/home?nc2=h_m_bc')
    .then(() => {

      return oneRunner.elementExistsAsync('#ap_signin_form')
    })
    .then((elementExists) => {
      winston.info('elementExists? : ', elementExists)
      if (elementExists.elementExists) {
        return oneRunner.typeTextAsync('#ap_email', credentials.username)
        .then(() => {
          return oneRunner.typeTextAsync('#ap_password', credentials.password)
        })
        .then(() => {
          return oneRunner.clickAsync('#signInSubmit-input')
        })
        .then(() => {
          return oneRunner.waitForPageAsync();
        })
      }
    })
    .then(() => {
      const month = date.format('MM');
      const year = date.format('YYYY');

      return oneRunner.gotoInAppAsync('https://console.aws.amazon.com/billing/home?nc2=h_m_bc#/bill?year='+year+'&month='+month);
    })
    .then(() => {
      return oneRunner.waitForCssAsync('.view-invoices-link', true);
    })
    .then((elementExists) => {
      console.log('aws elementExists?', elementExists)
      if (elementExists.elementExists) {
        return oneRunner.waitForDownloadAsync('awsmain', date);
      } else {
        console.log('we dont have any bill for awsmain date:', date);
      }
    })
    .then(() => {
      callback();
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = GithubConnector;
