'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');


function Connector() {

 this.run = function(date, credentials, oneRunner) {
   return new bluebird.Promise((resolve, reject) => {

     bluebird.promisifyAll(oneRunner);
     const logMe = new logMeIn();


     return logMe
     .run(date, credentials, oneRunner)
     .then(() => {
       return oneRunner.clientSideFunctionAsync('chauffeurprive',{date:date.format("YYYY-MM")}, 'down')
       .each((url) => {
         return oneRunner
         .gotoAsync(url)
         .then(() => {
           return oneRunner.savePageAsPDFAsync(date)
         })
       })
     })
     .then(resolve)
     .catch(reject)

   });
 }
}

function logMeIn() {
 this.run = function(date, credentials, oneRunner) {
   date = null;

   return new bluebird.Promise((resolve, reject) => {
     const loginURL = 'https://app.chauffeur-prive.com/mes_courses';

     return oneRunner
     .gotoAsync(loginURL)
     .then(() => {
       return oneRunner.waitForCssAsync({
         ok:'a.disconnect',
         notok:'#email',
       })
     })
     .then((ex) => {
       if (ex.ex.notok) {
         return oneRunner
         .typeTextAsync('#email', credentials.username)
         .then(() => {
           return oneRunner.typeTextAsync('#password', credentials.password)
         })
         .then(() => {
           return oneRunner.clickAsync('a.cpButton')
         })
       }
     })
     .then(() => {
       return oneRunner.validateLoginAsync({
         login:'input.error',
         ok:'a.disconnect',
       }, {})
     })
     .then((ex) => {
       if (ex.ex.login) {
         throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
       }
     })
     .then(() => {
       resolve();
     })
     .catch(reject);
   })

 }
}


exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
