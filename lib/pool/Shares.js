const logSystem = "pool/shares";
const utils = require("../utils.js");
class Shares {
	#_miner = null;
	#_job; 
	#_shareType;
	#_shareBuffer;
	#_shareDiff;
	#_hashHex;
	#_blockTemplate;
	#_isAccepted = false;
	#_isBlockCandidate = false;
	#_shareTrustEnabled = false;
	#_shareTrustStepFloat = 0;
	#_shareTrustMinFloat = 0;

	get trustEnabled() {
		return this.#_shareTrustEnabled;
	}

	get trustStepFloat() {
		return this.#_shareTrustStepFloat;
	}

	get trustMinFloat() {
		return this.#_shareTrustMinFloat;
	}

	get coinAlias() {
		return global.config.coin;
	}

	get workerAlias() {
		return this.miner.workerAlias;
	}

	get miner() {
		return this.#_miner;
	}

	get job() {
		return this.#_job;
	}

	get shareDiff() {
		return this.#_shareDiff;
	}
	set shareDiff(value) {
		this.#_shareDiff = value;
	}

	get jobDiff() {
		return this.#_job.difficulty;
	}

	get donations() {
		return this.#_job.difficulty * (this.#_miner.donations || 0);
	}

	get hashHex() {
		return this.#_hashHex;
	}

	get type() {
		return this.#_shareType;
	}

	get poolType() {
		return this.#_miner.poolType || 'props';
	}

	get isAccepted() {
		return this.#_isAccepted;
	}

	get isBlockCandidate() {
		return this.#_isBlockCandidate;
	}

	set isBlockCandidate(value) {
		this.#_isBlockCandidate = value;
	}

	get shareBuffer() {
		return this.#_shareBuffer;
	}
	get blockTemplate() {
		return this.#_blockTemplate;
	}
	constructor(miner, job, blockTemplate, params) {
		this.#_miner = miner;
		this.#_job = job;
		this.#_blockTemplate = blockTemplate;
		this.#_shareTrustEnabled = global.config.poolServer.shareTrust && global.config.poolServer.shareTrust.enabled;
		this.#_shareTrustStepFloat = this.#_shareTrustEnabled ? global.config.poolServer.shareTrust.stepDown / 100 : 0;
		this.#_shareTrustMinFloat = this.#_shareTrustEnabled ? global.config.poolServer.shareTrust.min / 100 : 0;

		let nonce = params.nonce;
	    let resultHash = params.result;
	    let template = Buffer.alloc(blockTemplate.buffer.length);
	    if (!miner.proxy) {
	        blockTemplate.buffer.copy(template);
	        template.writeUInt32BE(job.extraNonce, blockTemplate.reserveOffset);
	    } else {
	        blockTemplate.buffer.copy(template);
	        template.writeUInt32BE(job.extraNonce, blockTemplate.reserveOffset);
	        template.writeUInt32BE(params.poolNonce, job.clientPoolLocation);
	        template.writeUInt32BE(params.workerNonce, job.clientNonceLocation);
	    }

	    try {
	        this.#_shareBuffer = utils.cnUtil.construct_block_blob(template, Buffer.from(nonce, 'hex'), 0);
	    } catch (e) {
	        log('error', logSystem, "Can't get share buffer with nonce %s from %s@%s: %s", [nonce, miner.login, miner.ip, e]);
	        this.#_shareBuffer = null;
	        // return null;
	    }
	}




}

module.exports = Shares;
