'use strict';

function pageUrls(data) {
  const urls = data.urls;
  return new Promise((yes,no) => {
    console.log("##################")
    console.log(urls)
    yes(urls)
  })
}

function getInvoicesURLS() {
  return new Promise((yes,no) => {
    const elements = document.querySelectorAll('ul[spacing="medium"][direction="vertical"] li');
    const send = window.__hb._.map(elements, (order) => {
      var title = order.querySelectorAll('td')[0].querySelectorAll('div[display="block"][type="inherit"]')[0].textContent;
      console.log("@@@@@@@@@@@@@@@@@@"+title)
      const trans = order.querySelectorAll('a[href*="manager/billing/transaction_details"]');
      const sent = window.__hb._.map(trans, (link) => {
        return link.href;
      });
      return [title,sent];
    });
    yes(send)
  })
}

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;

  const okElements = document.querySelectorAll('a[href*="manage/billing_transaction.php"]');

  if (offset >= okElements.length) {
    done();
    return ;
  }
  if (okElements[offset].className.match('hidden')) {

    done();
  } else {

    okElements[offset].click();
  }
}

module.exports = {
  download: download,
  getInvoicesURLS: getInvoicesURLS,
  pageUrls: pageUrls,
}
