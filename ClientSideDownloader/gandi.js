'use strict';

function _getLinks(date) {
  const moment = window.__hellobill.utils.moment;
  const dateStr = moment(date, "YYYY-MM").format("YYYY-MM");

  const orders = document.querySelectorAll('#bills_list_form table tr');
  const okOrders = window.__hb._.filter(orders, (order) => {

    const dateDomElement = order.querySelector('.column-date time[datetime^="'+dateStr+'"]');

    return !!dateDomElement;
  })

  const links = window.__hb._.map(okOrders, (order) => {
    const linkElement = order.querySelector('.column-invoice_num a')

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

function getInvoicesURLS(data) {
  var date = data.date;

  return new Promise((yes) => {

    const links = _getLinks(date);

    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
}
