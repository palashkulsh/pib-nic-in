var request = require("request");
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var Async = require('async');
var fs = require('fs');
var moment = require('moment');
var cp = require('child_process');

function findData(opts, cb){
  var options = { method: 'POST',
                  url: 'http://pib.nic.in/AllRelease.aspx',
                  qs: { MenuId: '3' },
                  headers: 
                  { 'postman-token': 'a1130fc2-6a14-54db-355c-a6d10dd8a86f',
                    'cache-control': 'no-cache',
                    cookie: 'ASP.NET_SessionId=tenbyezgjeqpxhtoq2hpjil1; PIB_Accessibility=Lang=1&Region=3; style=null; _ga=GA1.3.1286562964.1515086960; _gid=GA1.3.1257246740.1515086960; ext_name=jaehkpjddfdgiiefcnhahapilbejohhj',
     'accept-language': 'en-US,en;q=0.8',
                    referer: 'http://pib.nic.in/AllRelease.aspx?MenuId=3',
                    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'content-type': 'application/x-www-form-urlencoded',
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/58.0.3029.96 Chrome/58.0.3029.96 Safari/537.36',
                    'upgrade-insecure-requests': '1',
                    origin: 'http://pib.nic.in' },
                  form: {                    
                  }
                };
  console.log(options.form.__CALLBACKPARAM)
  var filename = opts.year+'-'+opts.month+'-'+opts.date+'-pib';
  var htmlfile = filename+'.html';
  var pdffile = filename+'.pdf';
  request(options, function (error, response, body) {
    if (error) return cb(error);
    var doc = new dom().parseFromString(body);
    debugger
    var nodes = xpath.select('//*[@id="form1"]/section[2]/div/div[6]/div/div/ul/li/a/@href', doc);
    var ids=[];
    nodes.forEach(function(eachEl){
      console.log(eachEl.nodeValue)
      ids.push(eachEl.nodeValue.replace(/PressReleseDetail.aspx/g,'PressReleaseIframePage.aspx'));
    });
    Async.eachLimit(ids, 10,function eachUrl(id, lcb){
      var options = { method: 'GET',
                      url: 'http://pib.nic.in'+id,
                      headers: 
                      { 
                        'cache-control': 'no-cache',
                        cookie: 'ASP.NET_SessionId=tenbyezgjeqpxhtoq2hpjil1; style=null; _ga=GA1.3.1286562964.1515086960; _gid=GA1.3.1257246740.1515086960; PIB_Accessibility=Lang=1&Region=3; _ga=GA1.3.1286562964.1515086960; _gid=GA1.3.1257246740.1515086960; ext_name=jaehkpjddfdgiiefcnhahapilbejohhj; __atuvc=5%7C1; __atuvs=5a4e6728b7069898004',
                        'accept-language': 'en-US,en;q=0.8',                        
                        referer: 'http://pib.nic.in/PressReleseDetail.aspx?PRID=1514848',
                        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/58.0.3029.96 Chrome/58.0.3029.96 Safari/537.36',
                        'upgrade-insecure-requests': '1',
                        'x-devtools-emulate-network-conditions-client-id': 'efd4f0d6-7f84-41bd-a06f-140698d6caa0',
                        'x-devtools-request-id': '1114.2009' }
                    };
      console.log('calling '+options.url);
      request(options, function (error, response, body) {
        console.log('called '+options.url);
        if (error) {        
          return lcb(error)
        };
        if(response.statusCode==404){
          return lcb(new Error('page not found'));
        }
        fs.appendFile(htmlfile, body,function(err){
          return lcb(err);
        });
      });
    },function finalCb(err){
      if(err){
        console.log(err);
        return cb(err);
      }
      console.log('written ',htmlfile);
      console.log('creating pdf');
      cp.spawn('electron-pdf',[htmlfile, pdffile]);
      console.log('created pdf  '+pdffile);
      return cb();
    });
  });
}

(function(){
if(require.main==module){
  console.log(process.argv)
  var d = process.argv[2] ? new moment(process.argv[2]) : new moment();
  var opt = {
      date: d.date(),
      month: d.month()+1,
      year: d.year()
  }
  findData(opt, console.log)
}
})();