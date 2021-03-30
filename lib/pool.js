/* Scala Nodejs Pool
 * Copyright Scala	        <https://github.com/scala-network/scala-pool>
 * Copyright StelliteCoin   <https://github.com/stellitecoin/cryptonote-stellite-pool>
 * Copyright Ahmyi			<https://github.com/ahmyi/cryptonote-stellite-pool>
 * Copyright Dvandal    	<https://github.com/dvandal/cryptonote-nodejs-pool>
 * Copyright Fancoder   	<https://github.com/fancoder/cryptonote-universal-pool>
 * Copyright zone117x		<https://github.com/zone117x/node-cryptonote-pool>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
 
 const fs = require('fs');
 const net = require('net');
 const tls = require('tls');
 const async = require('async');
 const bignum = require('bignum');
 const Shares = require('./pool/Shares.js');
 const rpcDaemon = require('./rpc/daemon.js');
 const paymentSystem = require('./payments/payment_system.js');

 const utils = require('./utils.js');



// Set redis database cleanup interval

// Initialize log system
const logSystem = 'pool';
require('./exceptionWriter.js')(logSystem);

const threadId = '(Thread ' + process.env.forkId + ') ';
const log = function(severity, system, text, data){
    global.log(severity, system, threadId + text, data);
};



//BlockTemplate
const BlockTemplate = require('./model/BlockTemplate');
const Miner = require('./model/Miner');
global.currentBlockTemplate = null;


/**
  * Event Management
  */
  require('./pool/events');
  global.EventManager.register('pool:miners:connected',{
    workerType: 'pool'
}, (miner, next) => {
    log('info', logSystem, 'Miner connected %s@%s on port', [miner.login, miner.ip, miner.port]);
    Miner.Connected[miner.id] = miner;
    next();
}).register('pool:miners:disconnected',{
    workerType: 'pool'
}, (miner,reason, next) => {
    delete Miner.Connected[miner.id];
    next();
});

const bannedIPs = {};
const perIPStats = {};

let offset = global.config.offset || 2

// Block templates
const validBlockTemplates = [];


/**
 * Periodical updaters
 **/
 
// Variable difficulty retarget
setInterval(function(){
    var now = Date.now() / 1000 | 0;
    for (var minerId in  Miner.Connected){
        var miner =  Miner.Connected[minerId];
        if(!miner.noRetarget) {
            miner.retarget(now);
        }
    }
}, global.config.poolServer.varDiff.retargetTime * 1000);

// Every 30 seconds clear out timed-out miners and old bans
setInterval(function(){
    var now = Date.now();
    var timeout = global.config.poolServer.minerTimeout * 1000;
    for (var minerId in  Miner.Connected){
        var miner =  Miner.Connected[minerId];
        if (now - miner.lastBeat > timeout){
            // log('warn', logSystem, 'Miner timed out and disconnected %s@%s', [miner.login, miner.ip]);
            EventManager.parallel('pool:miners:disconnected',(fn,next) => {
                fn(miner,'timeout', next)
            })
        }
    }    

    if (banningEnabled){
        for (let ip in bannedIPs){
            var banTime = bannedIPs[ip];
            if (now - banTime > global.config.poolServer.banning.time * 1000) {
                delete bannedIPs[ip];
                delete perIPStats[ip];
                log('info', logSystem, 'Ban dropped for %s', [ip]);
            }
        }
    }

}, 30000);

/**
 * Handle multi-thread messages
 **/ 


 let poolStarted = false

 process.on('message', function(message) {
    switch (message.type) {
        case 'banIP':
        bannedIPs[message.ip] = Date.now();
        break;
        case 'blockTemplate':
        log('info', logSystem, 'New Block Template recieved');
        if(poolStarted) {
            BlockTemplate.refresh(message.block, Miner.onPoolRefresh);
            break;
        }
        startPoolServerTcp(() => {
            BlockTemplate.refresh(message.block, Miner.onPoolRefresh)
            poolStarted = true
        })
        break;
    }
});


/**
 * Handle miner method
 **/
 function handleMinerMethod(response, portData)
 {
 // function handleMinerMethod(req, res){
    let miner =  Miner.Connected[response.params.id] || false;
    
    switch(response.method){
        case 'login':
            const miner = new Miner(response, portData);

            if(miner.error) {
                response.reply(miner.error, null, true);
                return;
            }

            Miner.Connected[miner.id] = miner;

            response.reply(null, {
                id: miner.id,
                job: miner.getJob(),
                algo:miner.Coin.algo,
                status: 'OK'
            });

            EventManager.parallel('pool:miners:connected',(fn,next) => { fn(miner, next)});

            response.onDisconnect(() => EventManager.parallel('pool:miners:disconnected',(fn,next) => {fn(miner, next)}));
        break;
        case 'getjob':
            if (!miner){
                response.reply('Unauthenticated', null, true);
                return;
            }

            miner.heartbeat();
            response.reply(null, miner.getJob());
        break;
        case 'submit':
            if (!miner){
                response.reply('Unauthenticated' null, true);
                return;
            }

            const job = miner.beforeSubmit();
        
            if(job.error) {
                BanManager.onIpCheck(response.ip, false);
                response.reply(job.error,null, true);
                return;
            }

        const blockTemplate = currentBlockTemplate.height === job.height ? currentBlockTemplate : validBlockTemplates.filter(function(t){
            return t.height === job.height;
        })[0];

        if (!blockTemplate){
            response.reply('Block expired', null, false);
            return;
        }

        const Share = miner.Coin.Share;
        const share = Share.processRecord(miner, job, blockTemplate, params);

        if(share.reqDiff) {
            miner.setNewDiff(miner.difficulty);
            return;
        }

        const shareAccepted = share.isAccepted;

        BanManager.checkBanMiner(miner, shareAccepted);
        
        if (Share.TrustEnabled){
            if (shareAccepted){
                miner.trust.probability -= Share.trustStepFloat;
                if (miner.trust.probability < Share.trustMinFloat)
                    miner.trust.probability = Share.trustMinFloat;
                miner.trust.penalty--;
                miner.trust.threshold--;
            }
            else{
                log('warn', logSystem, 'Share trust broken by %s@%s', [miner.login, ip]);
                miner.trust.probability = 1;
                miner.trust.penalty = global.config.poolServer.shareTrust.penalty;
            }
        }
        
        if (!shareAccepted || share.error){
            const errmsg = share.error || 'invalid result'
            response.reply(`Rejected share: ${errmsg}`, null, false);
            return;
        }

        job.submissions.push(nonce_test);

        const now = Date.now() / 1000 | 0;
        miner.shareTimeRing.append(now - miner.lastShareTime);
        miner.lastShareTime = now;
            //miner.retarget(now);

            response.reply(null, {status: 'OK'});
            break;
            case 'keepalived' :
            if (!miner){
                response.reply('Unauthenticated', null, true);
                return;
            }
            miner.heartbeat();
            response.reply(null, { status:'KEEPALIVED' });
            break;
            default:
            response.reply('Invalid method', null, true);
            log('warn', logSystem, 'Invalid method: %s (%j) from (%s@%s)', [response.method, response.params, miner?miner.login:'', response.ip]);
            break;
        }
    }


/**
 * Start pool server on TCP ports
 **/
 const httpResponse = ' 200 OK\nContent-Type: text/plain\nContent-Length: 20\n\nMining server online';

 function startPoolServerTcp(callback){
    EventManager.parallel('pool:beforeStart', (fn, next) => {
        fn();
        next();
    }, e => {
        poolStart(callback);
    });   
}

function poolStart(callback){

    async.each(config.poolServer.ports, function(portData, cback){

        const socketResponder = function(socket){
            socket.setKeepAlive(true);
            socket.setEncoding('utf8');

            const response = new Response(socket);

            let dataBuffer = '';

            const ip = response.ip;
            
            socket.on('connect', () =>{

                if(BanManager.IsBannedIp(ip)) {
                    // Check for ban here, so preconnected attackers can't continue to screw you
                    response.reply(`Your IP is banned for coin ${portData.coinAlias}`, null, true);
                    return;
                }
            }).on('data', function(d){

                dataBuffer += d;
                    if (Buffer.byteLength(dataBuffer, 'utf8') > 10240){ //10KB
                        dataBuffer = null;
                        BanManager.warnIp(ip);
                        log('warn', logSystem, 'Socket flooding detected and prevented from %s: %s ', [ip, message]);
                        response.reply('Socket flooding detected and prevented', null, true);
                        return;
                    }

                    if (dataBuffer.indexOf('\n') !== -1){
                        const messages = dataBuffer.split('\n');
                        const incomplete = dataBuffer.slice(-1) === '\n' ? '' : messages.pop();
                        for (let i = 0; i < messages.length; i++){
                            let message = messages[i];
                            if (message.trim() === '') {
                                continue;
                            }

                            let jsonData;

                            try{
                                jsonData = JSON.parse(message);
                            } catch(e){
                                if (message.indexOf('GET /') === 0) {
                                    if (message.indexOf('HTTP/1.1') !== -1) {
                                        socket.end('HTTP/1.1' + httpResponse);
                                        break;
                                    }
                                    else if (message.indexOf('HTTP/1.0') !== -1) {
                                        socket.end('HTTP/1.0' + httpResponse);
                                        break;
                                    }
                                }
                                

                                log('warn', logSystem, 'Malformed message from %s: %s ', [ip, message]);
                                BanManager.onIpCheck(response.ip, BanManager.RESPONSE_MALFORMED);
                                response.reply('Malformed message', null, true);
                                break;
                            }
                            
                            try {
                                response.setJsonData(jsonData);
                                if(response.isValid) {
                                    handleMinerMethod(response, portData);
                                }
                            } catch (e) {
                                if (e.message) {
                                    log('warn', logSystem, 'Exception: ' + e.message);
                                } else {
                                    log('warn', logSystem, 'Malformed handle message from %s generated an exception. Message: %s', [ip, message]);
                                }
                            }
                        }
                        dataBuffer = incomplete;
                    }
                }).on('error', function(err){
                    if (err.code !== 'ECONNRESET')
                        log('warn', logSystem, 'Socket error from %s %j', [response.ip, err]);
                }).on('close', function(hasError) {
                    response.disconnectTrigger();
                });
            };

            if (portData.ssl) {
                if (!config.poolServer.sslCert) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL certificate not configured', [portData.port]);
                    cback(true);
                } else if (!config.poolServer.sslKey) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL key not configured', [portData.port]);
                    cback(true);
                } else if (!config.poolServer.sslCA) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL certificate authority not configured', [portData.port]);
                    cback(true);
                } else if (!fs.existsSync(config.poolServer.sslCert)) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL certificate file not found (configuration error)', [portData.port]);
                    cback(true);
                } else if (!fs.existsSync(config.poolServer.sslKey)) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL key file not found (configuration error)', [portData.port]);
                    cback(true);
                } else if (!fs.existsSync(config.poolServer.sslCA)) {
                    log('error', logSystem, 'Could not start server listening on port %d (SSL): SSL certificate authority file not found (configuration error)', [portData.port]);
                    cback(true);
                } else {
                    const options = {
                        key: fs.readFileSync(config.poolServer.sslKey),
                        cert: fs.readFileSync(config.poolServer.sslCert),
                        ca: fs.readFileSync(config.poolServer.sslCA)
                    };

                    tls.createServer(options, socketResponder).listen(portData.port, function (error, result) {
                        if (error) {
                            log('error', logSystem, 'Could not start server listening on port %d (SSL), error: $j', [portData.port, error]);
                            cback(true);
                            return;
                        }

                        EventManager.parallel('pool:server:created', (fn, cb) => {
                            fn(portData, cb)
                        }, cback)
                    });
                }
            }  else {
                net.createServer(socketResponder).listen(portData.port, function (error, result) {
                    if (error) {
                        log('error', logSystem, 'Could not start server listening on port %d, error: $j', [portData.port, error]);
                        cback(true);
                        return;
                    }

                    EventManager.parallel('pool:server:created', (fn, cb) => {
                        fn(portData, cb)
                    }, cback)
                });
            }
        }, callback);
}


let initCT;
const init = () => {

    if(poolStarted) {
       return 
   }

   if(initCT) {
    clearTimeout(initCT)
    initCT = null
}

redisClient.hget(global.config.coin + ":stats", 'blockTemplate', (e,r) => {

    if(e || !r) {
        log('warn', logSystem, 'Block template not avaliable %j', [e]);
        initCT = setTimeout(init,1000)
        return;
    }

    let block;
    try{
        block = JSON.parse(r)
    } catch(e) {
        initCT = setTimeout(init,1000)
        log('error', logSystem, 'Could parse block template %j', [e]);
        return;   
    }

    startPoolServerTcp(() => {
        poolStarted = true;

    })
})
}
initCT = setTimeout(init,1000)