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

    static refresh(block, callback) {
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
                

            } 
        } catch (e) {
            log('error', logSystem, `BlockTemplate ${e}`);
            return;
        }
        callback(bt);
    }
}

module.exports = BlockTemplate;