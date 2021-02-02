

module.exports.afterSubmit = (replies, miner, job, shareDiff, blockCandidate, hashHex, blockTemplate)  => {
    
	const redisCommands = [];
    const diff = job.difficulty;
    const donations = diff * (miner.donations || 0);
    const shares =  diff - donations;
    const poolType = miner.poolType || 'props'
    const login = miner.login
    const coin = global.config.coin
    const workerAlias = miner.workerAlias


   	redisCommands.push(['hincrby', coin + ':stats', 'totalShares', diff]);
    redisCommands.push(['hincrby', coin + ':stats', 'roundShares', diff]);

    redisCommands.push(['zadd', coin + ':hashrate', dateNowSeconds, [diff, login, dateNow].join(':')]);

    redisCommands.push(['hincrby', coin + ':workers:' + login, 'donations',donations])
    redisCommands.push(['hincrby', coin + ':workers:' + login, 'hashes', shares])
    redisCommands.push(['hset', coin + ':workers:' + login, 'lastShare', dateNowSeconds])


    if (workerAlias) {
        redisCommands.push(['zadd', coin + ':hashrate', dateNowSeconds, [diff, workerAlias, dateNow].join(':')]);
        redisCommands.push(['hincrby', coin + ':unique_workers:' + workerAlias, 'hashes', job.difficulty]);
        redisCommands.push(['hset', coin + ':unique_workers:' + workerAlias, 'lastShare', dateNowSeconds]);
        redisCommands.push(['hset', coin + ':unique_workers:' + workerAlias, 'poolType', poolType]);
        redisCommands.push(['hincrby', coin + ':unique_workers:' + workerAlias, 'donations', donations]);
        redisCommands.push(['expire', coin + ':unique_workers:' + workerAlias, (86400 * cleanupInterval)]);
    }
    
    
    return redisCommands;

}
module.exports.blockCandidate = (miner, job, shareDiff, hashHex, shareType, blockTemplate) => {

    const redisCommands = [];
    const diff = job.difficulty;
    const donations = diff * (miner.donations || 0);
    const shares =  diff - donations;
    const poolType = miner.poolType || 'props';
    const login = miner.login;
    const coin = global.config.coin;
    const workerAlias = miner.workerAlias;

    redisCommands.push(['hincrby', coin + ':stats', 'totalDiff', blockTemplate.difficulty]);
    redisCommands.push(['hincrby', coin + ':stats', 'totalDiff_'+poolType, blockTemplate.difficulty]);
    redisCommands.push(['hset', coin + ':stats', 'roundShares', 0]);
    redisCommands.push(['hset', coin + ':stats', 'roundShares'+poolType, 0]);
    redisCommands.push(['hset', coin + ':stats', 'lastBlockFound', Date.now()]);
    redisCommands.push(['hset', coin + ':stats', 'lastBlockFound_'+poolType, Date.now()]);
    redisCommands.push(['hincrby', coin + ':stats', 'blocksFound',1]);
    redisCommands.push(['hincrby', coin + ':stats', 'blocksFound_'+poolType,1]);
    redisCommands.push(['hincrby', coin + ':workers:' + login, 'blocksFound', 1]);
    redisCommands.push(['hincrby', coin + ':unique_workers:' + workerAlias, 'blocksFound', 1]);
    
    return redisCommands;
}


