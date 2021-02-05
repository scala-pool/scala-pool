

const test = require('ava');
const path = require('path');
const fs = require('fs');
const Miner = require(process.cwd()+'/lib/pool/Miner');
const BlockTemplate = require(process.cwd()+'/lib/pool/BlockTemplate');
global.log = x => {};

const header = '0c0cb681c6800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed700000000';
test.before(t => {
	const configFile = path.join(process.cwd(),"config",'Scala.json');
	const config = JSON.parse(fs.readFileSync(configFile));
	const Coin = require(process.cwd()+'/lib/coins/Scala');
	const coin = new Coin(config);

	global.CoinCollection = {
		'Scala' : coin
	};



	global.currentBlockTemplate = new BlockTemplate({
		  blockhashing_blob: `${header}126189b91e9b2110aef8deabd36cb996cc6e494410dda0c67ae4b19a7a47011b01`,
		  blocktemplate_blob: `${header}02e90101ffad0102d8f11602393d8ff9019e243939492b1e364ccf3736a6caff78f1b7c2ec200026678cb2b1c8d00702c750c85327407044c04c7d335216d5aed082006d8c8ea48e74f6ad8771cf578555016f7b84a8e391ff73c6352d6acd6e04d72cadfa2d53ae50cca904a70f1e9d0e230211000000000000000000000000000000000001eacb2c5f9289905403f9ee5bb51199f7854f4cf8344294562a8325674a2b609e0000`,
		  difficulty: 25000,
		  difficulty_top64: 0,
		  expected_reward: 500000,
		  height: 173,
		  next_seed_hash: '',
		  prev_hash: '24d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed7',
		  reserved_offset: 159,
		  seed_hash: '3fa5c8976978f52ad7d8fc3663e902a229a232ef987fc11ca99628366652ba99',
		  seed_height: 0,
		  status: 'OK',
		  untrusted: false,
		  wide_difficulty: '0x61a8'
	});


});

test("Tests on getting a job",t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF',
		pass:"x",
		agent:'xlarig',
	} 

	const ip = "127.0.0.1";
	const portData = {
		"port": 3333,
		"difficulty": 10000,
		"desc": "Props Low end hardware diff: 10000",
		"poolType":"props",
		"donation":0,
		"coinAlias" : "Scala"
	};

	const miner = Miner.onLogin(params, ip, portData);
	miner.heartbeat();
	console.log(miner.getJob());
	const job = miner.getJob();
	t.is(job.height, 173);
	t.is(job.blob.substring(0,86), header);
	t.is(job.algo, "panthera");
	t.is(job.target, "b88d0600");
	t.is(job.seed_hash, "3fa5c8976978f52ad7d8fc3663e902a229a232ef987fc11ca99628366652ba99");

})
