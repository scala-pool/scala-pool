const test = require('ava')
const Payment = require('../../lib/payments/payment_system')('global');


module.exports = (payType) => {
	return (payType in collector || payType === 'global') ? collector[payType] : {
		unlocker : (blocks, mainCallback)  => {
			mainCallback("Invalid payment type")
		},
		recordShare: () => {
			return rediscmd;
		},
		blockCandidate: (miner, job, shareDiff, hashHex, shareType, blockTemplate) => {
			return rediscmd;
		},
		afterSubmit: (results, miner, job, shareDiff, blockCandidate, hashHex, shareType, blockTemplate) => {
			return []
		}

	};
}


test("Test Unlocking", t => {
	
});

test("Test recordShare", t => {
	Payment.recordShare(blockCandidate);
});

test("Test blockCandidate", t => {
	Payment.blockCandidate(miner,job, shareDiff, blockCandidate, hashHex, shareType, blockTemplate);
});

test("Test afterSubmit", t => {
	Payment.afterSubmit(results,miner,job, shareDiff, blockCandidate, hashHex, shareType, blockTemplate);
});