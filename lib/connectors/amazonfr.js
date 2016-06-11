'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {
      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();

      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const billsURL = 'https://www.amazon.fr/gp/your-account/order-history?ie=UTF8&digitalOrders=1&opt=ab&orderFilter=year-'+date.format('YYYY')+'&returnTo=&unifiedOrders=1&';
        return oneRunner.gotoAsync(billsURL)
      })
      .then(() => {
        return downloadPDFS(date, oneRunner)
      })
      .then(resolve)
      .catch(reject)
    });
  }

  function downloadPDFS(date, oneRunner) {

    return new Promise((yes, no) => {
      const startURL = oneRunner.getURL();

      return oneRunner
      .clientSideFunctionAsync('amazonfr', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      .then((receipteURLS) => {
        return bluebird.each(receipteURLS, (urlReceipt) => {
          return oneRunner.gotoAsync(urlReceipt)
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date);
          })
        })
        .then(() => {
          return oneRunner.gotoAsync(startURL);
        })
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('amazonfr', date);
      })
      .catch(no)
      .then(() => {
        return oneRunner.gotoAsync(startURL)
      })
      .then(() => {
        return oneRunner
        .waitForCssAsync({'body':'body', 'paginationBox':'.a-pagination', 'next':'.a-pagination .a-last', 'nextDisabled':'.a-pagination .a-disabled.a-last'})
      })
      .then((ex) => {
        //pagination model: if we have next pages available, we click next and
        //call the current function recurisively.
        //if you struggle understanding the logic: aric@hellobill.io :)
        if (!ex.ex.paginationBox) {
          yes();
        }
        else if (ex.ex.nextDisabled) {
          yes();
        } else {
          return oneRunner
          .clickAsync('.a-pagination .a-last a')
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
          .then(() => {
            return downloadPDFS(date, oneRunner);
          })
          .then(yes)
        }
      })

    })
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://www.amazon.fr/gp/css/order-history/ref=nav_youraccount_orders')
      .then(() => {
        // return oneRunner.waitOnCurrentThreadAsync(660000);
      })
      .then(() => {

        return oneRunner.waitForCssAsync({signin:'form[name="signIn"]', ok:'#nav-link-yourAccount'})
      })
      .then((ex) => {
        if (ex.ex.signin) {
          return oneRunner.typeTextAsync('#ap_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#ap_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#signInSubmit')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.waitForCssAsync({error:'#message_error', ok:'#nav-link-yourAccount'});
      })
      .then((ex) => {
        if (true === ex.ex.error) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)
    })
  }
}

exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
