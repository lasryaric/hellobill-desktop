'use strict';

function getiframe() {
  return new Promise((yes,no) => {
    yes(document.querySelector('iframe').src);
  })
}

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("YYYY-MM");

  const allElements = document.querySelectorAll('table.payments_table tr');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelector('td')
    if (dateText === null) {
      return false;
    }
    const intext = dateText.textContent;
    if (intext === null) {
      return false;
    }

    return intext.match(regStr)
  });
  if (offset >= okElements.length) {
    done();
    return ;
  }

  var a = okElements[offset].querySelector('a[href*="invoice_id"]')

  if (a) {
    a.click();
  } else {
    next();
  }
}

module.exports = {
  download: download,
  getiframe: getiframe,
}
