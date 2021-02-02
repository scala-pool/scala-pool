const test = require('ava');
const path = require('path');
const fs = require('fs');
const Miner = require(process.cwd()+'/lib/pool/Miner');
global.log = x => {};
test.before(t => {
	const configFile = path.join(process.cwd(),"config",'Scala.json');
	const config = JSON.parse(fs.readFileSync(configFile));
	const Coin = require(process.cwd()+'/lib/coins/Scala');
	const coin = new Coin(config);

	global.CoinCollection = {
		'Scala' : coin
	};
})

test("Test pool login handler", t => {
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
	t.is(miner.login, params.login);
	t.is(miner.difficulty, portData.difficulty);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.donations, portData.donation);
	t.is(miner.Coin.symbol, 'XLA');
});

test("Test pool login handler with custom difficulty", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+500',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF");
	t.is(miner.difficulty, 500);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.donations, portData.donation);
	t.is(miner.Coin.symbol, 'XLA');
});



test("Test pool login handler with donations", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF%10%',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF");
	t.is(miner.difficulty, portData.difficulty);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.donations, 0.1);
	t.is(miner.Coin.symbol, 'XLA');
});

test("Test pool login handler with paymentID", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1");
	t.is(miner.difficulty, portData.difficulty);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.donations, portData.donation);
	t.is(miner.Coin.symbol, 'XLA');
});

test("Test pool login handler with wrong paymentID", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1ss',
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
	t.is(miner.error, "Invalid address used for login");
});

test("Test pool login handler combine paymentID+donations+difficulty", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1%5%+20000',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1");
	t.is(miner.difficulty, 20000);
	t.is(miner.donations, 0.05);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.Coin.symbol, 'XLA');
});


test("Test pool login handler combine donations+paymentID+difficulty", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF%5%.4d9cb6c83330d8b1+20000',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1");
	t.is(miner.difficulty, 20000);
	t.is(miner.donations, 0.05);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.Coin.symbol, 'XLA');
});

test("Test pool login handler combine difficulty+donations+paymentID", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+20000%5%.4d9cb6c83330d8b1',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1");
	t.is(miner.difficulty, 20000);
	t.is(miner.donations, 0.05);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.Coin.symbol, 'XLA');
});


test("Test pool login handler combine difficulty+paymentID+donations", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+20000.4d9cb6c83330d8b1%5%',
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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF.4d9cb6c83330d8b1");
	t.is(miner.difficulty, 20000);
	t.is(miner.donations, 0.05);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.Coin.symbol, 'XLA');
});

test("Test pool login handler combine malform difficulty+paymentID+donations", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+2133ddd.4d9cb6c83330d8b1%5%',
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
	t.is(miner.error, "Invalid address used for login");
});


test("Test pool login handler combine  difficulty+malform paymentID+donations", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+2133.4d9cb6c83330d8b1s%5%',
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
	t.is(miner.error, "Invalid address used for login");
});

test("Test pool login handler combine  difficulty+paymentID+malform donations", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF+2133.4d9cb6c83330d8b1s%11a%',
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
	t.is(miner.error, "Invalid address used for login");
});

test("Test pool login handler with donations more than 100%", t => {
	const params = {
		login: 'Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF%500%',
		pass:"x",
		agent:'xlarig',
	};

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
	t.is(miner.login, "Svk1ZQ6mPfjhYR3Nnp3kifZLimjuDcmyMHecLmY6Ek2QbGQi93XzkJFbdFDaQZVdBF2V43q79z2UTirvJcHT3TnC2h988J2hF");
	t.is(miner.difficulty, portData.difficulty);
	t.is(miner.workerName, params.pass);
	t.is(miner.Coin.alias, portData.coinAlias);
	t.is(miner.donations, 1);
	t.is(miner.Coin.symbol, 'XLA');
});

