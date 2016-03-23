'use strict';

function _getLinks(date, filter) {
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

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;

  const okElements = _getLinks(date, "get-legal-invoice")
  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }





  function downloadNextHandler() {
    download(date, offset + 1);
  }
  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);
  window.location = okElements[offset];
}

function getInvoicesURLS(date) {

  return new Promise((yes) => {

    const links = _getLinks(date, "print");

    yes(links);
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
  download: download,
}
