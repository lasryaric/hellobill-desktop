'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("M/[.*]/YY");
  const allElements = document.querySelectorAll(".b3id-document-line-item.b3-document-line-item");
  const okElements = _.filter(allElements, function(elem) {
    const text = elem.textContent;
    if (text === null) {
      return false;
    }

    return text.match(regStr)
  });
  if (offset >= okElements.length) {
    done();
    return ;
  }
  var a = okElements[offset].querySelector('a[href*="payments"]');
  if (a) {
    a.click();
  } else {
    next();
  }
}

module.exports = {
  download: download
}
