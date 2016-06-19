'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('form#form_duplicata div.twelve.columns.balance-box');
  const regStr = moment(date, "YYYY-MM").locale('fr').format("MM/YYYY");
  const okElements = _.filter(elements, (elem) => {
    const text = elem.querySelector('td.date')
    if (text === undefined || text === null) {
      return false;
    }
    const dateText = text.textContent;
    if (dateText === null) {
      return false;
    }
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  okElements[offset].querySelector('td.download a').click();
}

module.exports = {
  download: download,
}
