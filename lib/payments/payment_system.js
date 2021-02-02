'use strict'

const collector = {}
for(let i = 0;i < global.config.payments.supported.length;i++) {
	const paymentType = global.config.payments.supported[i]
	collector[paymentType] = require('./' + paymentType);
}

module.exports = (payType) => {
	return (payType in collector || payType === 'global') ? collector[payType] : {
		unlocker : (blocks, mainCallback)  => {
			mainCallback("Invalid payment type")
		},
		recordShare: (share) => {
			return [];
		},
		blockCandidate: (share) => {
			return [];
		},
		afterSubmit: (results, share) => {
			return []
		}

	};
}
