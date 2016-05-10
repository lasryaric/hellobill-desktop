'use strict';

function _getLinks(date) {
  const moment = window.__hellobill.utils.moment;
  // const dateStr = moment(date, "YYYY-MM").format("YYYY-MM");
  const regStr = moment(date, "YYYY-MM").format("M/[.*]/YYYY");

  const orders = document.querySelectorAll('.user-payments table tr.table-row');
  const okOrders = window.__hb._.filter(orders, (order) => {


    const dateDomElement = order.querySelector('td');
    if (!dateDomElement || !dateDomElement.textContent) {
      return false;
    }
    if (!dateDomElement.textContent.match(regStr)) {
      return false;
    }



    return !!order.querySelector('a[href*="/payments/receipt"]')
  })

  const links = window.__hb._.map(okOrders, (order) => {
    const linkElement = order.querySelector('a[href*="/payments/receipt"]')

    if (!linkElement || !linkElement.href) {
      return null;
    }

    return linkElement.href;
  })
  .filter((link) => {
    return !!link;
  });

  return links;
}

function getInvoicesURLS(date) {

  return new Promise((yes) => {

    const links = _getLinks(date);

    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
}
