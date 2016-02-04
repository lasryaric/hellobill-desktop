const bluebird = require('bluebird');
const mainRunner = require('../../BrowserAutomation');

function Connector(bw) {

  this.run = function(date, callback) {
    const oneRunner = new mainRunner(bw, "adobe");
    bluebird.promisifyAll(oneRunner);

    oneRunner
    .gotoAsync('https://accounts.adobe.com')
    .then(() => {
      return oneRunner.elementExistsAsync('[data-menu-id="profile"]')
    })
    .then((elementExists) => {
      console.log('elementExists? : ', elementExists)
      if (!elementExists.elementExists) {
        return oneRunner
        .typeTextAsync('#adobeid_username', 'aric@tilden.io')
        .then(() => {
          return oneRunner.typeTextAsync('#adobeid_password', 'Jo31pal0!?!')
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
          .typeTextAsync('#adobeid_password', 'Jo31pal0!?!')
          .then(() => {
            return oneRunner.typeTextAsync('#adobeid_password', 'Jo31pal0!?!')
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
      return oneRunner.waitForPageAsync();
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
      var fileNb = 1;
      const url = "/orders/"+order;
      return oneRunner
      .gotoAsync(url)
      .then(() => {
          return oneRunner.waitForCssAsync('iframe#billingList')
      })
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(3000)
      })
      .then(() => {
        return oneRunner.getAttributeAsync('iframe#billingList', 'src')
      })
      .then((srcs) => {
        return oneRunner.gotoAsync(srcs[0]);
      })
      .then(() => {
        return oneRunner.getAttributeAsync('.billingDocActions a', 'href')
      })
      .then((hrefs) => {
        return hrefs;
      })
      .each((href) => {
        const url = href.replace('.html', '.pdf');
        const fileName = 'adobe-'+date+'-'+fileNb+'.pdf';
        fileNb++;

        return oneRunner.gotoAndWaitForDownloadAsync(url, fileName)
      })
    })
  }

  bluebird.promisifyAll(this);

}


module.exports = Connector;
