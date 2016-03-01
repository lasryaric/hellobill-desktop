'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    bluebird.promisifyAll(oneRunner);

    return oneRunner
    .gotoAsync('https://riders.uber.com/trips')
    .then(() => {
      return oneRunner.elementExistsAsync('#email');
    })
    .then((ex) => {
      if (ex.elementExists) {
        return oneRunner
        .typeTextAsync('#email', credentials.username)
        .then(() => {
          return oneRunner.typeTextAsync('#password', credentials.password)
        })
        .then(() => {
          return oneRunner.clickAsync('#login-form button[type="submit"]')
        })
        .then(() => {
          return oneRunner.waitForPageAsync();
        })
        .then(() => {
          return oneRunner.elementExistsAsync('#email');
        })
        .then((ex) => {
          if (ex.elementExists) {
            throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Uber');
          }
        })
      }
    })
    .then(() => {
      const url = "https://riders.uber.com/trips?month="+date.format("YYYY-MM");

      return oneRunner.gotoAsync(url);
    })
    .then(() => {
      return oneRunner.elementExistsAsync('.trip-expand__arrow')
    })
    .then((ex) => {
      if (ex.elementExists) {
        //close the first bill which is opened by default
        return oneRunner.clickAsync('.trip-expand__arrow')
        .then(() => {
          //expand them all
          return oneRunner.clickAllAsync('.trip-expand__arrow')
        })
        .then(() => {
          return oneRunner.getAttributeAsync('.trip-expand.trip-expand--completed a[href^="/trip"]', 'href')
        })
        .each((href) => {
          return oneRunner
          .gotoAsync(href)
          .then(() => {
            return oneRunner.waitForCssAsync('#data-invoice-btn-download', true);
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(500);
          })
          .then(() => {
            return oneRunner.waitForDownloadAsync('uber', date);
          })
          .then(() => {
            const url = "https://riders.uber.com/trips?month="+date.format("YYYY-MM");

            return oneRunner
            .gotoAsync(url)
          })
        })
        .then(() => {
          return callback();
        })
      } else {
        callback();
      }
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = GithubConnector;
