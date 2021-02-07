'use strict'

const fs = require('fs');
const path = require('path');
const utils = require('../utils');

class Coin {

	get alias () {
		return this.Config.coin;
	}

	get symbol () {
		return this.Config.symbol;
	}

	get algo(){
		return "cryptonight";
	}

	get shareClassName(){
		return "default";	
	} 

	get daemonInterfaceName(){
		return "default";
	}

	#_share = null;
	get Share() {
		if(!this.#_share) {
			this.#_share = require(path.join('..','pool','Shares' ,this.shareClassName));
		}

		return this.#_share;
	}

	Config = {};

	#_rpcDaemon;
	/**
	 * Validate miner address
	 **/
	CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = 0;//S
	CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = 0;//Si
	CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = 0;//Ss

	validAddress = {
		main: false,
		integratedAddress: false,
		paymentId: false,
		subAddress: false,
	};



	constructor(config) {
		this.Config = config;

		if(!this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX) {
			this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = parseInt(utils.cnUtil.address_decode(Buffer.from(this.Config.pool.poolAddress)).toString());
		}
		if(!this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX) {
			this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX + 1;
		}
		this.#_rpcDaemon = require('../rpc/daemon')(this.daemonInterfaceName, config.rpc);

	}


	isWithPaymentId (address, separator) {
		separator = separator || this.Config.coin.paymentId.addressSeparator;
		const addsp = address.split(separator)
		return !(addsp.length <= 1  || !this.validAddress.paymentId.test(addsp[1]) || utils.getAddressPrefix(addsp[0]) !== this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX)
	}



	// Validate miner address
	validateMinerAddress(address, separator) {
		separator = separator || this.Config.coin.paymentId.addressSeparator

		address = utils.cleanupSpecialChars(address)

		const addressPrefix = utils.getAddressPrefix(address);

		if(addressPrefix === this.CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX) {
			if(!this.validAddress.subAddress || this.validAddress.subAddress.test(address)) {
				return 4
			}
		}

		if(addressPrefix === this.CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX) {
			if(!this.validAddress.main || this.validAddress.main.test(address)) {
				return 1;
			}
		}

		if(this.isIntegratedAddress(address)) {
			return 3
		}

		if(this.isWithPaymentId(address, separator)) {
			return 2
		}

		return false

	}

	isIntegratedAddress(address) {
		const integrated_address = utils.cleanupSpecialChars(address)
		const addressPrefix = utils.getAddressPrefix(integrated_address)
		
		if(!this.validAddress.integratedAddress) {
			return addressPrefix === this.CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX;
		}

		return (this.validAddress.integratedAddress.test(integrated_address) && addressPrefix === this.CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX);
	}

	hasValidPaymentId = function(add_pymt_id) {
		const payment_id = utils.cleanupSpecialChars(add_pymt_id)
		return this.validAddress.paymentId ? this.validAddress.paymentId.test(payment_id) : true;
	}


	get rpcDaemon() {
		return this.#_rpcDaemon;
	}

}

module.exports = Coin;