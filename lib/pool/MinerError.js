
class MinerError {

    #_error;
    #_errorCode;
    get error() {
        return this.#_error;
    }
    constructor(str) {
        this.#_error = str;

    }

}

module.exports = MinerError;