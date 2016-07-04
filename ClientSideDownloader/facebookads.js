'use strict';


function getInvoicesURLS() {
  return new Promise((yes,no) => {
    const trans = document.querySelectorAll('a[href*="billing/transaction_details/"]');
    const urls = window.__hb._.map(trans, (link) => {
      return link.href;
    });
    yes(urls)
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
}
