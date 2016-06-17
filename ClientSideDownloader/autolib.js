'use strict';

function goUrl(data) {
  return new Promise((yes,no) => {
    const date = data.date;
    const start = moment(date,"YYYY-MM").startOf('month').format("YYYY-MM-DD");
    const end = moment(date,"YYYY-MM").endOf('month').format("YYYY-MM-DD");
    const link = "https://www.autolib.eu/account/bills/?start="+start+"&end="+end;
    yes(link);
  })
}

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const allElements = document.querySelectorAll('table.table-bills tbody tr');
  if (offset >= allElements.length) {
    done()
    return ;
  }
  const a = allElements[offset].querySelector('a').href;
  window.location = a;
}

module.exports = {
 download: download,
 goUrl: goUrl,
}
