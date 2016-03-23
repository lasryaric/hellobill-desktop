'use strict';

function download(date, offset) {
  //date: 2016-01
  offset = offset || 0;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;


  if (offset === 0) {
    var linksA = document.querySelectorAll(".view-invoices-link");
    for (var i = 0; i < linksA.length; i++) {
      linksA[i].click();
    }
  }

  function downloadNextHandler() {
    download(date, offset + 1);
  }

  window.__hellobill.ipc.once('downloadNext', downloadNextHandler);

  const okElements = document.querySelectorAll('.bills-invoice-download');

  if (offset >= okElements.length) {
    window.__hellobill.ipc.send('doneDownloading');
    return ;
  }
  okElements[offset].click();

}

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
  download: download,
  getInvoicesURLS: getInvoicesURLS
}
