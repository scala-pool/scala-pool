/**
 * Block template
 **/
const utils = require('../utils');
const previousOffset = 7;

/**
 * Convert buffer to byte array
 **/
 Buffer.prototype.toByteArray = function () {
    return Array.prototype.slice.call(this, 0);
};

// Set instance id
const instanceId = utils.instanceId();

 class BlockTemplate {
    static #_currentBlockTemplate;
    static get Current() {
        return this.#_currentBlockTemplate;
    }   

    #_coin = {};

    constructor(template){
        this.blob = template.blocktemplate_blob;
        this.blocktemplate_blob = template.blockhashing_blob.substring(7,39);
        this.difficulty = template.difficulty;
        this.height = template.height;
        this.reserveOffset = template.reserveOffset || template.reserved_offset;
        this.seed_hash = template.seed_hash;
        this.next_seed_hash = template.next_seed_hash;
        this.buffer = Buffer.from(this.blob, 'hex');
        instanceId.copy(this.buffer, this.reserveOffset + 4, 0, 4);
        this.previous_hash = Buffer.alloc(32);
        this.buffer.copy(this.previous_hash, 0, previousOffset, 39);
        this.extraNonce = 0;
        this.prev_hash = template.prev_hash;

        // The clientNonceLocation is the location at which the client pools should set the nonces for each of their clients.
        this.clientNonceLocation = this.reserveOffset + 12;
        // The clientPoolLocation is for multi-thread/multi-server pools to handle the nonce for each of their tiers.
        this.clientPoolLocation = this.reserveOffset + 8;
        this.compare = function(result){
            return (this.height != result.height || result.toString('hex') !== this.prev_hash.toString('hex') || (this.num_transactions === 0 && result.num_transactions > 0))
        };
        this.nextBlob = function(){
            this.buffer.writeUInt32BE(++this.extraNonce, this.reserveOffset);
            return utils.cnUtil.convert_blob(this.buffer, 0).toString('hex');
        };
        this.nextBlobWithChildNonce = function(){
            // Write a 32 bit integer, big-endian style to the 0 byte of the reserve offset.
            this.buffer.writeUInt32BE(++this.extraNonce, this.reserveOffset);
            // Don't convert the blob to something hashable.  You bad.
            return this.buffer.toString('hex');
        };
    }

    static refresh(block, connectedMiners) {
        const callback = onRefresh || function(t){};
        let buffer = Buffer.from(block.blocktemplate_blob, 'hex');
        let new_hash = Buffer.alloc(32);
        buffer.copy(new_hash, 0, previousOffset, 39);
        try {
            if (!global.currentBlockTemplate ||  global.currentBlockTemplate.compare(block)) {
                log('info', logSystem, 'New %s block to mine at height %d w/ difficulty of %d (%d transactions)', [
                    global.config.coin, 
                    block.height, 
                    block.difficulty, (block.num_transactions || 0)
                ]);
                BlockTemplate.Valids.push(BlockTemplate.Current);
                if (BlockTemplate.Valids.length > 3) {
                    BlockTemplate.Valids.shift();
                }
                const bt = new this(template);
                global.currentBlockTemplate = bt;
                
                const miners = Object.keys(connectedMiners);
                if(miners.length <= 0) {
                    return
                }

                const start = process.hrtime.bigint();

                async.each(miners,function(minerID,done) {
                    const miner = connectedMiners[minerID];
                    miner.cachedJob = null;
                    miner.pushMessage('job', miner.getJob())
                    done()
                }, () => {
                    const end = process.hrtime.bigint();
                    log('info', logSystem, 'Distributed work to %s miners time taken %s', [miners.length, utils.readableSI(Number(end - start)," ", "nsecs", true)]);
                });
            } 
        } catch (e) {
            log('error', logSystem, `BlockTemplate ${e}`)
        }
    }
}

module.exports = BlockTemplate;