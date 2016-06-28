'use strict';

function down(data) {
  const date = data.date;
  const moment = window.__hellobill.utils.moment;
  const year = moment(date,"YYYY-MM").format("YYYY");
  const month = moment(date,"YYYY-MM").format("M");
  const end = moment(date,"YYYY-MM").endOf('month').format("D");
  var links = [];
  var url = 'https://www.paypal.com/businessexp/transactions/activity?transactiontype=ALL_TRANSACTIONS&currency=ALL_TRANSACTIONS_CURRENCY&limit=&next_page_token=&need_actions=true&need_shipping_info=true&sort=time_created&archive=ACTIVE_TRANSACTIONS&fromdate_year='+year+'&fromdate_month='+month+'&fromdate_day=1&todate_year='+year+'&todate_month='+month+'&todate_day='+end;
  console.log(url);
  return new Promise((yes,no) => {
    $.get(url)
    .then((r) => {
      console.log(r.data.transactions);
      if (r.data.transactions != null && r.data.transactions != undefined) {
        r.data.transactions.forEach((transaction) => {
          var id = transaction.transactionId;
          var url = 'https://history.paypal.com/webscr?cmd=_history-details-from-hub&id='+id;
          console.log(url);
          links.push(url);
        })
      }
    })
    yes(links)
  })
}

module.exports = {
  down: down,
}
