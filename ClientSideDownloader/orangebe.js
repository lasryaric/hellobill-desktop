'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").locale('fr').format("MMMM").substring(0,3).concat(moment(date, "YYYY-MM").locale('fr').format("[.*]YY"));

  const allElements = document.querySelectorAll('tr.paid.tooltip');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelector('td.date').textContent.toLowerCase();
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done();
    return ;
  }

  var a = okElements[offset].querySelector('a[href*="invoices/pdf/summary"]')

  if (a) {
    a.click();
  } else {
    next();
  }
}

module.exports = {
  download: download
}
