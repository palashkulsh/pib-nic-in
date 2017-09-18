var request = require("request");
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var Async = require('async');
var fs = require('fs');
var moment = require('moment');
var cp = require('child_process');

function findData(opts, cb){
  var options = { method: 'POST',
                  url: 'http://pib.nic.in/newsite/erelease.aspx',
                  qs: { relid: '170896' },
                  headers: 
                  { 'postman-token': '98375327-21d7-82c3-2398-06f29169434f',
                    'cache-control': 'no-cache',
                    cookie: 'PIBcookie=AGzHOZaAGQo1OMAFPxUiXQ$$; ASP.NET_SessionId=ef2kms55g5yvas55jzt3ua45; PIBcookie=AFuNeJaAGQpA8SIAYs39Gw$$; ext_name=jaehkpjddfdgiiefcnhahapilbejohhj',
                    'accept-language': 'en-US,en;q=0.8',
                    'accept-encoding': 'gzip, deflate',
                    referer: 'http://pib.nic.in/newsite/erelease.aspx?relid=170896',
                    accept: '*/*',
                    'content-type': 'application/x-www-form-urlencoded',
                    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/58.0.3029.96 Chrome/58.0.3029.96 Safari/537.36',
                    origin: 'http://pib.nic.in' },
                  form: 
                  { '': undefined,
                    __CALLBACKID: '__Page',
                    __CALLBACKPARAM: '1|'+opts.date+'|'+opts.month+'|'+opts.year+'|0',
                    __VIEWSTATE: '/wEPDwUKLTU2ODcyMjUwOWRk94fRLtJLDpsGH7lqpoQuc/eyhb4=' } };
  console.log(options.form.__CALLBACKPARAM)
  var filename = opts.year+'-'+opts.month+'-'+opts.date+'-pib';
  var htmlfile = filename+'.html';
  var pdffile = filename+'.pdf';
  request(options, function (error, response, body) {
    if (error) return cb(error);
    var doc = new dom().parseFromString(body);
    var nodes = xpath.select('//*[@class="link1"]/@id', doc);
    var ids=[];
    nodes.forEach(function(eachEl){
      ids.push(eachEl.nodeValue);
    });
    Async.eachLimit(ids, 10,function eachUrl(id, lcb){
      var options = { method: 'GET',
                      url: 'http://pib.nic.in/newsite/erelcontent.aspx',
                      qs: { relid: id }
                    };
      console.log('calling '+options.url+'?relid='+options.qs.relid);
      request(options, function (error, response, body) {
        console.log('called '+options.url+'?relid='+options.qs.relid);
        if (error) {        
          return lcb(error)
        };       
        fs.appendFile(htmlfile, body,function(err){
          return lcb(err);
        });
      });
    },function finalCb(){
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