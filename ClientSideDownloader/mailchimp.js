'use strict';

function getInvoicesURLS(date) {

  return new Promise((yes, no) => {

    const moment = window.__hellobill.utils.moment;
    const dateRegStr = moment(date, "YYYY-MM").format("MMM YYYY");
    const orders = document.querySelectorAll('#billing-history>li.relative.selfclear');
    const okOrders = window.__hb._.filter(orders, (order) => {
      const dateDomElement = order.querySelector('.nopadding.small-meta');
      if (!dateDomElement || !dateDomElement.textContent) {
        return false;
      }
      return !!dateDomElement.textContent.match(dateRegStr);
    });
    const links = window.__hb._.map(okOrders, (order) => {
      const link = order.querySelector('a[href*="billing-receipt"]');
      return link.href;
    });
    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS
}
