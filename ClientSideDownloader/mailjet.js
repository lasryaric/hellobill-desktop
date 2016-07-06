'use strict';

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  const moment = window.__hellobill.utils.moment;
  const dateRegStr = moment(date, "YYYY-MM").format("MMM[.*]YYYY").toLowerCase();
  const orders = document.querySelectorAll('tr[role="row"]');
  const okOrders = window.__hb._.filter(orders, (order) => {
    const dateDomElement = order.querySelector('td[aria-describedby*="paid_at"]');
    if (!dateDomElement || !dateDomElement.textContent) {
      return false;
    }
    return !!dateDomElement.textContent.match(dateRegStr);
  })

  const links = window.__hb._.map(okOrders, (order) => {
    const link = order.querySelector('a[href*="/pdf/invoice/"]');
    return link.href;
  });

  if (offset >= links.length) {
    done();
    return ;
  }
  window.location = links[offset];
}

module.exports = {
 download: download
}
