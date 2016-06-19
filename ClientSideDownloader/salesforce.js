'use strict';

String.prototype.capitalize = function() { //to capitalize first letter of string
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const urlParser = require('url');
function gourl() {
  return new Promise((yes,no) => {
    const idurl = document.querySelector('form[action*="?id="]').action;
    const parsedURL = urlParser.parse(idurl, true);
    const invoiceID = parsedURL.query.id;
    const gotoURL = 'https://store.salesforce.com/apex/Invoice?id='+invoiceID;
    yes(gotoURL)
  })
}

function getInvoicesURLS(data) {
  //date: 2016-01
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const elements = document.querySelectorAll('table.datatable tr');
  const regStr = moment(date, "YYYY-MM").format("MM/YYYY");
  return new Promise((yes,no) => {
    const okElements = _.filter(elements, (elem) => {
      const element = elem.querySelector('span[class="004"]')
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
      const link = order.querySelector('a[href*="transactiondetail"]');
      if (link === undefined || link === null) {
      } else {
        return link.href;
      }
    });
    yes(links)
  })
}

module.exports = {
  getInvoicesURLS: getInvoicesURLS,
  gourl: gourl,
}
