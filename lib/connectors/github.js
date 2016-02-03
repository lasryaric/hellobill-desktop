const bluebird = require('bluebird');
const mainRunner = require('../../BrowserAutomation');

function GithubConnector(bw) {

  this.run = function(date, callback) {
    const oneRunner = new mainRunner(bw, "github");
    bluebird.promisifyAll(oneRunner);

    oneRunner
    .gotoAsync('https://github.com/')
    .then(() => {
      return oneRunner.elementExistsAsync('body.logged_in')
    })
    .then((elementExists) => {
      console.log('elementExists? : ', elementExists)
      if (!elementExists.elementExists) {
        return oneRunner.clickAsync(".header-actions .btn[href='/login']")
        .then(() => {
          return oneRunner.waitForPageAsync()
        })
        .then(() => {
          return oneRunner.typeTextAsync('#login_field', 'lasry.aric@gmail.com')
        })
        .then(() => {
          return oneRunner.typeTextAsync('#password', 'Jo31pal00!!!')
        })
        .then(() => {
          oneRunner.waitOnCurrentThreadAsync(100)
        })
        .then(() => {
          oneRunner.clickAsync('.auth-form-body input.btn-primary')
        })
        .then(() => {
          return oneRunner.waitForPageAsync();
        })
      }
    })
    .then(() => {
      return oneRunner.gotoAsync('https://github.com/settings/billing')
    })
    .then(() => {
      // return oneRunner.clickAsync('td.receipt a')
      return oneRunner.getInnerHTMLAsync('.org-settings-link')
    })
    .then((organizations) => {
      const pairs = organizations.map((org) => {
        const url = "https://github.com/organizations/"+org+"/settings/billing";

        return { url: url, org: org};
      });
      //urls.push('https://github.com/settings/billing');
      pairs.push({url: 'https://github.com/settings/billing', org:'personal'})

      return pairs;
    })
    .each((pair) => {
      return oneRunner.gotoAsync(pair.url)

      .then(() => {
        console.log('goto url :', pair.url)
      })
      .then(() => {
        const fileName = "github-"+pair.org+"-"+date+".pdf";
        return oneRunner
        .clickDeepAndWaitForDownloadAsync("time[title^='"+date+"']", 2, '.receipt a', fileName)
      })
    })
    .then(() => {
      console.log('after goto url billing');
      // mainWindow.close();
    })
  }

  bluebird.promisifyAll(this);

}


module.exports = GithubConnector;
