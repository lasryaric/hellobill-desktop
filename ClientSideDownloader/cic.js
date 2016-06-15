'use strict';

function gurl() {
  return new Promise((yes,no) => {
    yes(document.querySelector('#table2 li:not([class*="sel"]) a[href*="MMU2_LstDoc"]').href)
  })
}

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const range = window.__hellobill.utils.range;
  const elements = document.querySelectorAll('td[width="90%"] tr');
  const start = moment("20/".concat(moment(date, "YYYY-MM").format("MM/YYYY")),"DD/MM/YYYY");
  const end = moment("10/".concat(moment(date, "YYYY-MM").add('1','months').format("MM/YYYY")),"DD/MM/YYYY");
  console.log(start,end)
  const interval = moment.range(start,end)
  const okElements = _.filter(elements, (elem) => {
    const dats = elem.querySelectorAll('td')[1]
    if (dats === undefined) {
      return false;
    }
    const dateText = dats.textContent;
    if (dateText === null) {
      return false;
    }
    var formatted = moment(dateText,"DD/MM/YYYY")
    console.log(formatted)
    return formatted.within(interval)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }
  okElements[offset].querySelector('a.poppdf').click();
}

module.exports = {
  download: download,
  gurl: gurl,
}
