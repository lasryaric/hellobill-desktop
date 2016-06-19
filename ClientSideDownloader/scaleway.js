'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const regStr = moment(date, "YYYY-MM").format("MMMM YYYY");
  const allElements = document.querySelectorAll('tr[ng-repeat*="invoice"]');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelector('td[data-title-text="Date"]').textContent;
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  const a = okElements[offset].querySelector('a[ng-href*="/invoices/"]');
  a.click();
}

module.exports = {
  download: download
}
