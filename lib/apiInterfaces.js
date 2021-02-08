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
 
var http = require('http');
var https = require('https');

function jsonHttpRequest (host, port, data, callback, path) {
	path = path || '/json_rpc';
	callback = callback || function () {};
	var options = {
		hostname: host,
		port: port,
		path: path,
		method: data ? 'POST' : 'GET',
		headers: {
			'connection': 'keep-alive',
			'Content-Length': data.length,
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	};
	var req = (port === 443 ? https : http)
		.request(options, function (res) {
			var replyData = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				replyData += chunk;
			});
			res.on('end', function () {
				var replyJson;
				try {
					replyJson = replyData ? JSON.parse(replyData) : {};
				} catch (e) {
					callback(e, {});
					return;
				}
				callback(null, replyJson);
			});
		});

	req.on('error', function (e) {
		callback(e, {});
	});

	req.end(data);
}



/**
 * Send RPC request
 **/
function rpc (host, port, method, params, callback) {
	var data = JSON.stringify({
		id: "0",
		jsonrpc: "2.0",
		method: method,
		params: params
	});
	jsonHttpRequest(host, port, data, function (error, replyJson) {
		if (error) {
			callback(error, {});
			return;
		}
		callback(replyJson.error, replyJson.result)
	});
}

/**
 * Send RPC requests in batch mode
 **/
function batchRpc(host, port, array, callback){
    var rpcArray = [];
    for (var i = 0; i < array.length; i++){
        rpcArray.push({
            id: i.toString(),
            jsonrpc: "2.0",
            method: array[i][0],
            params: array[i][1]
        });
    }
    var data = JSON.stringify(rpcArray);
    jsonHttpRequest(host, port, data, callback);
}

/**
 * Send RPC request to pool API
 **/
function poolRpc(host, port, path, callback){
    jsonHttpRequest(host, port, '', callback, path);
}


/**
 * Exports API interfaces functions
 **/


module.exports = cfg => {
	return {
	    batchRpcDaemon: function(batchArray, callback){
	        batchRpc(cfg.daemon.host, cfg.daemon.port, batchArray, callback);
	    },
	    rpcDaemon: function(method, params, callback){
	        rpc(cfg.daemon.host, cfg.daemon.port, method, params, callback);    
	    },
	    rpcWallet: function(method, params, callback){
	        rpc(cfg.wallet.host, cfg.wallet.port, method, params, callback);
	    },
	    pool: function(path, callback){
	        poolRpc(cfg.api.host, cfg.api.port, path, callback);
	    },
	    jsonHttpRequest: jsonHttpRequest
	}
};
