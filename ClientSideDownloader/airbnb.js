'use strict';
const winston = require('winston');

function show() {
  return new Promise((yes,no) => {
    const elements = document.querySelectorAll('a[href*="/reservation/receipt"]');
    const links = window.__hb._.map(elements, (elem) => {
      return elem.href;
    });
    yes(links);
  })
}

function check(data) {
  //date: 2016-01
  const date = data.date;
  return new Promise((yes, no) => {
    const moment = window.__hellobill.utils.moment;
    const Texts = document.querySelector('div.receipt-panel-body-padding div.row.space-3 small')
    var result = null;
    if (Texts) {
      const dateText = Texts.textContent;
      const regStr = moment(date, "YYYY-MM").format("MMMM[.*]YYYY");
      if (!!dateText.match(regStr)) {
        const check = document.querySelector('.panel-body a[href*="vat_invoices"]');
        if (check) {
          result = check.href;
        }
      }
    }
    yes(result);
  })
}

function download(data, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  var date = data.date;

  const okElements = _getLinks(date, "get-legal-invoice")
  if (offset >= okElements.length) {
    done();
    return ;
  }

  window.location = okElements[offset];
}

module.exports = {
  check: check,
  download: download,
  show: show,
}
