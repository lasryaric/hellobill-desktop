'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const moment = window.__hellobill.utils.moment;
  const dateRegStr = moment(date, "YYYY-MM").locale("fr").format("MMMM YYYY").toLowerCase();
  const orders = document.querySelectorAll('div[ng-if*="tab.invoices"]');
  const okOrders = window.__hb._.filter(orders, (order) => {
    const dateDomElement = order.querySelector('div[ng-bind="invoice.period_end"]');
    if (!dateDomElement || !dateDomElement.textContent) {
      return false;
    }
    return !!dateDomElement.textContent.match(dateRegStr);
  })

  const links = window.__hb._.map(okOrders, (order) => {
    const link = order.querySelector('a');
    return link.href;
  });

  if (offset >= links.length) {
    done();
    return ;
  }
  window.location = links[offset];
}

module.exports = {
 download: download,
}
