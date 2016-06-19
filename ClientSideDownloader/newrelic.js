'use strict';

function getInvoicesURLS(data) {
  //date: 2016-01
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('table#payment_transactions tbody tr');
  const regStr = moment(date, "YYYY-MM").format("MMMM[.*]YYYY");
  return new Promise((yes,no) => {
    const okElements = _.filter(elements, (elem) => {
      const element = elem.querySelectorAll('td')[0]
      if (element === undefined || element === null) {
        return false;
      }
      const a = elem.querySelector('a[href*="payments"]')
      if (a === undefined || a === null) {
        return false;
      }
      const dateText = element.textContent;
      console.log(dateText)
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });
    const links = window.__hb._.map(okElements, (order) => {
      const link = order.querySelector('a[href*="payments"]');
      return link.href;
    });
    yes(links)
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
}
