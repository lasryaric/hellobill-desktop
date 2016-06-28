'use strict';

String.prototype.capitalize = function() { //to capitalize first letter of string
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function getLinks(data) {
  return new Promise((y,n) => {
    const date = data.date;
    const moment = window.__hellobill.utils.moment;
    const dateRegStr = moment(date, "YYYY-MM").locale('fr').format("MMMM YYYY");
    const orders = document.querySelectorAll('table.tabCommandes tr');
    const okOrders = window.__hb._.filter(orders, (order) => {
      const dateDomElement = order.querySelectorAll('td')[0];
      if (!dateDomElement || !dateDomElement.textContent) {
        return false;
      }
      return !!dateDomElement.textContent.match(dateRegStr);
    })
    console.log(okOrders);
    const links = window.__hb._.map(okOrders, (order) => {
      const invoiceID = order.querySelectorAll('td')[2].textContent.replace(/\s+/g, '');
      const invoiceLink = 'https://www.fnacspectacles.com/compteclient/facturette.do?reftra='+invoiceID;
      console.log(invoiceLink);
      if (!invoiceLink) {
        return null;
      }
      return invoiceLink;
    })
    y(links);
  })
}

module.exports = {
  getLinks: getLinks,
}
