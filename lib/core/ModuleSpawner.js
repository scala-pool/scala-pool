const logSystem = "core/ModuleSpawner";
const cluster = require('cluster');

class ModuleSpawner {

	static validModules = ['pool', 'api', 'unlocker', 'payments', 'charts',"web"];

	#_cfg = {
		enabeld: false,
		clusterForks:1,
		timeout:60,

	};

	#_module = "";

	constructor(module,cfg) {
		const numForks = (function(){
			if (!cfg.clusterForks){
				return 1;
			}
			if (cfg.clusterForks === 'auto' || cfg.clusterForks === 'max'){
				return os.cpus().length;
			}
			if (isNaN(cfg.clusterForks)){
				return 1;
			}
			return cfg.clusterForks;
		})();

		cfg.clusterForks = numForks;
	}

	get module() {
		return this.#_module;
	}

	#_onMessage(msg) {
		switch(msg.type){
			case 'statsCollector':
			Object.keys(cluster.workers).forEach(function(id) {
				if (cluster.workers[id].type === 'api'){
					cluster.workers[id].send({type: 'statsCollector', data: msg.data});
				}
			});	
			break
			case 'banIP':
			Object.keys(cluster.workers).forEach(function(id) {
				if (cluster.workers[id].type === 'pool'){
					cluster.workers[id].send({type: 'banIP', ip: msg.ip});
				}
			});
			break;
			case 'blockTemplate':
			Object.keys(cluster.workers).forEach(function(id) {
				if (cluster.workers[id].type === 'pool'){
					cluster.workers[id].send({type: 'blockTemplate', block: msg.block});
				}
			});
			break;
			case 'jobRefresh':
			Object.keys(cluster.workers).forEach(function(id) {
				if (cluster.workers[id].type === 'poolWorker'){
					cluster.workers[id].send({type: 'jobRefresh'});
				}
			});
			break;
		}
	}

	static spawn(mod, cfg){
		const ms = new ModuleSpawner(mod, cfg);
		console.log(cfg);
		if (!ms.config.enabled) {
			return;
		}

		const createWorker = function(workerType, forkId){
			const worker = cluster.fork({
				workerType: workerType,
				forkId: forkId
			});
			worker.forkId = forkId;
			worker.type = workerType;
			worker.on('exit', function(code, signal){
				log('error', logSystem, '%s fork %s died, spawning replacement worker...', [workerType, forkId]);
				setTimeout(function(){
					createWorker(workerType, forkId);
				}, cfg.timeout || 2000);
			}).on('message', ms.onMessage);
		};


		let i = 0;
		setTimeout(() => {
			let spawnInterval = setInterval(function(){
				i++;
				if (i -1 === cfg.clusterForks ){
					log('info', logSystem, 'Api spawned on %d thread(s)', [cfg.clusterForks ]);
					clearInterval(spawnInterval);
					return;
				}
				createWorker(mod, i.toString());
			}, 10);
		},20)

	}

	static attach() {
		// Load pool modules
		if (!cluster.isWorker){
			return false;
		}

		switch(process.env.workerType){
			case 'web':
			require('./lib/web.js');
			break;
			case 'pool':
			require(path.join(process.cwd(),'/lib/pool.js'));
			break;
			case 'poolWorker':
			require(path.join(process.cwd(),'/lib/pool/worker.js'));
			break;
			case 'listener':
			break;
			case 'unlocker':
			require('./lib/blockUnlocker.js');
			break;
			case 'payments':
			require('./lib/paymentProcessor.js');
			break;
			case 'api':
			require('./lib/api.js');
			break;
			case 'charts':
			require('./lib/chartsDataCollector.js');
			break;
			default:
			console.error(`Invalid worker type ${process.env.workerType}`)
		}
		return true;

	}
}

module.exports = ModuleSpawner;