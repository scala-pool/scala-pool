## Table of contents
  * [Requirements](#requirements)
  * [Downloading & Installing](#1-downloading--installing)
  * [Configuration](#2-configuration)
  * [Starting the Pool](#3-start-the-pool)
  * [Host the front-end](#4-host-the-front-end)
  * [Customizing your website](#5-customize-your-website)
  * [SSL](#ssl)
  * [Upgrading](#upgrading)
  * [JSON-RPC](#json-rpc)
  * [Monitoring](#monitoring)


Usage
===

#### Requirements @ Dependencies

* **Coin daemon(s)** (find the coin's repo and build latest version from source)
* **[Node.js](http://nodejs.org/) v14.0**
  * For Ubuntu: 
 ```
	sudo apt-get update
	sudo apt-get install build-essential libssl-dev
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.37.2/install.sh | bash
	source ~/.profile
	nvm install 14
	nvm alias default 14
	nvm use default
```

* **Key Value Store** there are 2 options you can try either the original
[Redis](http://redis.io/) key-value store v2.6+ 
  * For Ubuntu: 
```
	sudo add-apt-repository ppa:chris-lea/redis-server
	sudo apt-get update
	sudo apt-get install redis-server
 ```
or you can get crazy by using KeyDB a redis fork

* [KeyDB](https://keydb.dev/) redis fork v5.0+
  * For Ubuntu: 
```
  sudo curl -s --compressed -o /etc/apt/trusted.gpg.d/keydb.gpg https://download.keydb.dev/keydb-ppa/keydb.gpg
  sudo curl -s --compressed -o /etc/apt/sources.list.d/keydb.list https://download.keydb.dev/keydb-ppa/keydb.list
  sudo apt update
  sudo apt install keydb
 ```

[**warning**](http://redis.io/topics/security): It'sa good idea to learn about and understand software that
you are using - a good place to start with redis @ keydb is [data persistence](http://redis.io/topics/persistence).

* **libssl** required for the node-multi-hashing module
  * For Ubuntu: `sudo apt-get install libssl-dev`

* **Boost** is required for the cryptoforknote-util module
  * For Ubuntu: `sudo apt-get install libboost-all-dev`


**Do not run the pool as root** : create a new user without ssh access to avoid security issues :
```bash
sudo adduser --disabled-password --disabled-login your-user
```
To login with this user : 
```
	sudo su - your-user
```

#### 1) Downloading & Installing


Clone the repository and run `npm update` for all the dependencies to be installed:

```bash
	git clone https://github.com/scala-network/scala-pool.git pool
	cd pool
	npm install
```

#### 2) Configuration

If you're using 1.5.0 and below then copy the `default/config.default.json` file of your choice to `config.json` then overview each options and change any to match your preferred setup. To see avaliable config go to [table](config.md). If you are using 1.5.1, here how things get weird.

* **2 Config files** Starting from version 1.5.1 we will be having 2 config files. 1 for non coin related configurations and another for coin related configurations. 
* **Special config folder** Starting from version 1.5.1 any config dumped into /config will be automatically attached. So if you have multiple coins in that folder then just dump it. This is the default you still can run only 1 coin per session as before. [Start the pool instruction will tell more about it](#3-start-the-pool).

Heads up to [config2.md](./config.md) for config version 2 details and explaination.

#### 3) Start the pool

Here is the basic how to start it. This will run every coin inside `/config`.
```bash
	node init.js
```

Before version 1.5.1 the file `config.json` is used by default other than that will use `/config/config.json`. You can override the path of the config file by specifying the `-config=file` command argument, for example:

```bash
	node init.js -config=config_backup.json
```

This software contains four distinct modules:
* `pool` - Which opens ports for miners to connect and processes shares
* `api` - Used by the website to display network, pool and miners' data
* `unlocker` - Processes block candidates and increases miners' balances when blocks are unlocked
* `payments` - Sends out payments to miners according to their balances stored in redis

After version 1.5.1, there is an additional module
* `web` - For developers to test run pool web interface without using other web services such as nginx


By default, running the `init.js` script will start up all modules. You can optionally have the script start
only start a specific module by using the `-module=name` command argument, for example:

```bash
	node init.js --module=api
```
alternatively you can run `npm run <module>`
```bash
  npm run api
```
or running multiple certain module

```bash
	node init.js --module=api,charts,payments
```

[Example screenshot](http://i.imgur.com/SEgrI3b.png) of running the pool in single module mode with tmux.


To keep your pool up, on operating system with systemd, you can create add your pool software as a service.  
Use default/service to create the systemd service `/lib/systemd/system/scala-pool.service`
Then enable and start the service with the following commands : 

```
sudo systemctl enable scala-pool.service
sudo systemctl start scala-pool.service
```

As of version 1.5.1, there will be multiple coin and algorithm functionallity. We bring back multiple coins so that we have various feedbacks on bugs and error to obtain stability.
Running a spesific coin, the argument to be used is `-coins=scala`. You can have multiple coin defines but make sure config is avaliable. Below shows init pool with multiple coins.

```bash
  node init.js --config=config.json --coins=scala,zano,xmr,msr,loki
```

Well you don't need all if you're just hosting a single coin, just use as below:


```bash
  node init.js --config=config.json --coins=scala
```


If you have installed dev dependencies, you can automatically restart your application when file changes in lib are detected using nodemon. Below are for development only:
```bash
  nodemon init.js -a "--module=api,charts,payments" --watch config --watch lib
```


#### 4) Host the front-end

Simply host the contents of the `public` directory on file server capable of serving simple static files.

As of version 1.5.1, you can run node web service. This is
intentionally for development purposes only. To run the development web services:

```bash
  node init.js --module=web --port=80
```

or for some quick hand:

```bash
  npm run web
```

Edit the variables in the `public/config.js` file to use your pool's specific configuration.

If you have difficulty running web at port 80 its because we are not root. So to run as root do as below:

```bash
sudo `which node` init.js --module=web --port=80
````


```javascript

/* Must point to the API setup in your config.json file. */
var api = "http://poolhost:8117";

/* Pool server host to instruct your miners to point to (override daemon setting if set) */
var poolHost = "poolhost.com";

/* Number of coin decimals places (override daemon setting if set) */
"coinDecimalPlaces": 4,

/* Contact email address. */
var email = "support@poolhost.com";

/* Pool Telegram URL. */
var telegram = "https://t.me/YourPool";

/* Pool Discord URL */
var discord = "https://discordapp.com/invite/YourPool";

/* Market stat display params from https://www.cryptonator.com/widget */
var marketCurrencies = ["{symbol}-BTC", "{symbol}-USD", "{symbol}-EUR", "{symbol}-CAD"];

/* Used for front-end block links. */
var blockchainExplorer = "http://chainradar.com/{symbol}/block/{id}";

/* Used by front-end transaction links. */
var transactionExplorer = "http://chainradar.com/{symbol}/transaction/{id}";

/* Any custom CSS theme for pool frontend */
var themeCss = "themes/light.css";

/* Default language */
var defaultLang = 'en';

```


#### 5) Customize your website

The following files are included so that you can customize your pool website without having to make significant changes
to `index.html` or other front-end files thus reducing the difficulty of merging updates with your own changes:
* `css/custom.css` for creating your own pool style
* `js/custom.js` for changing the functionality of your pool website


Then simply serve the files via nginx, Apache, Google Drive, or anything that can host static content.

#### SSL

You can configure the API to be accessible via SSL using various methods. Find an example for nginx below:

* Using SSL api in `config.json`:

By using this you will need to update your `api` variable in the `website_example/config.js`. For example:  
`var api = "https://poolhost:8119";`

* Inside your SSL Listener, add the following:

``` javascript
location ~ ^/api/(.*) {
    proxy_pass http://127.0.0.1:8117/$1$is_args$args;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

By adding this you will need to update your `api` variable in the `website_example/config.js` to include the /api. For example:  
`var api = "http://poolhost/api";`

You no longer need to include the port in the variable because of the proxy connection.

* Using his own subdomain, for example `api.poolhost.com`:

```bash
server {
    server_name api.poolhost.com
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /your/ssl/certificate;
    ssl_certificate_key /your/ssl/certificate_key;

    location / {
        more_set_headers 'Access-Control-Allow-Origin: *';
        proxy_pass http://127.0.01:8117;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

By adding this you will need to update your `api` variable in the `website_example/config.js`. For example:  
`var api = "//api.poolhost.com";`

You no longer need to include the port in the variable because of the proxy connection.


#### Upgrading
When updating to the latest code its important to not only `git pull` the latest from this repo, but to also update
the Node.js modules, and any config files that may have been changed.
* Inside your pool directory (where the init.js script is) do `git pull` to get the latest code.
* Remove the dependencies by deleting the `node_modules` directory with `rm -r node_modules`.
* Run `npm update` to force updating/reinstalling of the dependencies.
* Compare your `config.json` to the latest example ones in this repo or the ones in the setup instructions where each config field is explained. You may need to modify or add any new changes.

#### JSON-RPC

Curl can be used to use the JSON-RPC commands from command-line. Here is an example of calling `getblockheaderbyheight` for block 100:

```bash
curl 127.0.0.1:20189/json_rpc -d '{"method":"getblockheaderbyheight","params":{"height":100}}'
```

To enable wallet rpc you can do as below but make sure rpc-bind-port matches the one in your config

```bash
./scala-wallet-rpc --wallet-file walletfile --prompt-for-password --rpc-bind-port 9000 --rpc-bind-ip 127.0.0.1  --disable-rpc-login --daemon-address 127.0.0.1:11812
```

#### Monitoring

* To inspect and make changes to redis I suggest using [redis-commander](https://github.com/joeferner/redis-commander)
* To monitor server load for CPU, Network, IO, etc - I suggest using [Netdata](https://github.com/firehol/netdata)
* To keep your pool node script running in background, logging to file, and automatically restarting if it crashes - I suggest using [forever](https://github.com/nodejitsu/forever) or [PM2](https://github.com/Unitech/pm2)

##### Monitoring with PM2
To start and register your modules seperately via pm2 use the below commands
```bash
cd <path_to_pool>
pm2 start init.js --name=pool -- --module=pool
pm2 start init.js --name=api -- --module=api,charts
pm2 start init.js --name=unlocker -- --module=unlocker
pm2 start init.js --name=payments -- --module=payments
pm2 start init.js --name=web -- --module=web --port=8080
```
It will help you to log each module easily by using `pm2 log <module_name>`.
