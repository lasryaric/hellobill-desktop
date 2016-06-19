'use strict';


function getInvoicesURLS(data) {
 var date = data.date;

 return new Promise((yes, no) => {
   const moment = window.__hellobill.utils.moment;
   const dateRegStr = moment(date, "YYYY-MM").format("MMMM").substring(0,3).concat(moment(date, "YYYY-MM").format("[.*]YYYY"));
   const orders = document.querySelectorAll('tr.statement__line');
   const okOrders = window.__hb._.filter(orders, (order) => {
     const dateDomElement = order.querySelector('td.statement__date');
     if (!dateDomElement || !dateDomElement.textContent) {
       return false;
     }
     console.log("@@@@",dateRegStr,"@@@@@",dateDomElement.textContent)
     return !!dateDomElement.textContent.match(dateRegStr);
   })

   const links = window.__hb._.map(okOrders, (order) => {
     const link = order.querySelector('a[href*="financial_document"]');
     return link.href;
   });
   yes(links);
 })
}

module.exports = {
 getInvoicesURLS: getInvoicesURLS
}
