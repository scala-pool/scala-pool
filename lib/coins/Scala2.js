'use strict'

const Coin = require('../model/Coin');

class ScalaCoin extends Coin {
	
	get algo(){
		return "panthera";
	}

	devAddresses = "Svk7VUPASsbZhFErf8rEfuEEX94GWsSWKVS8GNAUDfH363EsSLZ58wd3rph8okcaFALthwMkQ4fWJBzYYjqA3Lk61McroQbno";
	donationAddress = "SvjVtrdgZ4kR3YXaZ3yzvd1Vr13dU4c4HbfcTZsnEo9YJD47vrVtkZqQFHWWX9GunAUDq4iFA2jdo8eBua3cE96W1y9eSpgCk";

	/**
	 * Validate miner address
	 **/
	 
	validAddress = {
	    main: new RegExp('^S+([1-9A-HJ-NP-Za-km-z]{96})$'),
	    integratedAddress: new RegExp('^Si+([1-9A-HJ-NP-Za-km-z]{107})$'),
	    paymentId: new RegExp('^([0-9a-fA-F]{16}|[0-9a-fA-F]{64})$'),
	    subAddress: new RegExp('^Ss+([1-9A-HJ-NP-Za-km-z]{96})$')
	}

	CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = 155;//S
	CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = 26009;//Si
	CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = 23578;//Ss


}

module.exports = ScalaCoin;