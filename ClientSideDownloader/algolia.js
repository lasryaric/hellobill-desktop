'use strict';

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("MMMM").substring(0,3).concat(moment(date, "YYYY-MM").format("[.*]YYYY"));

  const allElements = document.querySelectorAll('table.table.table-striped.b-t tbody tr');
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelectorAll('td')[0].textContent.replace(/\s/g, "");
    if (dateText === null) {
      return false;
    }
    console.log(dateText)
    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done();
    return ;
  }

  var a = okElements[offset].querySelector('a')
  console.log("@@@@@@@@@@@@@@@@@@@@@")
  console.log(a)
  console.log("@@@@@@@@@@@@@@@@@@@@@")
  if (a) {
    a.click();
  } else {
    next();
  }
}

module.exports = {
 download: download,
}
