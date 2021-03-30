const Ban = require('./Ban');

class BanManager {

	static get BAN_DROP() {
		return 0;
	}

	static get BAN_START() {
		return 1;
	}

	static get RESPONSE_VALID_SHARE() {
		return 2;
	}

	static get RESPONSE_INVALID_SHARE() {
		return 3;
	}

	static get RESPONSE_MALFORMED() {
		return 4;
	}








	static bannedIps = new Map();
	static monitorIPs  = new Map();
	static perIPStats  = new Map();
	static bannedMiners  = new Map();
	
	static get config() {
		return {
			banningEnabled:true,
			banningTime: global.config.poolServer.banning.time  * 1000,
			banningThreshold: global.config.poolServer.banning.checkThreshold || 30, 
			banningPercent: (global.config.poolServer.banning.invalidPercent / 100) || 0.5,
			banningIncremental: false
		}
	}

	/**
	 * Return if IP has been banned
	 **/
	 static IsBannedIp(ip) {
	 	const config = BanManager.config;

	 	if (!config.banningEnabled) {
	 		return false;
	 	} 

	 	const lastBannedTime = BanManager.bannedIps.get(ip);

	 	if(!lastBannedTime) {
	 		return false;
	 	}

	    const bannedTimeAgo = Date.now() - lastBannedTime; //How long been ban

	    var dt = new Date();

	    const timeLeft = config.banningTime - bannedTimeAgo;

	    if (timeLeft > 0){
	    	return true;
	    } 

	    BanManager.bannedIps.delete(ip);
	    log('info', logSystem, 'Ban dropped for %s', [ip]);
	    return false;

	}

	static setToBan(ip, expires) {
		BanManager.bannedIps.set([ip,expires]);
		BanManager.monitorBan.delete(ip);
	}

	static onIpCheck(ip, banType) {
		const config = BanManager.config;

		if(BanManager.IsBannedIp(ip)) {
			return;
		}

		//If BanManager is banned ip but not for malformed
		if(banType === BanManager.RESPONSE_MALFORMED) {
			let monIp = BanManager.monitorIPs.get(ip);
			
			if(!monIp) {
				monIp = new MonitorBan(ip);
				BanManager.monitorIPs.add([ip, monIp]);
			}

			//if not pool worker send to pool worker
			if(process.share.env.workerName !== 'poolWorker') {
				process.send({ 
					type: 'validShare', 
					ip,
					banType,
				});
				return;
			}

			if(monIp.maxReached()) {
				BanManager.monitorIPs.delete(monIp);
				// BanManager.bannedIPs.set([ip, Date.now()]);
				// monIp.
				const banObject = new Ban(ip);
				BanManager.bannedIPs.set([ip, banObject]);
				banObject.expires = config.banningTime;

				banObject.bind(function() {
					BanManager.bannedIps.delete(ip);
					process.send({
						type: 'banIp',
						ip,
						banType: BanManager.BAN_DROP,	
					})
				}).run()

				process.send({ 
					type: 'banIp',
					ip,
					banType: BanManager.BAN_START,	
				});
			}

			return;
		}


		if(process.share.env.workerName !== 'poolWorker') {
			process.send({ 
				type: 'validShare', 
				ip,
				banType,
			});
			return;
		}


		let stats = BanManager.perIPStats.get(ip);

		if (!stats) {
			stats = { validShares: 0, invalidShares: 0, malformed: 0 };
			BanManager.perIPStats.set([ip, ipstats]);
		}

		switch(tp) {
			case BanManager.RESPONSE_MALFORMED:
			default:
			stats.malformed++;
			break;
			case BanManager.RESPONSE_INVALID_SHARE:
			stats.invalidShares++;
			break;
			case BanManager.RESPONSE_VALID_SHARE:
			stats.validShares++;
			break;
		}

		if (!config.banningEnabled) return;

		const shares = stats.validShares + stats.invalidShares;

		if (shares >= config.banningThreshold){

			const invalidPercent = stats.invalidShares / shares;

			if (invalidPercent >=  config.banningPercent) {
				log('warn', logSystem, 'Banned %s', [ip]);

				BanManager.bannedIPs.set(ip, Date.now());
				process.send({type: 'banIp', ip});
			}
		}



		BanManager.perIPStats.set([miner.ip, stats]);
	}

	static onMinerCheck(miner, validShare) {
		const minerip = `${miner.login}@${miner.ip}`;
		validShare ? miner.validShares++ : miner.invalidShares++;
		BanManager.onIpCheck(miner.ip, validShare);
	}


	static onInterval() {

	}

	static warnIp(ip) {
		BanManager.
	}
}