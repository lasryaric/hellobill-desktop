'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('tr');
  const regStr = moment(date, "YYYY-MM").locale('fr').format("MMMM YYYY");
  const okElements = _.filter(elements, (elem) => {
    const dateText = elem.textContent;
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  okElements[offset].querySelector('a[href*="invoice_as_pdf"].button').click();
}

module.exports = {
  download: download,
}
