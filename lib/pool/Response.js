

class Response {
	#_socket;
	
	disconnectTrigger = function() {};

	get isValid() {
		if(!this.#_socket) return false;
		if(this.#_socket.destroyed) return false;
		if(!this.#_socket.writable) return false;
		return true;
	}
	get ip() {
		return this.#_socket.remoteAddress;
	}

	get params() {
		return this.#_jsonData.params;
	}

	get method() {
		return this.#_jsonData.method;
	}

	constructor(socket) {
		this.#_socket = socket;
	}

	setJsonData(jd) {
		if(!this.isValid) {
			return;
		}

		const sendData = {
			id: jd.id,
			jsonrpc: "2.0",
			result: null,
			error : null
		};

		if (!('id' in jd)) {
			log('warn', logSystem, 'Miner RPC request missing RPC id');
			// error: error ? {code: -1, message: error} : null,
			sendData.error = {
				code; -1,
				message:'Miner RPC request missing RPC id')
			};
		} else if (!('method' in jd)) {
			log('warn', logSystem, 'Miner RPC request missing RPC method');
			sendData.error = {
				code; -1,
				message:'Miner RPC request missing RPC method')
			};
		} else if (!('params' in jd)) {
			log('warn', logSystem, 'Miner RPC request missing RPC params');
			sendData.error = {
				code; -1,
				message:'Miner RPC request missing RPC params')
			};
		}

		if(sendData.error) {
			const response = JSON.stringify(sendData) + "\n";
			this.#_socket.end(response);
			return;
		}

		this.#_jsonData = jd;
	}

	reply(error, result, close){
		if(!this.isValid) {
			return;
		} 

		const jsonData = this.#_jsonData;

		const sendData = {
			id: (jsonData) ? jsonData.id : 0,
			jsonrpc: "2.0",
			error: error ? {code: -1, message: error} : null,
			result: result
		};

		if (jsonData && jsonData.id === "Stratum") {
			sendData.method = jsonData.method;
		}

		const response = JSON.stringify(sendData) + "\n";
		if(close) {
			this.#_socket.end(response);

		}else {
			this.#_socket.write(response);
		}
	}

	push(method, params){

		if(!this.isValid) {
			return;
		}

		var sendData = JSON.stringify({
			jsonrpc: "2.0",
			method: method,
			params: params
		}) + "\n";
		this.#_socket.write(sendData);
	};

	destroy() {
		if(!this.isValid) {
			return;
		}    	
		this.#_socket.destroy();
		this.#_socket = null;
	}


	onDisconnect(fn) {
		this.disconnectTrigger = fn;
	}
}