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

    const dateNow = Date.now();
    const dateNowSeconds = dateNow / 1000 | 0;

    const cmds = [];
    const workerPortType = ['workers', miner.poolType].join('_');
    const porto = ['port', miner.port].join('_');
    cmds.push(['hincrby', global.config.coin + ':stats', 'workers', '+1']);
    cmds.push(['hincrby', global.config.coin + ':stats', workerPortType, '+1']);
    cmds.push(['hincrby', global.config.coin + ':stats', porto, '+1']);

    cmds.push(['hset',global.config.coin +  ':workers_ip:'+${miner.login}, miner.ip, Date.now());
    // cmds.push(['hget', global.config.coin + ':stats', ['workers',workerPortType ]]);

    // cmds.push(['sadd', global.coin + ':ip', ['port', miner.port].join('_'), '+1']);
    // redisClient.sadd(config.coin + ':workers_ip:' + miner.login, miner.ip);

    redisClient.multi(cmds).exec((e,r) => {
        if(e) {}

        // const re = [];
        // const rr = r[r.length-1];
        // re.push(['hset', global.config.coin + ':graph:connects:all', dateNowSeconds, rr[0]]);
        // re.push(['hset',global.config.coin + ':graph:connects:' + miner.poolType, dateNowSeconds, rr[1]]);
        // redisClient.multi(re).exec((ee,rr) => {});
        next();
    });

}).register('pool:miners:disconnected',{
    workerType: 'pool'
}, (miner,reason, next) => {
    const dateNow = Date.now();
    const dateNowSeconds = dateNow / 1000 | 0;

    const cmds = [];
    const workerPortType = ['workers', miner.poolType].join('_');
    const porto = ['port', miner.port].join('_');
    cmds.push(['hincrby', global.config.coin + ':stats', 'workers', '-1']);
    cmds.push(['hincrby', global.config.coin + ':stats', workerPortType, '-1']);
    cmds.push(['hincrby', global.config.coin + ':stats', porto, '-1']);
    cmds.push(['hdel',global.config.coin +  ':workers_ip:'+${miner.login}, miner.ip);

    //cmds.push(['hmget', global.config.coin + ':stats', ['workers',workerPortType]]);
    redisClient.multi(cmds).exec((e,r) => {
        if(e) {}
            
        // const re = [];
        // const rr = r[r.length-1];
        // re.push(['hset', global.config.coin + ':graph:connects:all', dateNowSeconds, rr[0]]);
        // re.push(['hset', global.config.coin + ':graph:connects:' + miner.poolType, dateNowSeconds, rr[1]]);
        // redisClient.multi(re).exec((ee,rr) => {});
        next();
    });

});
