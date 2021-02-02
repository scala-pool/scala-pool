/* Stellite Nodejs Pool
 * Copyright StelliteCoin	<https://github.com/stellitecoin/cryptonote-stellite-pool>
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
  global.EventManager.register('pool:server:created',{
    workerType: 'pool',
    forkId: 0
}, (portData, next) => {

    log('info', logSystem, 'Started server listening on port %d', [portData.port]);
    next();
}).register('pool:block:found',{
    workerType: 'pool'
},(cm, block, next) => {
    process.send({type:'jobRefresh'});
}).register('pool:miners:connected',{
    workerType: 'pool'
}, (miner, next) => {

    Miner.Connected[miner.id] = miner

    const dateNow = Date.now();
    const dateNowSeconds = dateNow / 1000 | 0;

    const cmds = [];
    const workerPortType = ['workers', miner.poolType].join('_');
    const porto = ['port', miner.port].join('_');
    cmds.push(['hincrby', global.config.coin + ':stats', 'workers', '+1']);
    cmds.push(['hincrby', global.config.coin + ':stats', workerPortType, '+1']);
    cmds.push(['hincrby', global.config.coin + ':stats', porto, '+1']);
    // cmds.push(['hmget', global.config.coin + ':stats', ['workers',workerPortType ]]);

    // cmds.push(['sadd', global.coin + ':ip', ['port', miner.port].join('_'), '+1']);
    // redisClient.sadd(config.coin + ':workers_ip:' + miner.login, miner.ip);

    redisClient.multi(cmds).exec((e,r) => {
        if(e) {
            return;
        }

        const re = [];
        const rr = r[r.length-1];
        // re.push(['hset', global.config.coin + ':graph:connects:all', dateNowSeconds, rr[0]]);
        // re.push(['hset',global.config.coin + ':graph:connects:' + miner.poolType, dateNowSeconds, rr[1]]);
        // redisClient.multi(re).exec((ee,rr) => {});
    });

    next()
}).register('pool:miners:disconnected',{
    workerType: 'pool'
}, (miner,reason, next) => {

    const dateNow = Date.now();
    const dateNowSeconds = dateNow / 1000 | 0;

    delete  Miner.Connected[miner.id]

    const cmds = [];
    const workerPortType = ['workers', miner.poolType].join('_');
    const porto = ['port', miner.port].join('_');
    cmds.push(['hincrby', global.config.coin + ':stats', 'workers', '-1']);
    cmds.push(['hincrby', global.config.coin + ':stats', workerPortType, '-1']);
    cmds.push(['hincrby', global.config.coin + ':stats', porto, '-1']);
    //cmds.push(['hmget', global.config.coin + ':stats', ['workers',workerPortType]]);
    redisClient.multi(cmds).exec((e,r) => {
        if(e) {
            return;
        }
        // const re = [];
        // const rr = r[r.length-1];
        // re.push(['hset', global.config.coin + ':graph:connects:all', dateNowSeconds, rr[0]]);
        // re.push(['hset', global.config.coin + ':graph:connects:' + miner.poolType, dateNowSeconds, rr[1]]);
        // redisClient.multi(re).exec((ee,rr) => {});
    });

    next()
});


// Pool settings
const cleanupInterval = global.config.redis.cleanupInterval && global.config.redis.cleanupInterval > 0 ? global.config.redis.cleanupInterval : 15;


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
            BlockTemplate.refresh(message.block, Miner.Connected);
            break;
        }
        startPoolServerTcp(() => {
            BlockTemplate.refresh(message.block, Miner.Connected)
            poolStarted = true
        })
        break;
    }
});


/**
 * Handle miner method
 **/
 function handleMinerMethod(method, params, ip, portData, sendReply, pushMessage)
 {
 // function handleMinerMethod(req, res){
    let miner =  Miner.Connected[params.id] || false;
    
    // Check for ban here, so preconnected attackers can't continue to screw you
    if ((miner && IsBannedMiner(miner)) || IsBannedIp(ip, portData.coinAlias)){
        sendReply(`Your IP is banned for coin ${portData.coinAlias}`);
        return;
    }

    switch(method){
        case 'login':
        let login = params.login;
        if (!login){
            sendReply('Missing login');
            return;
        }

        miner = Miner.onLogin(params, ip, portData, pushMessage);

        if(miner.error) {
            sendReply(miner.error);
            return;
        }
        
        Miner.Connected[miner.id] = miner;

        sendReply(null, {
            id: miner.id,
            job: miner.getJob(),
            algo:miner.Coin.algo,
            status: 'OK'
        });

        EventManager.parallel('pool:miners:connected',(fn,next) => {
        	fn(miner, next)
        })

        break;
        case 'getjob':
        if (!miner){
            sendReply('Unauthenticated');
            return;
        }
        miner.heartbeat();
        sendReply(null, miner.getJob());
        break;
        case 'submit':
        if (!miner){
            sendReply('Unauthenticated');
            return;
        }

        const job = miner.onSubmit(params);
        
        if(job.error) {
            checkBan(miner, false);
            perIPStats[miner.ip] = { validShares: 0, invalidShares: 999999 };
            return sendReply(job.error);
        }

        var blockTemplate = currentBlockTemplate.height === job.height ? currentBlockTemplate : validBlockTemplates.filter(function(t){
            return t.height === job.height;
        })[0];

        if (!blockTemplate){
            sendReply('Block expired');
            return;
        }

        const Share = miner.Coin.Share;
        const share = Share.processRecord(miner, job, blockTemplate, params);

        const shareAccepted = share.isAccepted;
        checkBan(miner, shareAccepted);
        
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
        
        if (!shareAccepted){
            sendReply('Rejected share: invalid result',miner);
            return;
        }

        const now = Date.now() / 1000 | 0;
        miner.shareTimeRing.append(now - miner.lastShareTime);
        miner.lastShareTime = now;
        //miner.retarget(now);

        sendReply(null, {status: 'OK'});
        break;
        case 'keepalived' :
        if (!miner){
            sendReply('Unauthenticated');
            return;
        }
        miner.heartbeat();
        sendReply(null, { status:'KEEPALIVED' });
        break;
        default:
        sendReply('Invalid method', miner);
        log('warn', logSystem, 'Invalid method: %s (%j) from (%s@%s)', [method, params, miner?miner.login:'', ip]);
        break;
    }
}

/**
 * Return if IP has been banned
 **/
 
 function IsBannedMiner(miner) {
    return IsBannedIp(miner.ip, miner.Coin.coinName);
}

function IsBannedIp(ip, coinAlias) {

    const config = global.CoinCollection[coinAlias].Config;

    var banningEnabled = config.poolServer.banning && config.poolServer.banning.enabled;

    if (!banningEnabled || !bannedIPs[ip]) return false;

    var bannedTime = bannedIPs[ip];
    var bannedTimeAgo = Date.now() - bannedTime;
    var timeLeft = config.poolServer.banning.time * 1000 - bannedTimeAgo;
    if (timeLeft > 0){
        return true;
    }

    delete bannedIPs[ip];
    log('info', logSystem, 'Ban dropped for %s', [ip]);
    return false;
}

function checkBan(miner, validShare){
    if (!banningEnabled) return;

    // Init global per-ip shares stats

    if (!perIPStats[miner.ip]){
        perIPStats[miner.ip] = { validShares: 0, invalidShares: 0 };
    }

    var stats = perIPStats[miner.ip];
    validShare ? stats.validShares++ : stats.invalidShares++;
    const config = miner.Coin.Config;
    if (stats.validShares + stats.invalidShares >= config.poolServer.banning.checkThreshold){
        if (stats.invalidShares / stats.validShares >= config.poolServer.banning.invalidPercent / 100){

            validShare ? miner.validShares++ : miner.invalidShares++;
            
            log('warn', logSystem, 'Banned %s@%s', [miner.login, miner.ip]);
            
            bannedIPs[miner.ip] = Date.now();
            
            process.send({
                type: 'banIP', ip: miner.ip
            });
            
            global.EventManager.parallel('pool:miners:disconnected',(fn,next) => {
                fn(miner,'banned', next)
            })
        }
        else{
            stats.invalidShares = 0;
            stats.validShares = 0;
        }
    }
}



/**
 * Start pool server on TCP ports
 **/
 var httpResponse = ' 200 OK\nContent-Type: text/plain\nContent-Length: 20\n\nMining server online';

 function startPoolServerTcp(callback){
    EventManager.parallel('pool:beforeStart', (fn, next) => {
        fn()
    }, e => {
        poolStart(callback);
    })        
}

function poolStart(callback){

    async.each(config.poolServer.ports, function(portData, cback){
        let handleMessage = function(socket, jsonData, pushMessage){
            if (!jsonData.id) {
                log('warn', logSystem, 'Miner RPC request missing RPC id');
                return;
            } else if (!jsonData.method) {
                log('warn', logSystem, 'Miner RPC request missing RPC method');
                return;
            } else if (!jsonData.params) {
                log('warn', logSystem, 'Miner RPC request missing RPC params');
                return;
            }

            const sendReply = function(error, result){
               if(!socket.writable) return;

               const sendData = JSON.stringify({
                id: jsonData.id,
                jsonrpc: "2.0",
                error: error ? {code: -1, message: error} : null,
                result: result
            }) + "\n";

               socket.write(sendData);
                // if(error && result){
                // 	redisClient.hincrby(config.coin + ':unique_workers:' + result.login + "~" + result.workname, 'error', 1);
                // }
            }

            handleMinerMethod(jsonData.method, jsonData.params, socket.remoteAddress, portData, sendReply, pushMessage);
        };

        const socketResponder = function(socket){
            socket.setKeepAlive(true);
            socket.setEncoding('utf8');

            let dataBuffer = '';

            let pushMessage = function(method, params){
                if(!socket.writable) return;
                var sendData = JSON.stringify({
                    jsonrpc: "2.0",
                    method: method,
                    params: params
                }) + "\n";
                socket.write(sendData);
            };

            socket.on('data', function(d){
                dataBuffer += d;
                if (Buffer.byteLength(dataBuffer, 'utf8') > 10240){ //10KB
                    dataBuffer = null;
                    log('warn', logSystem, 'Socket flooding detected and prevented from %s', [socket.remoteAddress]);
                    socket.destroy();
                    return;
                }
                if (dataBuffer.indexOf('\n') !== -1){
                    var messages = dataBuffer.split('\n');
                    var incomplete = dataBuffer.slice(-1) === '\n' ? '' : messages.pop();
                    for (var i = 0; i < messages.length; i++){
                        var message = messages[i];
                        if (message.trim() === '') continue;
                        let jsonData;
                        try{
                            jsonData = JSON.parse(message);
                        }
                        catch(e){
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

                            log('warn', logSystem, 'Malformed message from %s: %s', [socket.remoteAddress, message]);
                            socket.destroy();
                            break;
                        }
                        
                        try {
                            handleMessage(socket, jsonData, pushMessage);
                        } catch (e) {
                            console.log(e);
                            log('warn', logSystem, 'Malformed handle message from ' + socket.remoteAddress + ' generated an exception. Message: ' + message);
                            if (e.message) {
                              log('warn', logSystem, 'Exception: ' + e.message);
                          }
                      }
                  }
                  dataBuffer = incomplete;
              }
          }).on('error', function(err){
            if (err.code !== 'ECONNRESET')
                log('warn', logSystem, 'Socket error from %s %j', [socket.remoteAddress, err]);
        }).on('close', function(){
            pushMessage = function(){};
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
    } 
    else {
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