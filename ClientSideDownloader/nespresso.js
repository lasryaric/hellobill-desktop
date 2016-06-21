'use strict';

function change() {
  return new Promise((yes,no) => {
    const printext = document.querySelector('#my-order-order1').innerHTML;
    document.querySelector('body').innerHTML = printext;
    yes();
  })
}

function down(data) {
  //date: 2016-01
  const date = data.date;
  const _ = window.__hellobill.utils._;
  const moment = window.__hellobill.utils.moment;
  const regStr = moment(date, "YYYY-MM").locale('fr').format("MM/[.*]/YYYY");
  const allElements = document.querySelectorAll('tr[id*="my-order"] td.c1');
  return new Promise((yes,no) => {
    const okElements = _.filter(allElements, function(elem) {
      const dateText = elem.textContent;
      if (dateText === null) {
        return false;
      }
      return dateText.match(regStr)
    });
    const links = window.__hb._.map(okElements, (order) => {
      const link = order.querySelector('a');
      return link.href;
    });
    yes(links)
  })
}

module.exports = {
  down: down,
  change: change,
}
