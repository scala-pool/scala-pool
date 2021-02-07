const fs = require('fs');
const path = require('path');


const readConfigCoin = coin => {
	try {
		const configFile = path.join(process.cwd(),"config",`${coin}.js`);
    	return JSON.parse(fs.readFileSync(configFile));
	} catch(e){
	    console.error('Failed to read config file ' + configFile + '\n\n' + e);
	    process.exit();
	}
}
module.exports = coins => {
	const coinCollection = {};

	if(coins) {
		if(coins.indexOf(',')){
			const enableCoins = coins.split(',');
			for(let coin in enableCoins) {
			    coinCollection[coin] = readConfigCoin(coin);
			}
		} else {
			coinCollection[coins] = readConfigCoin(coins);
		}
	} else {
		const configPath = path.join(process.cwd(),"config");

		const files = fs.readdirSync(configPath);

		for(let i in files) {
			const file = files[i];
			const coin = file.replace(".js","");
			
			if(coin.indexOf('default') || coin.indexOf('config')) {
				continue;
			}

			const fullPath = path.join(configPath, file);
	        if (!fs.statSync(fullPath).isDirectory()){
				coinCollection[coin] = readConfigCoin(coin);
	        }
		}
	}

	return coinCollection;
}