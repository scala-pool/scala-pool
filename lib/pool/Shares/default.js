const utils = require('../../utils.js');
const bignum = require('bignum');

const logSystem = "model/Share";
let cryptoNight = require('cryptonight-hashing')['randomx'];



const diff1 = bignum('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 16);

class DefaultShare {
	#_miner = null;
	#_job; 
	#_shareType;
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

	get coin() {
		return this.miner.Coin;
	}

	get coinAlias() {
		return this.miner.Coin.coinName;
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

	static processRecord(miner, job, blockTemplate, params) {
		const share = new Share(miner, job, blockTemplate);
		return share.process(params);
	}

	constructor(miner, job, blockTemplate) {
		this.#_miner = miner;
		this.#_job = job;
		this.#_blockTemplate = blockTemplate;
		const config = CoinCollections[miner.coinAlias];
		this.#_shareTrustEnabled = config.poolServer.shareTrust && config.poolServer.shareTrust.enabled;
		this.#_shareTrustStepFloat = this.#_shareTrustEnabled ? config.poolServer.shareTrust.stepDown / 100 : 0;
		this.#_shareTrustMinFloat = this.#_shareTrustEnabled ? config.poolServer.shareTrust.min / 100 : 0;

	}


	recordShareData(shareDiff, hashHex) {

		let redisCommands = paymentSystem(this.poolType).recordShare(this);

		redisCommands.concat(paymentSystem('global').recordShare(this));

		if (this.isBlockCandidate){
			redisCommands.concat(paymentSystem('global').blockCandidate(this));
			redisCommands.concat(paymentSystem(this.poolType).blockCandidate(this));
		}

		redisClient.multi(redisCommands).exec(function(err, replies){
			if (err){
				log('error', logSystem, 'Failed to insert share data into redis %j \n %j', [err, redisCommands]);
				return;
			}

			const redCmd = paymentSystem(this.poolType).afterSubmit(replies, this) || [];

			if(redCmd.length > 0) {
				redisClient.multi(redCmd).exec((ee,rr) => {});
			}

		});

		if(this.isBlockCandidate) {
			EventManager.parallel('pool:block:found',(fn, next) => {
				fn(connectedMiners,{
					height:job.height,
					poolType: miner.poolType
				}, next)
			})
		}

	    // log('info', logSystem, 'Accepted %s share %d at difficulty %d from %s@%s', [shareType, job.difficulty, shareDiff, miner.login, miner.ip]);
	}


	/**
	* Process miner share data
	*/
	process(params) {
		/*
		* Process Share Buffer
		*/
		let nonce = params.nonce;
		let resultHash = params.result;
		let template = Buffer.alloc(this.#_blockTemplate.buffer.length);
		if (!this.#_miner.proxy) {
			this.#_blockTemplate.buffer.copy(template);
			template.writeUInt32BE(this.#_job.extraNonce, this.#_blockTemplate.reserveOffset);
		} else {
			this.#_blockTemplate.buffer.copy(template);
			template.writeUInt32BE(this.#_job.extraNonce, this.#_blockTemplate.reserveOffset);
			template.writeUInt32BE(params.poolNonce, this.#_job.clientPoolLocation);
			template.writeUInt32BE(params.workerNonce, this.#_job.clientNonceLocation);
		}

		try {
			let shareBuffer = utils.cnUtil.construct_block_blob(template, Buffer.from(nonce, 'hex'), 0);
		} catch (e) {
			log('error', logSystem, "Can't get share buffer with nonce %s from %s@%s: %s", [nonce, this.#_miner.login, this.#_miner.ip, e]);
			return null;
		}

		if (!shareBuffer) {
			this.#_isAccepted = false;
			return;
		}
		/*
		* Validate Share
		*/

		let hash;
		let shareType;

		if (shareTrustEnabled && this.#_miner.trust.threshold <= 0 && this.#_miner.trust.penalty <= 0 && Math.random() > this.#_miner.trust.probability){
			hash = Buffer.from(resultHash, 'hex');
			this.#_shareType = 'trusted';
		} else {
			let convertedBlob = utils.cnUtil.convert_blob(shareBuffer, 0);
			let hard_fork_version = convertedBlob[0];

			hash = cryptoNight(convertedBlob, Buffer.from(this.#_blockTemplate.seed_hash, 'hex'));

			this.#_shareType = 'valid'
		}

		if (hash.toString('hex') !== resultHash) {
			log('warn', logSystem, 'Bad hash from miner %s@%s', [this.#_miner.login, this.#_miner.ip]);
			this.#_isAccepted = false;
			return;
		}


		/*
		* Submit Share
		*/
		var hashArray = hash.toByteArray().reverse();
		let hashNum = bignum.fromBuffer(Buffer.from(hashArray));
		const hashDiff = diff1.div(hashNum);

		if (hashDiff.ge(this.#_blockTemplate.difficulty)){
			const share = this;
			this.#_miner.Coin.rpcDaemon.submitBlock(shareBuffer.toString('hex'), function(error, result){
				if (error){
					log('error', logSystem, 'Error submitting block at height %d from %s@%s, share type: "%s" - %j', [share.job.height, share.miner.login, share.miner.ip, share.type, error]);
				}else{
					const blockFastHash = utils.cnUtil.get_block_id(shareBuffer, 0).toString('hex');
					log('info', logSystem,
						'Block %s found at height %d by miner %s@%s - submit result: %j',
						[blockFastHash.substr(0, 6), share.job.height, share.miner.login, share.miner.ip, result]
						);
					share.isBlockCandidate = true;
					
					share.recordShareData(hashDiff.toString(), blockFastHash);

				}
			});
		} else if (!hashDiff.lt(job.difficulty)){
			this.isBlockCandidate = false;
			this.recordShareData(hashDiff.toString(), null);
		} else{
			log('warn', logSystem, 'Rejected low difficulty share of %s from %s@%s', [hashDiff.toString(),  this.#_miner.login,  this.#_miner.ip]);
			this.#_isAccepted = false;
			return;
		}

		this.#_isAccepted = true;
		return;

	}
}


module.exports = DefaultShare;