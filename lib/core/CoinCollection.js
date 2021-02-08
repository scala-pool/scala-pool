const fs = require('fs');
const path = require('path');
const cluster = require('cluster');


const coinCollection = {};

const checkField = (cfg, field, dont_throw) => {
	if(cluster.isWorker) {
		return;
	}
	const c = (!(field in cfg));
	if(dont_throw) {
		return c;
	}

	if(c) {
		throw new Exception(`Missing field : ${field} in config`);
	}
};

const verifyConfigData = (configData, dont_save) => {


	if(!configData) {
		throw new Error("Invalid configData contents");
	}

	const checkAddress = [];
	
	checkField(configData,'coin');
	checkField(configData.coin,'units');
	checkField(configData.coin,'difficultyTarget');
	checkField(configData.coin,'paymentId');
	checkField(configData.coin.paymentId,'enabled');
	if(configData.coin.paymentId.enabled) {
		checkField(configData.coin.paymentId,'addressSeparator');
	}
	checkField(configData.coin,'fixedDiff');
	checkField(configData.coin.fixedDiff,'enabled');
	if(configData.coin.fixedDiff.enabled) {
		checkField(configData.coin.fixedDiff,'addressSeparator');
	}
	checkField(configData.coin,'donations');
	checkField(configData.coin.donations,'enabled');
	if(configData.coin.donations.enabled) {
		checkField(configData.coin.donations,'addressSeparator');
		checkField(configData.coin.donations,'address');
		checkAddress.push(configData.coin.donations.address);
	}

	checkField(configData,'pool');
	checkField(configData.pool,'timeout');
	checkField(configData.pool,'clusterForks');
	checkField(configData.pool,'poolAddress');
	checkAddress.push(configData.pool.poolAddress);
	checkField(configData.pool,'blockRefreshInterval');
	checkField(configData.pool,'minerTimeout');
	if(configData.pool.ssl) {
		checkField(configData.pool.ssl,'key');
		checkField(configData.pool.ssl,'ca');
		checkField(configData.pool.ssl,'cert');
	}

	checkField(configData.pool,'ports');
	const coinObjects = [];
	let varDiff = {};
	if(configData.pool.varDiff) {
		varDiff = configData.pool.varDiff;
	}
	for(let i in configData.pool.ports) {
		checkField(configData.pool.ports[i],'port');
		checkField(configData.pool.ports[i],'difficulty');
		checkField(configData.pool.ports[i],'desc');
		checkField(configData.pool.ports[i],'poolType');
		checkField(configData.pool.ports[i],'donation');
		checkField(configData.pool.ports[i],'coinAlias');

		if(!~coinObjects.indexOf(configData.pool.ports[i].coinAlias)) {
			coinObjects.push(configData.pool.ports[i].coinAlias);
		}

		if(!configData.pool.ports[i].varDiff) {
			configData.pool.ports[i].varDiff = varDiff;
		}

		checkField(configData.pool.ports[i],'varDiff');
		checkField(configData.pool.ports[i].varDiff,'minDiff');
		checkField(configData.pool.ports[i].varDiff,'maxDiff');
		checkField(configData.pool.ports[i].varDiff,'targetTime');
		checkField(configData.pool.ports[i].varDiff,'retargetTime');
		checkField(configData.pool.ports[i].varDiff,'variancePercent');
		checkField(configData.pool.ports[i].varDiff,'maxJump');
	}

	checkField(configData.pool,'shareTrust');
	checkField(configData.pool.shareTrust,'enabled');
	if(configData.pool.shareTrust.enabled) {

		checkField(configData.pool.shareTrust,'enabled');
		checkField(configData.pool.shareTrust,'min');
		checkField(configData.pool.shareTrust,'stepDown');
		checkField(configData.pool.shareTrust,'threshold');
		checkField(configData.pool.shareTrust,'penalty');
	}


	checkField(configData.pool,'banning');
	checkField(configData.pool.banning,'enabled');
	if(configData.pool.banning.enabled) {

		checkField(configData.pool.banning,'enabled');
		checkField(configData.pool.banning,'time');
		checkField(configData.pool.banning,'invalidPercent');
		checkField(configData.pool.banning,'checkThreshold');
	}

	for(let i in coinObjects) {
		const coinAlias = coinObjects[i];
		const Coin = require(path.join(process.cwd(),'lib','coins',coinAlias));
		const coin = new Coin(configData);

		if(!cluster.isWorker) {
			for(let a in checkAddress) {
				const address = checkAddress[a];
				if(!coin.validateMinerAddress(address)) {
					throw new Error(`Invalid address ${address}`);
				}
			}
		}
		if(!dont_save) {
			coinCollection[coinAlias] = coin;
		}
	}
}

module.exports = {
	verify: verifyConfigData,
	init: (coins, configPath) => {
		if(!configPath) {
			configPath = path.join(process.cwd(), 'config');
		}

		for(let i in coins) {
			let coin = coins[i];
			const configFile = path.join(configPath,`${coin}.json`);
			let configData;
			try {
		    	configData = JSON.parse(fs.readFileSync(configFile));
			} catch(e){
			    console.error('Failed to read config file ' + configFile + '\n\n' + e);
			    process.exit();
			}
	    	if(!configData.enabled) {
	    		continue;
	    	}
		    	
		    verifyConfigData(configData);
		}
		return coinCollection;		
	}
}
