'use strict';


function getInvoicesURLS(data) {
 var date = data.date;
 return new Promise((yes, no) => {
   const moment = window.__hellobill.utils.moment;
   const elements = document.querySelectorAll('tr[ng-repeat="invoice in invoices"]');
   const start = moment("20/".concat(moment(date, "YYYY-MM").format("MM/YYYY")),"DD/MM/YYYY");
   const end = moment("10/".concat(moment(date, "YYYY-MM").add('1','months').format("MM/YYYY")),"DD/MM/YYYY");
   console.log(start,end)
   const interval = moment.range(start,end)
   const okElements = _.filter(elements, (elem) => {
     const dats = elem.querySelectorAll('td')[3];
     if (dats === undefined) {
       return false;
     }
     const dateText = dats.textContent;
     if (dateText === null) {
       return false;
     }
     var formatted = moment(dateText,"DD/MM/YYYY")
     console.log("Date "+formatted+"  "+dateText);
     return formatted.within(interval)
   });
   const links = window.__hb._.map(okElements, (order) => {
     const link = order.querySelector('a');
     return link.href;
   });
   yes(links);
 })
}

module.exports = {
 getInvoicesURLS: getInvoicesURLS
}
