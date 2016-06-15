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
  const elements = document.querySelectorAll('tr');
  const regStr = moment(date, "YYYY-MM").locale('fr').format("MMMM YYYY").capitalize();
  return new Promise((yes,no) => {
    const okElements = _.filter(elements, (elem) => {
      const element = elem.querySelector('td[width="423"]')
      if (element === undefined || element === null) {
        return false;
      }
      const dateText = element.textContent;
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });
    const links = window.__hb._.map(okElements, (order) => {
      const link = order.querySelector('a[name*="consultation"]');
      return link.href.toString().replace("javascript:ouvrir('","").replace("');","");
    });
    yes(links)
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
}
