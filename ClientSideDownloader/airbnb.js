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
    const Texts = document.querySelector('div.receipt-panel-body-padding div.row.space-3 small');
    var result = false;
    if (Texts) {
      const dateText = Texts.textContent;
      const regStr = moment(date, "YYYY-MM").locale('fr').format("MMMM[.*]YYYY");
      if (!!dateText.match(regStr)) {
        result = true;
      }
      // if (!!dateText.match(regStr)) {
      //   const check = document.querySelector('.panel-body a[href*="vat_invoices"]');
      //   if (check) {
      //     result = check.href;
      //   }
      // }
    }
    yes(result);
  })
}

function checkfr(data) {
  //date: 2016-01
  const date = data.date;
  return new Promise((yes, no) => {
    const _ = window.__hellobill.utils._;
    const moment = window.__hellobill.utils.moment;
    const regStr = moment(date, "YYYY-MM").locale('fr').format("MMMM[.*]YYYY");
    const elements = document.querySelectorAll('th.receipt-label');
    const okElements = _.filter(elements, (elem) => {
      const dateText = elem.textContent;
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });
    var result = null;
    if (okElements.length > 0) {
      var result = document.querySelector('a[href*="receipt?code"]#print')
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
  checkfr: checkfr,
  download: download,
  show: show,
}
