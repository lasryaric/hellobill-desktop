'use strict';

const bluebird = require('bluebird');
const TestCredentials = require(__dirname+'/../../lib/TestCredentials');
var uuid = require('node-uuid');

var results = {};

const mUserMe = {
  _id:'testUser1',
  email:'aric@hellobill.io',
}

var credentials = [
  {
     "name":"github",
     "credentials":{
        "password":"Jo31pal00!!!",
        "username":"lasry.aric@gmail.com"
     }
  },
  {
     "name":"google",
     "credentials":{
        "password":"Jo31pal0!?!",
        "username":"aric@hellobill.io"
     }
  },
  {
     "name":"dropbox",
     "credentials":{
        "password":"Jo31pal00!!!",
        "username":"lasry.aric@gmail.com"
     }
  },
   {
      "name":"ovh",
      "credentials":{
         "password":"hellobill123",
         "username":"OM18259"
      }
   },
   {
      "name":"gandi",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"AL9567-GANDI"
      }
   },
   {
      "name":"slack",
      "credentials":{
         "password":"cl46tan",
         "team":"upperlife",
         "username":"falemaster@yahoo.fr"
      }
   },
   {
      "name":"awsiam",
      "credentials":{
         "account":"068612090890",
         "password":"hellobill123",
         "username":"aric"
      }
   },
   {
      "name":"awsmain",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"aric@hellobill.io"
      }
   },
   {
      "name":"amazon",
      "credentials":{
         "password":"jo31pal",
         "username":"johana.afenjar@gmail.com"
      }
   },
   {
      "name":"skype",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"lasry.aric94"
      }
   },
   {
      "name":"facebookads",
      "credentials":{
         "password":"2016AlumnEye",
         "username":"charles.furand@hotmail.com"
      }
   },
   {
      "name":"orange",
      "credentials":{
         "password":"family5",
         "username":"Azriafamily@wanadoo.fr"
      }
   },
   {
      "name":"adwords",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"accounting@hellobill.io"
      }
   },
   {
      "name":"bouygues",
      "credentials":{
         "lastname":"ohana",
         "password":"hellobill123",
         "username":"0611633265"
      }
   },
   {
      "name":"uber",
      "credentials":{
         "password":"litecpp94",
         "username":"lasry.aric@gmail.com"
      }
   },
   {
      "name":"mailchimp",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"alumneye"
      }
   },
   {
      "name":"airbnb",
      "credentials":{
         "password":"hellobill1234",
         "username":"mike.ohana@gmail.com"
      }
   },
   {
      "name":"sfr",
      "credentials":{
         "password":"cl46tan",
         "username":"0624722568"
      }
   },
   {
      "name":"algolia",
      "credentials":{
         "password":"oMXH.jLkH77QQEMk&CW;CqKfwBef",
         "username":"michael@hellobill.io"
      }
   },
   {
      "name":"cic",
      "credentials":{
         "password":"90629062Avb",
         "username":"014214801075"
      }
   },
   {
      "name":"sncf",
      "credentials":{
         "password":"talavera",
         "username":"michael.ohana@essec.edu"
      }
   },
   {
      "name":"adobe",
      "credentials":{
         "password":"Jo31pal0!?!",
         "username":"aric@tilden.io"
      }
   },
   {
      "name":"edf",
      "credentials":{
         "password":"hellobill123",
         "username":"mike.ohana@gmail.com"
      }
   },
   {
      "name":"autolib",
      "credentials":{
         "password":"Aqwzsxedc",
         "username":"GuthL"
      }
   },
   {
      "name":"balsamiq",
      "credentials":{
         "password":"9981Balsamiq1854",
         "username":"pasvetchine"
      }
   },
   {
      "name":"chauffeurprive",
      "credentials":{
         "password":"360cappar",
         "username":"Edna.ohana@360capitalpartners.com"
      }
   },
   {
      "name":"directenergie",
      "credentials":{
         "password":"Passw01#1",
         "username":"pasvetchine@spicesoft.pro"
      }
   },
   {
      "name":"edenred",
      "credentials":{
         "password":"Passw01#1",
         "username":"pasvetchine@tandoori.pro"
      }
   },
   {
      "name":"envato",
      "credentials":{
         "password":"alumneye01",
         "username":"MO93100"
      }
   },
   {
      "name":"frichti",
      "credentials":{
         "password":"hellobill1",
         "username":"lasseri.anna@gmail.com"
      }
   },
  //  {
  //     "name":"nespresso",
  //     "credentials":{
  //        "password":"us",
  //        "username":"tison@360capitalpartners.com"
  //     }
  //  },
   {
      "name":"newrelic",
      "credentials":{
         "password":"speCeW6@edaC@e&UfraWEWradrABr4",
         "username":"dev+newrelic@tandoori.pro"
      }
   },
   {
      "name":"numericable",
      "credentials":{
         "password":"Talavera1",
         "username":"95083962"
      }
   },
   {
      "name":"online",
      "credentials":{
         "password":"wWvLWRLQQIHagY5a28MRpidOh",
         "username":"spicesoft"
      }
   },
   {
      "name":"orangebe",
      "credentials":{
         "password":"hellobill-FTW",
         "username":"jb.escoyez"
      }
   },
   {
      "name":"pipedrive",
      "credentials":{
         "password":"2016AlumnEye",
         "username":"contact@alumneye.fr"
      }
   },
  //  {
  //     "name":"salesforce",
  //     "credentials":{
  //        "password":"Gf}rgGxTJumNPW=J7kQfZbe3bpA*",
  //        "username":"michael@hellobill.io"
  //     }
  //  },
   {
      "name":"scaleway",
      "credentials":{
         "password":"#q?KK7M}A,U0|J#H+#i",
         "username":"dev@tandoori.pro"
      }
   },
   {
      "name":"sellsy",
      "credentials":{
         "password":"airdoc",
         "username":"m.atedzoue@airdocsolutions.com"
      }
   },
   {
      "name":"sentry",
      "credentials":{
         "password":"2vx-f6z-tFG-ywf",
         "username":"pasvetchine@spicesoft.pro"
      }
   },
   {
      "name":"upwork",
      "credentials":{
         "password":"Passw01#1",
         "username":"pasvetchine@spicesoft.pro"
      }
   },
   {
      "name":"urssaf",
      "credentials":{
         "password":"CcfOyM",
         "username":"34022537400024"
      }
   },
   {
      "name":"zapier",
      "credentials":{
         "password":"alumneye01",
         "username":"michael@alumneye.fr"
      }
   }
];


function testAll(mUserMe, models) {
  bluebird.each(models, (model) => {
    model._id = 'test_credentials_randomized_'+uuid.v4();
    console.log('============ Working on:', model)
    return TestCredentials(mUserMe, model)
    .then(() => {
      results[model.name] ='ok';
      console.log('Ok testing:', model._id)
    })
    .catch((err) => {
      results[model.name] ='NOT OK!!!';
      console.log('error testing ', model._id)
    })
  })
  .catch((err) => {
    console.log('error testing credentials:', err)
  })
  .then(() => {
    console.log('done all', results)
  })
}

function runTests() {
  return testAll(mUserMe, credentials);
}

module.exports = {
  runTests: runTests
};
