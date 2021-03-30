class Ban {

	constructor(value) {
		this.#_value;
		this.#_lastSeen = Date.now();
	}

	get value() {
		return this.#_value;
	}

	get isExpired() {
		return (this.#_expires <= Date.now());
	}

	get expires() {
		return this.#_expires;
	}

	set expires(exp) {
		this.#_expiry = exp;
		this.#_expires = Date.now() + exp;
	}

	#_fn = new Set();

	unbind(fn) {
		this.#_fn.delete(fn);
		return this;
	}

	bind(fn) {
		this.#_fn.add(fn);
		return this;
	}

	setExpiresByMinute(min) {
		// 1 minute = 60 seconds
		// 1 second = 1000 mili seconds
		// 1 minute = 60 second * 1000 milisecond
		const minutes = 1000 * 60 * min;
		// const hours = minutes * 60;
		// const days = hours * 24;
		// const years = days * 365;
		// const t = Date.now();

		// const y = Math.round(t / years);
		this.expires = minutes * min;
	}

	setExpiresBySecond(sec) {
		// 1 second = 1000 mili seconds
		const seconds = 1000 * sec;
		// const hours = minutes * 60;
		// const days = hours * 24;
		// const years = days * 365;
		// const t = Date.now();

		// const y = Math.round(t / years);
		this.expires = seconds;	
		return this;
	}
	
	run() {
		const self = this;
		setTimeout(() => {
			for (var it = self.#_fn.values(), val= null; val=it.next().value;) {
			    val(self.toObject());
			}
		}, this.#_expiry * 1000);
	}

	stop() {
		clearInterval(this.#_ci);
	}

	toObject() {
		return {
	    	value:this.#_value,
	    	lastSeen:this.#_lastSeen,
	    	expiry:this.#_expiry),
	    	expires:this.#_expires),
		};
	}

}