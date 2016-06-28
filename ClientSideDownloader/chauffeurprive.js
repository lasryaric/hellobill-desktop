'use strict';

function getHTML() {
  return new Promise((yes,no) => {
    yes(document.querySelector('html').innerHTML)
  })
}

function down(data) {
  const date = data.date;
  return new Promise((yes, no) => {
    $.get('https://app.chauffeur-prive.com/my_rides_ajax?iDisplayLength=9999')
    .then((r) => {
      var html = "";
      r.aaData.forEach(function(entry) {
        html += "<tr class='hellobill'><td>"+entry.join()+"</td></tr>";
      });
      document.querySelector('#rides tbody').innerHTML = html;
      const elements = document.querySelectorAll('tr.hellobill');
      const moment = window.__hellobill.utils.moment;
      const regStr = moment(date, "YYYY-MM").format("MM/YY");
      const okElements = _.filter(elements, function(elem) {
        const dateText = elem.querySelector('td').textContent;
        if (dateText === null) {
          return false;
        }
        return dateText.match(regStr)
      });
      const links = window.__hb._.map(okElements, (order) => {
        const link = order.querySelector('a[href*="facture"]:not([href*="format=full"])');
        return link.href;
      });
      yes(links);
    })
  })
}

module.exports = {
  down: down,
  getHTML: getHTML,
}
