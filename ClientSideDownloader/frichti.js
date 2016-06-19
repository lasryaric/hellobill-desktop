'use strict';

function fetchurl(data) {
  var date = data.date;

  return new Promise((yes, no) => {

    const moment = window.__hellobill.utils.moment;
    const dateRegStr = moment(date, "YYYY-MM").locale('fr').format("MM/YYYY");
    const orders = document.querySelectorAll('table.table-orders tr');
    const okOrders = window.__hb._.filter(orders, (order) => {
      const element = order.querySelectorAll('td')[1];
      if (element === undefined || element === null) {
        return false;
      }
      return !!element.textContent.match(dateRegStr);
    })
    const links = window.__hb._.map(okOrders, (order) => {
      const link = order.querySelector('a[href*="orders"]');
      return link.href;
    });
    yes(links);
  })
}

function download(date, offset, done, next) {
  //date: 2016-01
  offset = offset || 0;
  if (offset == 1) {
    done()
    return ;
  }
  document.querySelector('div.account-print button').click();
}

module.exports = {
  download: download,
  fetchurl: fetchurl,
}
