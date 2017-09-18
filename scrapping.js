/**
 * Created by md98 on 17. 7. 26.
 */

// urls
let ict_url = 'http://ict.cau.ac.kr/20150610/sub05/sub05_01_list.php';
let ictdb = 'db/ict.db';
let cse_url = 'http://cse.cau.ac.kr/20141201/sub05/sub0501.php';
let csedb = 'db/cse.db';
let accord_url = 'http://cse.cau.ac.kr/20141201/sub04/sub0403.php';
let accorddb = 'db/accord.db';
logger=require('./logger.js').logger('log/scrapping.log');
let request = require('request');
let cheerio = require('cheerio');
let moment = require('moment');
let fs = require('fs');
let data = {};
let old_data = require('./data/old_data.json');

// Read ICT Page

function requestIct(){
    return new Promise(function(resolve,reject) {
        request(ict_url, function (error, response, body) {
            if (error) {
                logger.log('error', error);
                reject(error);
            }
            resolve(body);
        });
    });
}
function parseIct(body){
    let postarray=[];
    return new Promise(function(resolve, reject){
        let $ = cheerio.load(body, {
            normalizeWhitespace: true
        });
        let postElements = $('table.board_list_type01 tbody tr');
        postElements.each(function () {
            let children = $(this).children();
            let row = {
                'url': ict_url+'?cmd=view&idx='+$(children[0]).find('a').attr('href').replace(/[^0-9]/g,''),
                'title': $(children[1]).text().replace(/[\n\t\r]/g, ''),
                'last_update' : $(children[2]).text()
            };
            postarray.push(row);
        });
        resolve(postarray);
    });
}
function pushIct(postarray){
    return new Promise(function(resolve, reject) {
        data['ict'] = postarray;
        resolve();
    });
}
function requestCse(){
    return new Promise(function(resolve, reject){
        request(cse_url, function(error, response, body){
           if (error){
               logger.log('error', error);
               reject(error);
           }
           resolve(body);
        });
    });
}
function parseCse(body){
    let postarray=[];
    return new Promise(function(resolve, reject){
        let $ = cheerio.load(body, {
           normalizeWhitespace: true
        });
        let postElements = $('table.nlist tbody tr');
        postElements.each(function (){
            let children = $(this).children();
            let row = {
                'url' : cse_url + $(children[2]).find('a').attr('href'),
                'title': $(children[2]).text().replace(/[\n\t\r]/g,''),
                'last_update' : $(children[4]).text()
            };
            postarray.push(row);
        });
        resolve(postarray);
    });
}
function pushCse(postarray){
    return new Promise(function(resolve, reject) {
        data['cse'] = postarray;
        resolve();
    });
}
function requestAccord(){
    return new Promise(function(resolve, reject){
        request(accord_url, function (error, response, body){
            if(error){
                logger.log('error', error);
                reject(error);
            }
            resolve(body);
        });
    });
}
function parseAccord(body){
    let postarray=[];
    return new Promise(function(resolve, reject){
        let $ = cheerio.load(body, {
            normalizeWhitespace: true
        });
        let postElements = $('table.nlist tbody tr');
        postElements.each(function (){
            let children = $(this).children();
            let row = {
                'url': accord_url+$(children[2]).find('a').attr('href'),
                'title': $(children[2]).text().replace(/[\n\t\r]/g, ''),
                'last_update' : $(children[4]).text()
            };
            postarray.push(row);
        });
        resolve(postarray);
    });
}
function pushAccord(postarray){
    return new Promise(function(resolve, reject) {
        data['accord'] = postarray;
        resolve();
    });
}
function filter_date(){
    let today = moment().format('YYYY.MM.DD');
    data['ict'] = data['ict'].filter(function(item){return item['last_update']==today;})
    data['cse'] = data['cse'].filter(function(item){return item['last_update']==today;})
    data['accord'] = data['accord'].filter(function(item){return item['last_update']==today;})
}

function filter_old(){
    data['ict'] = data['ict'].filter(function(item){return !old['ict'].some(function(obj){return obj.title==item.title;})});
    data['cse'] = data['cse'].filter(function(item){return !old['cse'].some(function(obj){return obj.title==item.title;})});
    data['accord'] = data['accord'].filter(function(item){return !old['accord'].some(function(obj){return obj.title==item.title;})});
}
function update_old(){
    old_data['ict'] = old_data['ict'].concat(data['ict']);
    old_data['cse'] = old_data['cse'].concat(data['cse']);
    old_data['accord'] = old_data['accord'].concat(data['accord']);
}


function _update() {
    let ict = new Promise(function(resolve, reject){
    requestIct()
        .then(parseIct)
        .then(pushIct)
        .then(function(){
            resolve();
        })
        .catch(function(error){
            logger.log('error', error);
        });
    });
    let cse = new Promise(function(resolve, reject){
    requestCse()
        .then(parseCse)
        .then(pushCse)
        .then(function(){
            resolve();
            })
        .catch(function(error){
            logger.log('error', error);
        });
    });
    let accord = new Promise(function(resolve, reject){
        requestAccord()
        .then(parseAccord)
        .then(pushAccord)
            .then(function(){
                resolve();
            })
        .catch(function(error){
            logger.log('error', error);
        });
    })
    Promise.all([ict, cse, accord]).then(function(){
        filter_date();
        filter_old();
        fs.writeFileSync('data/data.json', JSON.stringify(data),'utf8');
        update_old();
        fs.writeFileSync('data/old_data.json', JSON.stringify(old_data), 'utf8');
    });
}

exports.update=_update;
_update();
let schedule = require('node-schedule');
let rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0,59,1);
schedule.scheduleJob(rule, function() {
    logger.log('info', 'cronjob start update');
    _update();
});

