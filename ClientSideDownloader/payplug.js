'use strict';


function getInvoicesURLS(data) {
 var date = data.date;
 return new Promise((yes, no) => {

   const moment = window.__hellobill.utils.moment;
   const dateRegStr = moment(date, "YYYY-MM").locale('fr').format("MM/YYYY")
   const orders = document.querySelectorAll('tr[ng-repeat="invoice in invoices"]');
   const okOrders = window.__hb._.filter(orders, (order) => {
     const dateDomElement = order.querySelectorAll('td')[3];
     if (!dateDomElement || !dateDomElement.textContent) {
       return false;
     }
     return !!dateDomElement.textContent.match(dateRegStr);
   })
   const links = window.__hb._.map(okOrders, (order) => {
     const link = order.querySelector('a');
     return link.href;
   });
   yes(links);
 })
}

module.exports = {
 getInvoicesURLS: getInvoicesURLS
}
