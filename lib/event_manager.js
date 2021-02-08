/* Scala Nodejs Pool
 * Copyright Scala          <https://github.com/scala-network/scala-pool>
 * Copyright StelliteCoin   <https://github.com/stellitecoin/cryptonote-stellite-pool>
 * Copyright Ahmyi      <https://github.com/ahmyi/cryptonote-stellite-pool>
 * Copyright Dvandal      <https://github.com/dvandal/cryptonote-nodejs-pool>
 * Copyright Fancoder     <https://github.com/fancoder/cryptonote-universal-pool>
 * Copyright zone117x   <https://github.com/zone117x/node-cryptonote-pool>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
 
'use strict'

let instance = null;
const nsync = require('async');
class EventManager 
{
	#_events = {}
	/*
	Example
	EventManager.series("helloWorld", (fn, next) => {
		fn(xxx,next)
	}, e=>{

	});
	*/
	series(eventName, funct, done)
	{
		
		done = done || function(e){}
		if(!(eventName in this.#_events) || this.#_events[eventName].length <= 0) {
			done();
			return;
		}

		nsync.eachSeries(this.#_events[eventName],(pushed, next) => {
			const fn = pushed.fn
			const options = pushed.options

			if (!options) {
				funct(fn,next)
			} else {
				const isWorkerType = !('workerType' in options) || options.workerType === process.env.workerType;
				const isWorkerID = !('forkId' in options) || parseInt(options.forkId) === parseInt(process.env.forkId);
				if(isWorkerType && isWorkerID) {
					funct(fn,next)
				} else {
					next();
				}
			}
				
		}, done);
	}

	parallel(eventName, funct, done)
	{

		done = done || function(e){}
		if(!(eventName in this.#_events) || this.#_events[eventName].length <= 0) {
			done();
			return;
		}

		nsync.each(this.#_events[eventName],(pushed, next) => {
			const fn = pushed.fn
			const options = pushed.options
			if (!options) {
				funct(fn,next)
			} else {
				const isWorkerType = !('workerType' in options) || options.workerType === process.env.workerType;
				const isWorkerID = !('forkId' in options) || parseInt(options.forkId) === parseInt(process.env.forkId);
				if(isWorkerType && isWorkerID) {
					funct(fn,next)
				} else {
					next();
				}
			}
		}, done);
	}

	register(eventName, options, fn) 
	{
		if(!(eventName in this.#_events)) {
			this.#_events[eventName] = []
		}

		if(!fn) {
			fn = options
			options = {}
		}

		this.#_events[eventName].push({fn,options})
		return this;
	}
}

module.exports = EventManager
