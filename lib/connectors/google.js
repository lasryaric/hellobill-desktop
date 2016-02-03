const bluebird = require('bluebird');
const mainRunner = require('../../BrowserAutomation');

function GoogleConnector(bw) {

  this.run = function(date, callback) {
    const oneRunner = new mainRunner(bw, "google");
    bluebird.promisifyAll(oneRunner);

    oneRunner
    .gotoAsync('https://admin.google.com/')
    .then(() => {
      return oneRunner.typeTextAsync('#Email', 'aric@genus.io')
    })
    .then(() => {
      return oneRunner.clickAsync('#next')
    })
    .then(() => {
      return oneRunner.waitOnCurrentThreadAsync(1000)
    })
    .then(() => {
      return oneRunner.typeTextAsync('#Passwd', 'Jo31pal00!!!')
    })
    .then(() => {
      oneRunner.waitOnCurrentThreadAsync(100)
    })
    .then(() => {
      oneRunner.clickAsync('#signIn')
    })
    .then(() => {
      return oneRunner.waitForPageAsync();
    })
    .then(() => {
      return oneRunner.waitForCssAsync('img[src*="billing"]')
    })
    .then(() => {
      return oneRunner.clickAsync('img[src*="billing"]')
    })
  }

  bluebird.promisifyAll(this);

}


module.exports = GoogleConnector;
