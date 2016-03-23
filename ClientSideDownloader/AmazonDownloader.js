'use strict';


function getInvoicesURLS(date) {

  return new Promise((yes, no) => {

    const moment = window.__hellobill.utils.moment;
    const dateRegStr = moment(date, "YYYY-MM").format("MMMM [.*,] YYYY");
    const orders = document.querySelectorAll('.a-box-group.a-spacing-base.order');
    const okOrders = window.__hb._.filter(orders, (order) => {
      const dateDomElement = order.querySelector('.a-color-secondary.value');
      if (!dateDomElement || !dateDomElement.textContent) {
        return false;
      }

      return !!dateDomElement.textContent.match(dateRegStr);
    })

    const links = window.__hb._.map(okOrders, (order) => {
      const link = order.querySelector('a.a-link-normal[href*="print"]');

      return link.href;
    });
    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS
}
