'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("MM/YYYY");
  const allElements = document.querySelectorAll('div#historyBlock tr');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.textContent
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });

  if (offset >= okElements.length) {
    done();
    return ;
  }

  window.location = okElements[offset].querySelector('a[href*="file.sellsy.co"]').href;
}

module.exports = {
  download: download,
}
