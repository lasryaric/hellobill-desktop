'use strict';

function down(data) {
  const date = data.date;
  const moment = window.__hellobill.utils.moment;
  const allElements = document.querySelectorAll('select#dateRange option');
  const dateRegStr = moment(date, "YYYY-MM").locale('fr').format("MMMM[.*]YYYY");
  return new Promise((yes,no) => {
    const okOrders = window.__hb._.filter(allElements, (order) => {
      if (!order.textContent) {
        return false;
      }
      return !!order.textContent.match(dateRegStr);
    });
    if (okOrders.length == 0) {
      yes(false);
    }
    const id = okOrders[0].value;
    document.querySelector('select#dateRange').value = id;
    document.querySelector('#panelFieldOptions input[type="submit"]').click();
    yes(true)
    })
}

function preparePage() {
  return new Promise((y,n) => {
    var text = document.querySelectorAll('#reportNavigation tr.tableRow')[1].innerHTML;
    text = text.replace('<span tabindex="0" class="textItem">Remarque&nbsp;: ceci n\'est pas une facture.&nbsp;</span>','').replace('<span tabindex="0" style="font-weight:bold;" class="textItem">Afficher les détails &nbsp;</span>','');
    document.querySelector('body').innerHTML = text;
    y();
  })
}

function download(date, offset, done) {
  //date: 2016-01
  offset = offset || 0;
  if (offset >= 1) {
    done()
    return ;
  }
  document.querySelector('input#downloadReport').click();
  // setTimeout(() => {
  //   document.querySelector('select#downloadOption').value = "EXCEL";
  //   document.querySelector('input#downloadReport').click();
  // },3000);
}

module.exports = {
  down: down,
  download: download,
  preparePage:preparePage,
}
