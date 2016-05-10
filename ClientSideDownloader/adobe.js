'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;

  const regStr = moment(date, "YYYY-MM").format("MMM [.*,] YYYY");


  const allElements = document.querySelectorAll("[name='billingListItem1']");
  const okElements = _.filter(allElements, function(elem) {
    const dateText = elem.querySelector('.billingDate').textContent;
    if (dateText === null) {
      return false;
    }

    return dateText.match(regStr)
  });
  if (offset >= okElements.length) {
    done()
    return ;
  }

  const a = okElements[offset].querySelector('.billingDocActions a');

  const urlToDownload = a.href.replace('.html', '.pdf');

  window.location = urlToDownload;
}

module.exports = {
  download: download
}
