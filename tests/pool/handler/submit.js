

const test = require('ava');
const path = require('path');
const fs = require('fs');
const Miner = require(process.cwd()+'/lib/pool/Miner');
const BlockTemplate = require(process.cwd()+'/lib/pool/BlockTemplate');
global.log = x => {};

const header = '0c0caeefd0800624d2492783c90e3841b1add5f251fea132feba069debab796cddc00cc4bf6ed700000000';
test.before(t => {
	const configFile = path.join(process.cwd(),"config",'scala.json');
	const config = JSON.parse(fs.readFileSync(configFile));
	const Coin1 = require(process.cwd()+'/lib/coins/Test');
	const coin1 = new Coin1(config);
	// const Coin2 = require(process.cwd()+'/lib/coins/Test');

	global.CoinCollection = {
		// 'Scala' : new Coin2(config),
		'Test' : coin1
	};

	global.portData = [{
		"port": 3333,
		"difficulty": 10000,
		"desc": "Props Low end hardware diff: 10000",
		"poolType":"props",
		"donation":0,
		"coinAlias" : "Test"
	},{
		"port": 3334,
		"difficulty": 10000,
		"desc": "Props Low end hardware diff: 10000",
		"poolType":"props",
		"donation":0,
		"coinAlias" : "Scala"
	}];


	new Promise((res,rej) => { 
		coin1.rpcDaemon.getBlockTemplate({},(e,r) => {
			if(e) {
				return rej(e);
			}

			res(r);
			global.currentBlockTemplate = new BlockTemplate(r.result);
		});
	});
});

test("Tests on submitting a job",t => {
	const loginParams = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF',
		pass:"x",
		agent:'xlarig',
	} 

	const ip = "127.0.0.1";

	const miner = Miner.onLogin(loginParams, ip, global.portData[0]).heartbeat();

	const getjob = {
		id: '713868682680705',
		height: 173,
		submissions: [ 'ca800000' ],
		difficulty: 1000,
		diffHex: undefined,
		extraNonce: 1,
		seed_hash: '3fa5c8976978f52ad7d8fc3663e902a229a232ef987fc11ca99628366652ba99',
		next_seed_hash: ''
	};

	const submitParams = {
		id: '187475633639471',
		job_id: '713868682680705',
		nonce: 'ca800000',
		result: 'e5ef0423ca64c724cabadeb6819a018a5c87c8161a0dd62628b4483b7bf41300'
	};

	miner.validJobs.push(getjob);
	const job = miner.onSubmit(submitParams);
	// console.log(job);
	// t.is('error' in job,false);
	// t.is(currentBlockTemplate.height,job.height);


 //    const Share = require(path.join(process.cwd(),'lib','pool','Shares','test.js'));
 //    const share = Share.processRecord(miner, job, blockTemplate, params);
 //    const shareAccepted = share.isAccepted;
 //    console.log(share);

})
