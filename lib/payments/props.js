
const async = require('async');
const Blocks = require('../model/Blocks');

const roundUpPercent = (percent) => {
	return parseFloat(parseFloat(percent).toFixed(5));
}

const logSystem = "payments/props";

module.exports.afterSubmit = (replies, miner, job, shareDiff, blockCandidate, hashHex, blockTemplate)  => {
    
    if(!blockCandidate) {
      return []
    }
    const coin = miner.Coin.alias;

    const redCmd = [];
    let totalShares = replies[replies.length -1][0];
    let donate = replies[replies.length -1][1];
    const block = new Blocks({
        hash: hashHex,
        timestamp: Date.now() / 1000 | 0,
        difficulty: blockTemplate.difficulty,
        shares: totalShares,
        donations: donate,
        miner: miner.login,
        poolType: 'props',
        height: job.height
    });

    redCmd.push(['zadd',coin + ':blocks:candidates',job.height, block.toRedis()]);

    // redisClient.multi(redCmd).exec(function(err, replies){
    //   if (err){
    //       log('error', logSystem, 'Failed inserting block candidate %s \n %j', [hashHex, err]);
    //   }

    // });
    return redCmd;

}

module.exports.blockCandidate = (miner, job, shareDiff, hashHex, shareType, blockTemplate) => {

         let redisCommands = [];

    const coin = global.config.coin
    
    redisCommands.push(["rename", coin + ':props:block_donations:current',coin + ':block_donations:round' + job.height])
    redisCommands.push(['rename', coin + ':props:shares_actual:roundCurrent', coin + ':shares_actual:round' + job.height]);
    redisCommands.push(['hmget', coin + ':shares_actual:round' + job.height, ['total','donations']]);
    return redisCommands;
}

module.exports.recordShare = (miner, job, shareDiff, hashHex, shareType, blockTemplate) => {
      let redisCommands = [];

    const diff = job.difficulty;
    const donations = diff * (miner.donations || 0);
    const shares =  diff - donations;
    const login = miner.login
    const coin = global.config.coin


    redisCommands.push(['hincrby', coin + ':props:shares_actual:roundCurrent', login, shares]);
    redisCommands.push(['hincrby', coin + ':props:shares_actual:roundCurrent', 'donations', donations]);
    redisCommands.push(['hincrby', coin + ':props:shares_actual:roundCurrent', 'total', diff]);

    redisCommands.push(['hincrby', coin + ':stats', 'totalShares_props', diff]);
    redisCommands.push(['hincrby', coin + ':stats', 'roundShares_props', diff]);

    return redisCommands;
}

module.exports.unlocker = (blocks, mainCallback) => {

  const unblockStatsRedis = {};
  const addBlockStats = (height,wallet,key,value) => {
    if(!(height in unblockStatsRedis)){
      unblockStatsRedis[height] = {};
    }

    if(!(wallet in unblockStatsRedis[height])){
      unblockStatsRedis[height][wallet]={
        shares:0,
        earn:0, 
        percent:0.0,
        donations:0.0,
        unlockReward:0.0,
        coin:'scala'
      };  
    }
    
    if(!(key in unblockStatsRedis[height][wallet])){
      return;
    }
    if(key === 'coin') {
      unblockStatsRedis[height][wallet][key] = value;
      return;
    }

    unblockStatsRedis[height][wallet][key]=parseFloat(unblockStatsRedis[height][wallet][key])+parseFloat(value);
  }




  async.waterfall([
    /**
    * Get percent for each
    **/
    callback => {
      const unlockedBlocksCommands = [];
      const payments = {};
      let totalBlocksUnlocked = 0;

      for(let i =0;i< blocks.length;i++) {

        const block = blocks[i];

        if(!(block.height in unblockStatsRedis)) {
          unblockStatsRedis[block.height] = {};
          unblockStatsRedis[block.height]["Info"] = block.toRedis();
        }

        if (block.orphaned) {
          continue;
        }

        const coin = block.coin;
        const Coin = CoinCollection[coin];

        totalBlocksUnlocked++;

        unlockedBlocksCommands.push(['del', coin + ':shares_actual:round' + block.height]);
        unlockedBlocksCommands.push(['zrem', coin + ':blocks:candidates', block.serialized]);
        unlockedBlocksCommands.push(['zadd', coin + ':blocks:matured', block.height, block.toRedis()]);

        let reward = block.reward;

        if(Coin.networkFee > 0) {
          reward -= (reward * Coin.networkFee)
        }

        let unblockerAward = 0.0;

        let unblockerAwardFee = Coin.unlockerReward;
        if(unblockerAwardFee > 0){
          unblockerAward = roundUpPercent(block.reward * unblockerAwardFee);
          reward -= unblockerAward;
          payments[block.miner] = (payments[block.miner] || 0) + unblockerAward;
        }

        log('info', logSystem, 'Unlocked block height %d with reward %d. Miners reward: %d Unlocker reward %f', [
          block.height, block.reward, reward,unblockerAward
         ]);

        let actTotalScore = parseFloat(block.shares);

        if(block.donations > 0) {
          let donar = {};
          const worker = Coin.Config.coin.donation ? Coin.Config.coin.donation.address : Coin.Config.pool.poolAddress;
          block.workerShares[worker] = (block.workerShares[worker] || 0) + block.donations;

        }

        if(poolFee > 0) {
          const poolFeeReward = reward * poolFee;
          const worker = Coin.Config.pool.poolAddress;
          if(worker !== false){
            payments[worker] = (payments[worker] || 0) + poolFeeReward;

          }
          reward -= poolFeeReward;
        }

        if(Coin.devFee > 0) {
          const devFeeReward = reward * devFee;
          const worker = Coin.devAddresses;
          if(worker !== false){
            payments[worker] = (payments[worker] || 0) + devFeeReward;

          }
          reward -= devFeeReward;
        }

        const totalScore = reward / actTotalScore;
        
        if (block.workerShares) {
          for(let a=0;a<Object.keys(block.workerShares).length;a++) {
            const worker = Object.keys(block.workerShares)[a];
            let share =  block.workerShares[worker]
            let percent = block.workerShares[worker] / block.shares;

            const workerReward = roundUpPercent(reward * percent);
            payments[worker] = (payments[worker] || 0) + workerReward;
            if(haveBlockUnlockerAward && worker === block.miner){
              payments[worker] += unblockerAward;
              addBlockStats(block.height,worker,"unlockReward",unblockerAward);
              log('info', logSystem, '-- %s | %d%% | %s | %s', [
                worker, percent*100, parseFloat(workerReward /100).toFixed(2),parseFloat(unblockerAward/100).toFixed(2)
                ]);
            } else {
              log('info', logSystem, '-- %s | %d%% | %s | 0.00', [worker, percent*100, parseFloat(workerReward/100).toFixed(2)]);    
            }

            addBlockStats(block.height,worker,'shares',share);
            addBlockStats(block.height,worker,'percent',percent);
            addBlockStats(block.height,worker,'earn',workerReward);

          }
        }
      }

      log('info', logSystem, 'Unlocked %d blocks', [totalBlocksUnlocked]);

      if (Object.keys(payments).length === 0){
        log('info', logSystem, 'No payments yet (%d pending)', [blocks.length]);
        callback(true);
        return;
      }

      log('info', logSystem, 'Payments avaliable to %d wallets', [Object.keys(payments).length]);


      for (let i=0;i< Object.keys(payments).length;i++) {
        const worker = Object.keys(payments)[i];
        let amount = parseInt(payments[worker]);
        log('info', logSystem, (i+1)+'. %s | %s ', [worker, parseFloat(amount / 100).toFixed(2)]);    
        unlockedBlocksCommands.push(['hincrbyfloat', global.config.coin + ':workers:' + worker, 'balance', amount]);
      }
      redisClient.multi(unlockedBlocksCommands).exec((e,r) => {
        if(e) {
          log('error', logSystem, 'Error with fetching blocks %j', [e]);
          callback(true);
          return;
        }
        log('info', logSystem, 'Unblocking successful for %d commands', [unlockedBlocksCommands.length]);

        callback(null);
      });
    },
    /**
    * Get donation per height per worker and set statistic stuff only
    **/
    (callback) => {

      const cmdRedis = [];
      const blockStatsHeight = Object.keys(unblockStatsRedis);

      const finalCommandments = [];
      for(let i = 0;i<blockStatsHeight.length;i++){
        const height = blockStatsHeight[i];
        cmdRedis.push(['hgetall',global.config.coin+":block_donations:"+height]);
        cmdRedis.push(['del',global.config.coin+":block_donations:"+height]);
      }

      redisClient.multi(cmdRedis).exec((e,r) => {
        if(e) {
          log('error', logSystem, 'Error with fetching blocks %j', [e]);
          callback(true);
          return;
        }

        log('info', logSystem, 'Setting up stats for block donations %d', [r.length /2]);
        
	       let x = 0;
        for(let i=0;i<r.length;i+=2) {
          x++;
          const height = blockStatsHeight[x];          
          if(r[i]) {
            const donors = Object.keys(r[i]);
            for(let a=0;a<donors.length;a++ ) {
              const wallet = donors[a];
              const donate = r[i][wallet];
              addBlockStats(height, wallet,'donations',donate);
            }
          } 
	 
          const blockStatsWallets = unblockStatsRedis[height];

          if(blockStatsWallets) {
              const wallets = Object.keys(blockStatsWallets);  

              for(let w =0;w<wallets.length;w++){
               const wallet = wallets[w];
               const stats = blockStatsWallets[wallet];
               stats.height = height

               const shareKeys = JSON.stringify(stats);
               finalCommandments.push(["hmset",global.config.coin+":block_shares:"+height,wallet,shareKeys]);
               if(wallet !== "Info"){
                finalCommandments.push(["zadd", global.config.coin+":block_scoresheets:"+wallet,height,shareKeys]);
              }
          }
        }
      }

      log('info', logSystem, 'Creating statistics with %d cmds', [finalCommandments.length]);

      if(finalCommandments.length === 0) {
        callback(null);
        return;
      }

      redisClient.multi(finalCommandments).exec(function(error, replies){
        if (error){
          log('error', logSystem, 'Error with unlocking blocks %j', [error]);
        }

        callback(null);
      });

    });
  }], mainCallback);
}
