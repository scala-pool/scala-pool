'use strict'
 
const fs = require('fs')
const path = require('path')
const util = require('util')
const readJson = require('read-package-json')
const packageJson = util.promisify(readJson)
const jsonlint = require("jsonlint-mod");

module.exports = function(coins, configFolder){
	configFolder = configFolder || path.join(process.cwd, 'config');

	let config = null
	const configFile = path.join(configFolder,"config.json");
	let configData;
	try {
		configData = fs.readFileSync(configFile);
	} catch(e){
	    console.error('Failed to read config file ' + configFile + '\n\n' + e);
	    process.exit();
	}

	try {
		config = JSON.parse(configData);
	} catch(e){
	    console.error('Failed to parse config file ' + configFile + '\n\n' + e);
	    process.exit();
	}
    	

	if(!coins) {
		coins = fs.readdirSync(configFolder, {withFileTypes: true}).filter(item => !item.isDirectory()  && item.name !== 'config.json' && path.extname(item.name) === 'json').map(item => item.name.replace('.json',''));
	}

	global.CoinCollection = require('./CoinCollection').init(coins);
    for(let [alias,coin] of Object.entries(global.CoinCollection)) {

        const ports = coin.Config.pool.ports;
    	const paymentTypes = [];
        for(let i in ports) {
        	const port = ports[i];
	        const poolType = port.poolType || 'props'
	        if(!!~paymentTypes.indexOf(poolType)) {
	            continue;
	        }
	        paymentTypes.push(poolType);
	    }

    	config.payment_supported = paymentTypes;
    }

    config.version = 0
    
    try {
    	const pjson = JSON.parse(fs.readFileSync(path.join(process.cwd(),'package.json')));
    	config.version = pjson.version;
	} catch(e){
	    console.error('Failed to read config file ' + configFile + '\n\n' + e);
	    process.exit();
	}
	
	global.config = config;
}
