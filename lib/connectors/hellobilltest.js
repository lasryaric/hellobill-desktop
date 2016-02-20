'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');

function Connector() {

  this.run = function(date, credentials, oneRunner, callback) {


    oneRunner
    .gotoAsync('https://www.producteev.com/workspace')
    .then(() => {
      return oneRunner.waitForPageAsync();
    })
    .then(() => {
      return oneRunner.waitOnCurrentThreadAsync(2000)
    })
    .then(() => {
      return oneRunner.elementExistsAsync('input[name="username"]')
    })
    .then((elementExists) => {

      if (elementExists.elementExists) {

        return oneRunner
        .typeTextAsync('input[name="username"]', credentials.username)
        .then(() => {
          return oneRunner.typeTextAsync('input[name="password"]', credentials.password)
        })
        .then(() => {
          return oneRunner.clickAsync('form.form-signin .btn-success')
        })
        .then(() => {
          return oneRunner.waitForPageAsync();
        })
      }
    })
    .then(() => {
      return oneRunner.elementExistsAsync('div.workspace.standalone')
    })
    .then((ex) => {
      if (!ex.elementExists) {
        throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Hellobill test');
      }
    })
    .then(() => {
      callback();
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = Connector;
