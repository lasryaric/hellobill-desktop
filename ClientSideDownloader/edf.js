'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  //debugger;
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("MM/YYYY");

  const allElements = document.querySelectorAll('.factures tbody tr');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelector('td a[href*="getFacturePDF"]').textContent;
    if (dateText === null) {
      return false;
    }

    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done();
    return ;
  }

  window.location = okElements[offset].querySelector('td a[href*="getFacturePDF"]').href;
}

module.exports = {
  download: download
}
