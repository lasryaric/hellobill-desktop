'use strict';

function changeInvoice() {
  return new Promise((yes,no) => {
    document.querySelector('#master-header').innerHTML = "";
    document.querySelector('#master-nav').innerHTML = "";
    document.querySelector('#master-footer').innerHTML = "";
    yes();
  })
}


function getInvoicesURLS(data) {
 var date = data.date;

 return new Promise((yes, no) => {

   const moment = window.__hellobill.utils.moment;
   const dateRegStr = moment(date, "YYYY-MM").format("MM/YYYY");
   const orders = document.querySelectorAll('div#commandes tr');
   const okOrders = window.__hb._.filter(orders, (order) => {
     const element = order.querySelector('.td-date');
     if (element === undefined || element === null) {
       return false;
     }
     return !!element.textContent.match(dateRegStr);
   })
   const links = window.__hb._.map(okOrders, (order) => {
     const link = order.querySelector('td.last a').getAttribute('onclick').slice(18,25);
     return "https://www.espaceclient.edenred.fr/suivicommande/consultation/".concat(link);
   });
   yes(links);
 })
}

module.exports = {
 getInvoicesURLS: getInvoicesURLS,
 changeInvoice: changeInvoice,
}
