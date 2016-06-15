'use strict';

function replaceprint() {
  return new Promise((yes,no) => {
    const printext = document.querySelector('#receipt-modal').innerHTML;
    document.querySelector('body').innerHTML = printext;
    yes();
  })
}

function getlinks(data) {
  //date: 2016-01
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const regStr = moment(date, "YYYY-MM").format("MM[.*]YYYY");
  const allElements = document.querySelectorAll('div.action-tray-target div[class*="ember"]');
  return new Promise((yes,no) => {
    const okElements = _.filter(allElements, function(elem) {
      const Texts = elem.querySelector('p.order-date')
      if (Texts === null) {
        return false;
      }
      const dateText = Texts.textContent
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });

    const links = window.__hb._.map(okElements, (order) => {
      const place = order.querySelector('h3.title');
      if (place === null) {
        return false;
      }
      const id = place.textContent.replace("#","https://account.godaddy.com/orders/receipt/");
      return id;
    });
    yes(links)
  })
}

module.exports = {
  getlinks: getlinks,
  replaceprint: replaceprint,
}
