'use strict';

function _getLinks(data, filter) {
  var date = data.date;
  const moment = window.__hellobill.utils.moment;
  const dateRegStr = moment(date, "YYYY-MM").locale('fr').format("MMMM[.*]YYYY");

  const orders = document.querySelectorAll('.a-box-group.a-spacing-base.order');
  const okOrders = window.__hb._.filter(orders, (order) => {

    const dateDomElement = order.querySelector('.a-color-secondary.value');
    if (!dateDomElement || !dateDomElement.textContent) {
      return false;
    }

    return !!dateDomElement.textContent.match(dateRegStr);
  })

  const links = window.__hb._.map(okOrders, (order) => {

    const link = order.querySelector('a.a-link-normal[href*="'+filter+'"]');
    if (!link) {
      return null;
    }

    return link.href;
  })
  .filter((link) => {
    return !!link;
  });

  return links;
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

function getInvoicesURLS(data) {
  var date = data.date;

  return new Promise((yes) => {

    const links = _getLinks(date, "print");

    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
  download: download,
}
