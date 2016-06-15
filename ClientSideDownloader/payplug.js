'use strict';

String.prototype.capitalize = function() { //to capitalize first letter of string
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function getInvoicesURLS(data) {
  //date: 2016-01
  debugger;
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('tr[ng-repeat="invoice in invoices"]');
  const regStr = moment(date, "YYYY-MM").locale('fr').format("MM/YYYY");
  return new Promise((yes,no) => {
    const okElements = _.filter(elements, (elem) => {
      const element = elem.querySelectorAll('td')[3]
      if (element === undefined || element === null) {
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
      const link = order.querySelector('a[href*="invoices"]');
      return link.href;
    });
    yes(links)
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
}
