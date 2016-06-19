'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const regStr = moment(date, "YYYY-MM").format("MM/YYYY");
  const allElements = document.querySelectorAll('div[id*="secondsFact"]');
  const okElements = _.filter(allElements, function(elem) {
    const element = elem.querySelector('.left');
    if (element === undefined || element === null) {
      return false;
    }
    const dateText = element.textContent;
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  const a = okElements[offset].querySelector('a.linkBtn').href;
  window.location = a;
}

module.exports = {
 download: download,
}
