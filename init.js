/* Scala Pool
 * Copyright Scala-network	<https://github.com/scala-network/scala-pool>
 * Copyright StelliteCoin	<https://github.com/stellitecoin/cryptonote-stellite-pool>
 * Copyright Ahmyi			<https://github.com/ahmyi/cryptonote-stellite-pool>
 * Copyright Dvandal    	<https://github.com/dvandal/cryptonote-nodejs-pool>
 * Copyright Fancoder   	<https://github.com/fancoder/cryptonote-universal-pool>
 * Copyright zone117x		<https://github.com/zone117x/node-cryptonote-pool>
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

const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

// Initialize log system
const logSystem = 'init';
/**
 * Load pool configuration
 **/
const args = require("args-parser")(process.argv);

global.config = require('./lib/core/bootstrap')(args.config || 'config.json');
const ModuleSpawner = require('./lib/core/ModuleSpawner');

global.CoinCollection = require('./lib/core/CoinCollection')(args.coin);

require('./lib/logger.js');
const em = require('./lib/event_manager');
global.EventManager = new em();


global.redisClient = require('redis').createClient((function(){
	const options = { 
		host:global.config.redis.host || "127.0.0.1",
		socket_keepalive:true,
		port:global.config.redis.port || 6379, 
		retry_strategy: function (options) {
	        if (options.error && options.error.code === 'ECONNREFUSED') {
	            // End reconnecting on a specific error and flush all commands with
	            // a individual error
	        	log('error', logSystem,'The server refused the connection');
				return;
	        }
	        if (options.total_retry_time > 1000 * 60 * 60) {
	            // End reconnecting after a specific timeout and flush all commands
	            // with a individual error
	            return new Error('Retry time exhausted');
	        }
	        if (options.attempt > 10) {
	            // End reconnecting with built in error
	            return undefined;
	        }
	        // reconnect after
	        return Math.min(options.attempt * 100, 3000);
	    },
		db: config.redis.db || 0,
	};
	
	if(config.redis.auth){
		options.auth_pass= config.redis.auth;
	}
	return options;
})());

global.redisClient.on('error', function (err) {
    log('error', logSystem, "Error on redis with code : %s",[err.code]);
});

require('./lib/exceptionWriter.js')(logSystem);

if(ModuleSpawner.attach()) return;


// Pool informations
log('info', logSystem, 'Starting Scala Node.JS pool version %s', [global.config.version]);

/**
 * Start modules
 **/
(function(){

	const init = function(){
		const validModules = ModuleSpawner.validModules;
		const reqModules = (function(){
			if(!args.module){
				return validModules;
			}
			const modules = args.module.split(",");
			const loadModules = [];
		    for (let i in modules){
		    	const moduleName = modules[i].toLowerCase();
	            if (!~validModules.indexOf(moduleName)){
	            	log('error', logSystem, 'Invalid module "%s", valid modules: %s', [moduleName, validModules.join(', ')]);
	            	process.exit();
	            	return;
	            }
	            loadModules.push(moduleName);
		    }
		    return loadModules;
		})();

	            
        if (reqModules.length === 0){
        	reqModules = validModules;
        }

        const listenersKey = [];
        let key = true;
        for(let i in reqModules){
        	switch(reqModules[i]){
	            case 'pool':
	            case 'payments':
	            case 'api':
	            case 'charts':
	            case 'web':
	            case 'unlocker':
					ModuleSpawner.spawn(reqModules[i], global.config);
	        		listenersKey.push(reqModules[i]);
	            	break;
	            default:
	            	key = false;
	            	break;
	        }
        }
    };
    
    /**
	 * Check redis database version
	 **/
	redisClient.info(function(error, response){
        if (error){
            log('error', logSystem, 'Redis version check failed');
            return;
        }
        var parts = response.split('\r\n');
        var version;
        var versionString;
        for (var i = 0; i < parts.length; i++){
            if (parts[i].indexOf(':') !== -1){
                var valParts = parts[i].split(':');
                if (valParts[0] === 'redis_version'){
                    versionString = valParts[1];
                    version = parseFloat(versionString);
                    break;
                }
            }
        }
        
        if (!version){
            log('error', logSystem, 'Could not detect redis version - must be super old or broken');
        } else if (version < 2.6){
            log('error', logSystem, "You're using redis version %s the minimum required version is 2.6. Follow the damn usage instructions...", [versionString]);
        } else {
        	init();
        }
    });
})();
