/* Scala Nodejs Pool
 * Copyright Scala          <https://github.com/scala-network/scala-pool>
 * Copyright StelliteCoin   <https://github.com/stellitecoin/cryptonote-stellite-pool>
 * Copyright Ahmyi      <https://github.com/ahmyi/cryptonote-stellite-pool>
 * Copyright Dvandal      <https://github.com/dvandal/cryptonote-nodejs-pool>
 * Copyright Fancoder     <https://github.com/fancoder/cryptonote-universal-pool>
 * Copyright zone117x   <https://github.com/zone117x/node-cryptonote-pool>
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

const bignum = require('bignum');
const utils = require('../utils');
const logSystem = "pool/miner";
/**
 * Miner
 **/


class Miner {
    workerName;
    login;

    difficulty;
    noRetarget;
    workerAlias;
    trust = false;
    blockTemplate;
    #_response;
    #_coin;

    get ip() {
        if(!this.#_response) return false;
        return this.#_response.ip;
    }
    get Coin() {
        return this.#_coin;
    }

    validJobs = [];

    VarDiff = {
        variance: null,
        bufferSize: 0,
        tMin: 0,
        tMax: 0,
        maxJump: 0
    };
 

    get coinAlias() {
        return this.miner.Coin.coinName;
    }

    static  onPoolRefresh(bt) {
        const miners = Object.keys(Miner.Connected);
        if(miners.length <= 0) return;

        const start = process.hrtime.bigint();

        async.each(miners,function(minerID,done) {
            const miner = Miner.Connected[minerID];
            // miner.cachedJob = null;
            miner.response.push('job', miner.getJob())
            done()
        }, () => {
            const end = process.hrtime.bigint();
            log('info', logSystem, 'Distributed work to %s miners time taken %s', [miners.length, utils.readableSI(Number(end - start)," ", "nsecs", true)]);
        });
    }

    static Connected = {}
    
    static getWorkerName(params) {
        let workerName = params.rigid ? params.rigid.trim() : '';
        if (!workerName) {
            workerName = params.pass;
        }

        if (!workerName || workerName === '') {
            workerName = 'undefined';
        }
        workerName = utils.cleanupSpecialChars(JSON.stringify(workerName));
        return workerName;
    }

    static splitDonations(login, portDataDonations, addressSeparator) {
      
        if(portDataDonations > 1) {
            portDataDonations = portDataDonations / 100;
        } 


        let donations = 0;
        addressSeparator = addressSeparator || '%' 
        const escaped_delimiter = (addressSeparator + '').replace(/([.\\+*?\[\]^$()])/g, '\\$1');

        login = login.replace(new RegExp(escaped_delimiter + "(\\d+(?:\\.\\d+)?|\\.\\d+)" + escaped_delimiter), function(match, p1) {
            donations = parseFloat(p1);
            return '';
        });

        if(!donations && portDataDonations) {
            return {donations:portDataDonations, login};
        }

        if(donations > 0 && donations <= 1) {
            return {donations, login};
        }


        if(donations < 0) {
            donations = Math.abs(donations);
        } 

        if(donations > 1 && donations <= 100) {
            donations = donations / 100;
        } 

        if(donations  > 1) {
            donations = 1;
        } 


        return {donations, login};
    }


    static parseDifficulty(login, difficulty, addressSeparator, varDiff) {


        addressSeparator = addressSeparator || '+' 
        let diffValue;
        let noRetarget = false;
        const reg = new RegExp('\\'+addressSeparator + '\\d+');

        if(reg.test(login)) {
            login = login.replace(reg, function(match, p1) {
                diffValue = parseInt(match.replace(addressSeparator,""));
                return '';
            });
        }
        if(diffValue) {
            difficulty = diffValue;
        }

        if (difficulty < varDiff.minDiff) {
            difficulty = varDiff.minDiff;
        }else if(difficulty > varDiff.maxDiff) {
            difficulty = varDiff.maxDiff;
        } else {
            noRetarget = true;
        }
        return {login, difficulty, noRetarget};
        
    }

    static preBannedOnLogin = {};

    
    constructor(response, portData) {
        this.id = utils.uid();

        let login = response.params.login;
        if (!login){
            this.#_error = "Missing login params";
            return;
        }

        const params = response.params;

        /*
        * CREATE MINER
        */
        this.port = portData.port;
        this.poolType = portData.poolType || 'props';

        /*
        * LINK COIN TO MINER
        */
        let Coin = CoinCollection[portData.coinAlias];
        // console.log(CoinCollection);
        if(!Coin) {
            return new MinerError("Invalid coin to mine");
        }
        this.Coin = Coin;
        const config = Coin.Config;
        
        /*
        * SETUP WORKERNAME
        */
        this.pass = params.pass;
        this.workerName = Miner.getWorkerName(params);

        /*
        * SETUP DONATIONS
        */
        let donations = 0;
        if ('donations' in config.poolServer && config.poolServer.donations.enabled) {
           const o =  Miner.splitDonations(login, portData.donations,config.poolServer.donations.addressSeparator);
           login = o.login;
           donations = o.donations;
       }
       
       this.donations = donations;

        /*
        * SETUP DIFFICULTY
        */
        let difficulty = portData.difficulty;

        if('fixedDiff' in config.poolServer && config.poolServer.fixedDiff.enabled) {
            const o = Miner.parseDifficulty(login, portData.difficulty, config.poolServer.fixedDiff.addressSeparator, config.poolServer.varDiff);
            login = o.login;
            difficulty = o.difficulty;
            this.noRetarget = o.noRetarget;
        } else {
            this.noRetarget = false;
        }

        this.difficulty = difficulty;

        /*
        * ADDRESS VALIDATION
        */

        const addressType = Coin.validateMinerAddress(login);
        let currentInMinute = Math.floor(Date.now() / 60000);
        const maxAttempts = 100;
        const timeLimit = 2;

        if(!addressType) {
            
            let addressPrefix = utils.getAddressPrefix(login);
            
            if (!addressPrefix) {
                addressPrefix = 'N/A';
            }

            log('warn', logSystem, 'Invalid address used for login (prefix: %s): %s', [addressPrefix, params.login]);
            this.#_error = 'Invalid address used for login';
            return;
        }

        if('paymentId' in config.poolServer && config.poolServer.paymentId.enabled && addressType === 2) {
            const addr = login.split(config.poolServer.paymentId.addressSeparator);
            this.wallet = addr[0] || null;
            this.paymentId = addr[1] || null;
        } else {
            this.wallet = login;
            this.paymentId = null;
        }


        /*
        * MINER VARIABLES DEFINITION
        */

        this.pushMessage;
        this.login = login;
        this.ip = ip;

        this.agent = params.agent;
        this.proxy = (params.agent && params.agent.includes('xmr-node-proxy'));

        this.portData = portData;
        this.heartbeat();
        this.workerAlias = login + '~' + this.workerName
        this.shareTimeRing = utils.ringBuffer(16);
        this.lastShareTime = Date.now() / 1000 | 0;

        // this.VarDiff related variables
        if (this.Coin.Share.trustEnabled) {
            this.trust = {
                threshold: config.poolServer.shareTrust.threshold,
                probability: 1,
                penalty: 0
            };
        }

        /*
        * DIFFICULTY DEFINITIONS
        */

        const variance = config.poolServer.varDiff.variancePercent / 100 * config.poolServer.varDiff.targetTime;
        this.VarDiff = {
            variance: variance,
            bufferSize: config.poolServer.varDiff.retargetTime / config.poolServer.varDiff.targetTime * 4,
            tMin: config.poolServer.varDiff.targetTime - variance,
            tMax: config.poolServer.varDiff.targetTime + variance,
            maxJump: config.poolServer.varDiff.maxJump
        };


        return miner;
    }

    heartbeat(){
        this.lastBeat = Date.now();
        return this;
    }

    retarget(now){

        const options = this.Coin.Config.poolServer.varDiff;

        const sinceLast = now - this.lastShareTime;
        const decreaser = sinceLast > this.VarDiff.tMax;

        const avg = this.shareTimeRing.avg(decreaser ? sinceLast : null);
        let newDiff;

        var direction;

        if (avg > this.VarDiff.tMax && this.difficulty > options.minDiff){
            newDiff = options.targetTime / avg * this.difficulty;
            newDiff = newDiff > options.minDiff ? newDiff : options.minDiff;
            direction = -1;
        } else if (avg < this.VarDiff.tMin && this.difficulty < options.maxDiff){
            newDiff = options.targetTime / avg * this.difficulty;
            newDiff = newDiff < options.maxDiff ? newDiff : options.maxDiff;
            direction = 1;
        } else{
            return;
        }

        if (Math.abs(newDiff - this.difficulty) / this.difficulty * 100 > options.maxJump){
            var change = options.maxJump / 100 * this.difficulty * direction;
            newDiff = this.difficulty + change;
        }
        this.setNewDiff(newDiff);
        this.shareTimeRing.clear();
        if (decreaser){
        	this.lastShareTime = now;	
        } 
    }

    setNewDiff(newDiff){
        newDiff = Math.round(newDiff);
        if (this.difficulty === newDiff) {
        	return;
        }
        // log('info', logSystem, 'Retargetting difficulty %d to %d for %s', [this.difficulty, newDiff, this.login]);
        this.pendingDifficulty = newDiff;
        this.pushMessage('job', this.getJob());
    }



    getTargetHex(){
        if (this.pendingDifficulty){
            this.lastDifficulty = this.difficulty;
            this.difficulty = this.pendingDifficulty;
            this.pendingDifficulty = null;
        }

        let padded = Buffer.alloc(32);
        padded.fill(0);
        
        var diffBuff = diff1.div(this.difficulty).toBuffer();
        diffBuff.copy(padded, 32 - diffBuff.length);

        var buff = padded.slice(0, 4);
        var buffArray = buff.toByteArray().reverse();
        let buffReversed = Buffer.from(buffArray);
        this.target = buffReversed.readUInt32BE(0);
        var hex = buffReversed.toString('hex');
        return hex;
    }

    getJob(){

        if (global.currentBlockTemplate && this.lastBlockHeight === global.currentBlockTemplate.height && !this.pendingDifficulty && this.cachedJob !== null) {
            return this.cachedJob;
        }
        if(!global.currentBlockTemplate) {
            log("error",logSystem, "No block template set");
        }

        let newJob = {
            id: utils.uid(),
            height: global.currentBlockTemplate.height,
            submissions: []
        };

        let blob = this.proxy ? global.currentBlockTemplate.nextBlobWithChildNonce() : global.currentBlockTemplate.nextBlob();
        this.lastBlockHeight = global.currentBlockTemplate.height;
        let target = this.getTargetHex();

        newJob.difficulty = this.difficulty
        newJob.diffHex = this.diffHex
        newJob.extraNonce = global.currentBlockTemplate.extraNonce
        newJob.seed_hash = global.currentBlockTemplate.seed_hash
        newJob.next_seed_hash = global.currentBlockTemplate.next_seed_hash

        this.validJobs.push(newJob);

        while (this.validJobs.length > 4)
            this.validJobs.shift();

        this.cachedJob = {
            job_id: newJob.id,
            id: this.id
        };

        if (this.proxy) {
            newJob.clientPoolLocation = global.currentBlockTemplate.clientPoolLocation
            newJob.clientNonceLocation = global.currentBlockTemplate.clientNonceLocation

            this.cachedJob.blocktemplate_blob = blob
            this.cachedJob.difficulty = global.currentBlockTemplate.difficulty
            this.cachedJob.height = global.currentBlockTemplate.height
            this.cachedJob.childHeight = this.lastChildBlockHeight
            this.cachedJob.reserved_offset = global.currentBlockTemplate.reserveOffset
            this.cachedJob.client_nonce_offset = global.currentBlockTemplate.clientNonceLocation
            this.cachedJob.client_pool_offset = global.currentBlockTemplate.clientPoolLocation
            this.cachedJob.target_diff = this.difficulty
            this.cachedJob.target_diff_hex = this.diffHex

        } else {
            this.cachedJob.blob = blob
            this.cachedJob.target = target
        }

        this.cachedJob.algo = this.Coin.algo;
        this.cachedJob.height = global.currentBlockTemplate.height
        if (newJob.seed_hash) {
            this.cachedJob.seed_hash = newJob.seed_hash;
            this.cachedJob.next_seed_hash = newJob.next_seed_hash;
        }
        return this.cachedJob;
    }


    beforeSubmit(_params) {
        const params = _params || this.response.params;
        this.heartbeat();
        
        const minerText = ` ${this.login} @ ${this.ip}`;

        if (!params.nonce || !params.result) {
            log('warn', logSystem, 'Malformed miner share: %s from (%s@%s)', [JSON.stringify(params), miner?miner.login:'', ip])
            this.#_error = 'Attack detected';
            return;
        }

        if (params.nonce && !noncePattern.test(params.nonce) || params.result && !noncePattern.test(params.result)) {
            log('warn', logSystem, 'Malformed miner nonce: %s from %s', [JSON.stringify(params), minerText]);
            this.#_error = 'Duplicate share';
        }


        const job = this.validJobs.filter(function(job){
            return job.id === params.job_id;
        })[0];

        if (!job){
            return new MinerError('Invalid job');
        }

        // Force lowercase for further comparison
        const nonce = params.nonce.toLowerCase();

        if (!this.proxy) {
            
            if (job.submissions.indexOf(nonce) !== -1){
                log('warn', logSystem, 'Duplicate share: %s from ',  JSON.stringify(params), minerText);
                return new MinerError('Duplicate share');
            }

            job.submissions.push(nonce);
        } else {

            if (!Number.isInteger(params.poolNonce) || !Number.isInteger(params.workerNonce)) {
                log('warn', logSystem, 'Malformed nonce: %s from ',  JSON.stringify(params), minerText);
                return new MinerError('Malformed nonce');
            }

            const nonce_test = `${nonce}_${params.poolNonce}_${params.workerNonce}`;
            if (job.submissions.indexOf(nonce_test) !== -1) {
                log('warn', logSystem, 'Duplicate share: %s from ',  JSON.stringify(params), minerText);
                return new MinerError('Duplicate share');
            }
            job.submissions.push(nonce_test);

        }

        return job;
    }
};

module.exports = Miner;