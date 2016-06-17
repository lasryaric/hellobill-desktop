'use strict';


function getInvoicesURLS(data) {
 var date = data.date;

 return new Promise((yes, no) => {

   const moment = window.__hellobill.utils.moment;
   const dateRegStr = moment(date, "YYYY-MM").format("YYYY-MM");
   const orders = document.querySelectorAll('tbody#invoices tr:not([class="invoice-details"])');
   const okOrders = window.__hb._.filter(orders, (order) => {
     const element = order.querySelectorAll('td')[0];
     if (element === undefined || element === null) {
       return false;
     }
     const element2 = order.querySelector('a[href*="/users/invoice"]')
     if (element2 === undefined || element2 === null) {
       return false;
     }
     if (!element.textContent) {
       return false;
     }
     return !!element.textContent.match(dateRegStr);
   })

   const links = window.__hb._.map(okOrders, (order) => {
     const link = order.querySelector('a[href*="/users/invoice"]');
     return link.href;
   });
   yes(links);
 })
}

module.exports = {
 getInvoicesURLS: getInvoicesURLS
}
