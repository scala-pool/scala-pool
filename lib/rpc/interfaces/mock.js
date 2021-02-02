/* Stellite Nodejs Pool
 * Copyright StelliteCoin	<https://github.com/stellitecoin/cryptonote-stellite-pool>
 * Copyright Ahmyi			<https://github.com/ahmyi/cryptonote-stellite-pool>
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
 *
 */
 


 module.exports = (config) => {

	// const apiInterfaces = require('../../apiInterfaces.js')(config);

	return {
		/**
		 * Get Network data
		 **/
		 getNetworkData : callback => {
		    // Try get_info RPC method first if available (not all coins support it)
		    // apiInterfaces.rpcDaemon('get_info', {}, (e,r) => {
		    // 	ca
		    // });
		    callback(null,{
		    	"alt_blocks_count": 0,
		    	"block_size_limit": 600000,
		    	"block_size_median": 300000,
		    	"block_weight_limit": 600000,
		    	"block_weight_median": 300000,
		    	"bootstrap_daemon_address": "",
		    	"credits": 0,
		    	"cumulative_difficulty": 2125,
		    	"cumulative_difficulty_top64": 0,
		    	"database_size": 495616,
		    	"difficulty": 25000,
		    	"difficulty_top64": 0,
		    	"free_space": 15692689408,
		    	"grey_peerlist_size": 0,
		    	"height": 173,
		    	"height_without_bootstrap": 173,
		    	"incoming_connections_count": 0,
		    	"mainnet": true,
		    	"nettype": "mainnet",
		    	"offline": true,
		    	"outgoing_connections_count": 0,
		    	"rpc_connections_count": 1,
		    	"stagenet": false,
		    	"start_time": 1611906789,
		    	"status": "OK",
		    	"target": 120,
		    	"target_height": 0,
		    	"testnet": false,
		    	"top_block_hash": "24d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7",
		    	"top_hash": "",
		    	"tx_count": 0,
		    	"tx_pool_size": 0,
		    	"untrusted": false,
		    	"update_available": false,
		    	"version": "4.1.0-d8b9add35",
		    	"was_bootstrap_ever_used": false,
		    	"white_peerlist_size": 0,
		    	"wide_cumulative_difficulty": "0x84d",
		    	"wide_difficulty": "0x61a8"
		    });
		},

		/**
		 * Get Last Block data
		 **/
		 getLastBlockData : callback => {
		 	callback(null,{
		 		"id": "0",
		 		"jsonrpc": "2.0",
		 		"result": {
		 			"block_header": {
		 				"block_size": 148,
		 				"block_weight": 148,
		 				"cumulative_difficulty": 2125,
		 				"cumulative_difficulty_top64": 0,
		 				"depth": 0,
		 				"difficulty": 47,
		 				"difficulty_top64": 0,
		 				"hash": "24d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7",
		 				"height": 172,
		 				"long_term_weight": 148,
		 				"major_version": 12,
		 				"miner_reward": 375000,
		 				"miner_tx_hash": "ccdbd9419686b422335b9d68b5d0f79e472b306ed3a519829b96440053f4daf0",
		 				"minor_version": 12,
		 				"nonce": 3003723447,
		 				"num_txes": 0,
		 				"orphan_status": false,
		 				"pow_hash": "",
		 				"prev_hash": "513d7543c4ae17e4b6c974c3c2ff02bcb4309220e340db0771caca2453768e54",
		 				"reward": 500000,
		 				"timestamp": 1611337083,
		 				"wide_cumulative_difficulty": "0x84d",
		 				"wide_difficulty": "0x2f"
		 			},
		 			"credits": 0,
		 			"status": "OK",
		 			"top_hash": "",
		 			"untrusted": false
		 		}
		 	});
		 },

		 getBlockHeaderByHeight : (params,callback) =>{
		 	let json = {};
		 	if(params.height === 120) {
		 		json = {
		 			"id": "0",
		 			"jsonrpc": "2.0",
		 			"result": {
		 				"block_size": 147,
		 				"block_weight": 147,
		 				"cumulative_difficulty": 768,
		 				"cumulative_difficulty_top64": 0,
		 				"depth": 52,
		 				"difficulty": 12,
		 				"difficulty_top64": 0,
		 				"hash": "ad4c06a135c7059957f67c0275db0a1c3ccf89e261a1fcea03a5dfc24d578a40",
		 				"height": 120,
		 				"long_term_weight": 147,
		 				"major_version": 12,
		 				"miner_reward": 375000,
		 				"miner_tx_hash": "d9a124adb183f28f2aec1f361085dbe225b443228f860f2cdc2290637887aba6",
		 				"minor_version": 12,
		 				"nonce": 1332654656,
		 				"num_txes": 0,
		 				"orphan_status": false,
		 				"pow_hash": "",
		 				"prev_hash": "e384287cc003dc9e22ac9dfec2d6e7e1460f92ba0dc612418760013c9b2ecba1",
		 				"reward": 500000,
		 				"timestamp": 1611337080,
		 				"wide_cumulative_difficulty": "0x300",
		 				"wide_difficulty": "0xc"
		 			},
		 			"credits": 0,
		 			"status": "OK",
		 			"top_hash": "",
		 			"untrusted": false
		 		};
		 	} else {
		 		json = {
		 			"id": "0",
		 			"jsonrpc": "2.0",
		 			"result": {
		 				"block_header": {
		 					"block_size": 148,
		 					"block_weight": 148,
		 					"cumulative_difficulty": 2125,
		 					"cumulative_difficulty_top64": 0,
		 					"depth": 0,
		 					"difficulty": 47,
		 					"difficulty_top64": 0,
		 					"hash": "24d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7",
		 					"height": 172,
		 					"long_term_weight": 148,
		 					"major_version": 12,
		 					"miner_reward": 375000,
		 					"miner_tx_hash": "ccdbd9419686b422335b9d68b5d0f79e472b306ed3a519829b96440053f4daf0",
		 					"minor_version": 12,
		 					"nonce": 3003723447,
		 					"num_txes": 0,
		 					"orphan_status": false,
		 					"pow_hash": "",
		 					"prev_hash": "513d7543c4ae17e4b6c974c3c2ff02bcb4309220e340db0771caca2453768e54",
		 					"reward": 500000,
		 					"timestamp": 1611337083,
		 					"wide_cumulative_difficulty": "0x84d",
		 					"wide_difficulty": "0x2f"
		 				},
		 				"credits": 0,
		 				"status": "OK",
		 				"top_hash": "",
		 				"untrusted": false
		 			}
		 		};
		 	}

		 	callback(null,json);
		 },

		/**
		 * Get block template
		 **/
		 getBlockTemplate : (params,callback) =>{
		 	callback(null,{
		 		"id": "0",
		 		"jsonrpc": "2.0",
		 		"result": {
		 			"blockhashing_blob":  `0c0caeefd0800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7000000005c1f8c7430bc5dd56203bb60d76d6f0ca90affaecb346bb1f72c91920753722401`,
		 			"blocktemplate_blob": `0c0caeefd0800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed70000000002e90101ffad0102d8f116021c41d5be1550c701a0e26c90415c15615afd1d28d0f40e2f94f13a0fd56ddc9bc8d00702c750c85327407044c04c7d335216d5aed082006d8c8ea48e74f6ad8771cf578555013a97838f0f496755f713e83798343cc05bb0a34d4b0e1bf4e723080c7480a0f90211000000000000000000000000000000000001eacb2c5f9289905403f9ee5bb51199f7854f4cf8344294562a8325674a2b609e0000`,
		 			"difficulty": 25000,
		 			"difficulty_top64": 0,
		 			"expected_reward": 500000,
		 			"height": 173,
		 			"next_seed_hash": '',
		 			"prev_hash": '24d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7',
		 			"reserved_offset": 159,
		 			"seed_hash": '3fa5c8976978f52ad7d8fc3663e902a229a232ef987fc11ca99628366652ba99',
		 			"seed_height": 0,
		 			"status": 'OK',
		 			"untrusted": false,
		 			"wide_difficulty": '0x61a8'
		 		}
		 	});
		 },

		/**
		 * On block submit
		 **/
		 submitBlock : (params,callback) =>{
		 	apiInterfaces.rpcDaemon('submitblock', [params],callback);
		 	if(params === 'FFFFFF') {
		 		callback({
		 			"code": -7,
		 			"message": "Block not accepted"
		 		},null);
		 	}else{

		 	}
		 },
		/**
		 * Get current Height
		 **/
		 getBlockCount : callback =>{
		 	apiInterfaces.rpcDaemon('getblockcount', null, callback);
		 },
		/**
		 * Get Block Hash
		 **/
		 getBlockHash : (height,callback) => {
		 	apiInterfaces.rpcDaemon('on_getblockhash', [height], callback);
		 }

		}

	}
