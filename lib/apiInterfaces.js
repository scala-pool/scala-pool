/**
 * Cryptonote Node.JS Pool
 * https://github.com/dvandal/cryptonote-nodejs-pool
 *
 * Handle communications to APIs
 **/

// Load required modules
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
