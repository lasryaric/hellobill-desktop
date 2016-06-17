'use strict';

function getInvoicesURLS(data) {
  var date = data.date;
  return new Promise((yes, no) => {

    const moment = window.__hellobill.utils.moment;
    const dateRegStr = moment(date, "YYYY-MM").format("MMMM").substring(0,3).concat(moment(date, "YYYY-MM").format("[.*]YYYY"));
    const orders = document.querySelectorAll('table.table tr');
    const okOrders = window.__hb._.filter(orders, (order) => {
      const element = order.querySelectorAll('a')[0];
      if (element === undefined || element === null) {
        return false;
      }
      return !!element.textContent.match(dateRegStr);
    })
    const links = window.__hb._.map(okOrders, (order) => {
      const link = order.querySelectorAll('a')[0];
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
  document.querySelector('a[href*="/pdf/"]').click();
}

module.exports = {
  download: download,
  getInvoicesURLS: getInvoicesURLS,
}
