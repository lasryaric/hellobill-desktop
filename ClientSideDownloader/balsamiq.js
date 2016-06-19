'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  if (offset == 1) {
    done()
    return ;
  }
  document.querySelector('a[href*="/transaction/downloadTransactionPdf/"]').click();
}

function getInvoicesURLS(data) {
  //date: 2016-01
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('a[href*="/transaction"]');
  const regStr = moment(date, "YYYY-MM").format("MMM[.*]YYYY");
  return new Promise((yes,no) => {
    const okElements = _.filter(elements, (elem) => {
      const dateText = elem.textContent;
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });
    const links = window.__hb._.map(okElements, (order) => {
      return order.href;
    });
    yes(links)
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
  download: download,
}
