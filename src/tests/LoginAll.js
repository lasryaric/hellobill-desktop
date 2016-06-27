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
      "name":"mailchimp",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"alumneye"
      }
   },
   {
      "name":"newrelic",
      "credentials":{
         "password":"speCeW6@edaC@e&UfraWEWradrABr4",
         "username":"dev+newrelic@tandoori.pro"
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
      "name":"balsamiq",
      "credentials":{
         "password":"9981Balsamiq1854",
         "username":"pasvetchine"
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
      "name":"frichti",
      "credentials":{
         "password":"hellobill1",
         "username":"lasseri.anna@gmail.com"
      }
   },
   {
      "name":"scaleway",
      "credentials":{
         "password":"#q?KK7M}A,U0|J#H+#i",
         "username":"dev@tandoori.pro"
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
      "name":"autolib",
      "credentials":{
         "password":"Aqwzsxedc",
         "username":"GuthL"
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
      "name":"envato",
      "credentials":{
         "password":"alumneye01",
         "username":"MO93100"
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
      "name":"bouygues",
      "credentials":{
         "lastname":"ohana",
         "password":"hellobill123",
         "username":"0611633265"
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
      "name":"zapier",
      "credentials":{
         "password":"alumneye01",
         "username":"michael@alumneye.fr"
      }
   },
   {
      "name":"github",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"lasry.aric@gmail.com"
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
      "name":"awsmain",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"aric@hellobill.io"
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
      "name":"directenergie",
      "credentials":{
         "password":"Passw01#1",
         "username":"pasvetchine@spicesoft.pro"
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
      "name":"numericable",
      "credentials":{
         "password":"Talavera1",
         "username":"95083962"
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
      "name":"sentry",
      "credentials":{
         "password":"2vx-f6z-tFG-ywf",
         "username":"pasvetchine@spicesoft.pro"
      }
   },
   {
      "name":"edf",
      "credentials":{
         "password":"fdsfsdf",
         "username":"mike.ohana@gmail.com"
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
      "name":"newrelic",
      "credentials":{
         "password":"speCeW6@edaC@e&UfraWEWradrABr4",
         "username":"dev+newrelic@tandoori.pro"
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
      "name":"balsamiq",
      "credentials":{
         "password":"9981Balsamiq1854",
         "username":"pasvetchine"
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
      "name":"frichti",
      "credentials":{
         "password":"hellobill1",
         "username":"lasseri.anna@gmail.com"
      }
   },
   {
      "name":"scaleway",
      "credentials":{
         "password":"#q?KK7M}A,U0|J#H+#i",
         "username":"dev@tandoori.pro"
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
      "name":"autolib",
      "credentials":{
         "password":"Aqwzsxedc",
         "username":"GuthL"
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
      "name":"envato",
      "credentials":{
         "password":"alumneye01",
         "username":"MO93100"
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
      "name":"bouygues",
      "credentials":{
         "lastname":"ohana",
         "password":"hellobill123",
         "username":"0611633265"
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
      "name":"zapier",
      "credentials":{
         "password":"alumneye01",
         "username":"michael@alumneye.fr"
      }
   },
   {
      "name":"github",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"lasry.aric@gmail.com"
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
      "name":"awsmain",
      "credentials":{
         "password":"Jo31pal00!!!",
         "username":"aric@hellobill.io"
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
      "name":"directenergie",
      "credentials":{
         "password":"Passw01#1",
         "username":"pasvetchine@spicesoft.pro"
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
      "name":"numericable",
      "credentials":{
         "password":"Talavera1",
         "username":"95083962"
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
      "name":"sentry",
      "credentials":{
         "password":"2vx-f6z-tFG-ywf",
         "username":"pasvetchine@spicesoft.pro"
      }
   },
   {
      "name":"edf",
      "credentials":{
         "password":"fdsfsdf",
         "username":"mike.ohana@gmail.com"
      }
   },
   {
      "name":"uber",
      "credentials":{
         "password":"litecpp94",
         "username":"lasry.aric@gmail.com"
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
