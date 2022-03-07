/**
 * Cookies handler
 **/

var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }
};



// Convert float to string
function floatToString(float) {
    return float.toFixed(6).replace(/\.0+$|0+$/, '');
}

// Format number
function formatNumber(number, delimiter){
    if(!delimiter) {
        delimiter = ",";
    }
    return ("" + number).replace(/\B(?=(\d{3})+(?!\d))/g, delimiter);

    // if(number != '') {
    //     number = number.split(delimiter).join('');

    //     var formatted = '';
    //     var sign = '';

    //     if(number < 0){
    //         number = -number;
    //         sign = '-';
    //     }

    //     while(number >= 1000){
    //         var mod = number % 1000;

    //         if(formatted != '') formatted = delimiter + formatted;
    //         if(mod == 0) formatted = '000' + formatted;
    //         else if(mod < 10) formatted = '00' + mod + formatted;
    //         else if(mod < 100) formatted = '0' + mod + formatted;
    //         else formatted = mod + formatted;

    //         number = parseInt(number / 1000);
    //     }

    //     if(formatted != '') formatted = sign + number + delimiter + formatted;
    //     else formatted = sign + number;
    //     return formatted;
    // }
    return '';
}

// Format date
function formatDate(time){
    if (!time) return '';
    var m = new Date(parseInt(time) * 1000);
   var dateString =
    ("0" + m.getUTCDate()).slice(-2) + "/" +
    ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
    m.getUTCFullYear() + " " +
    ("0" + m.getUTCHours()).slice(-2) + ":" +
    ("0" + m.getUTCMinutes()).slice(-2) + ":" +
    ("0" + m.getUTCSeconds()).slice(-2);
    return dateString;
}

// Format percentage
function formatPercent(percent) {
    if (!percent && percent !== 0) return '';
    return percent + '%';
}

// Get readable time
function getReadableTime(seconds){
    var units = [ [60, 'second'], [60, 'minute'], [24, 'hour'],
                [7, 'day'], [4, 'week'], [12, 'month'], [1, 'year'] ];

    function formatAmounts(amount, unit){
        var rounded = Math.round(amount);
	var unit = unit + (rounded > 1 ? 's' : '');
        if (getTranslation(unit)) unit = getTranslation(unit);
        return '' + rounded + ' ' + unit;
    }

    var amount = seconds;
    for (var i = 0; i < units.length; i++){
        if (amount < units[i][0]) {
            return formatAmounts(amount, units[i][1]);
    }
        amount = amount / units[i][0];
    }
    return formatAmounts(amount,  units[units.length - 1][1]);
}

// Get readable hashrate
function getReadableHashRateString(hashrate){
    if (!hashrate) hashrate = 0;

    var i = 0;
    var byteUnits = [' H', ' kH', ' MH', ' GH', ' TH', ' PH' ];
    if (hashrate > 0) {
        while (hashrate >= 1000){
            hashrate = hashrate / 1000;
            i++;
        }
    }
    return parseFloat(hashrate).toFixed(2) + byteUnits[i];
}
    
// Get coin decimal places
function getCoinDecimalPlaces() {
    if (typeof coinDecimalPlaces != "undefined") return coinDecimalPlaces;
    else if (window.config.coinDecimalPlaces) return window.config.coinDecimalPlaces;
    else lastStats.config.coinUnits.toString().length - 1;
}

// Get readable coins
function getReadableCoins(coins, digits, withoutSymbol){
    var coinDecimalPlaces = getCoinDecimalPlaces();
    var amount = (parseFloat(coins || 0) / window.config.coinUnits).toFixed(digits || coinDecimalPlaces).split('.');
    return parseInt(amount[0]).toLocaleString() +'.'+ amount[1] + (withoutSymbol ? '' : (' ' + window.config.symbol));
}

// Format payment link
function formatPaymentLink(hash, cut){
    let cutHash = hash;
    if(cut) {
        cutHash = hash.slice(0, 4) + "..." + hash.slice(hash.length-4, hash.length)
    }
    return '<a target="_blank" href="' + getTransactionUrl(hash) + '">' + cutHash + '</a>';
}
// Format payment link
function formatHash(hash, cut){
    let cutHash = hash;
    if(cut) {
        cutHash = hash.slice(0, 4) + "..." + hash.slice(hash.length-4, hash.length)
    }
    return '<a target="_blank" href="' + getTransactionUrl(hash) + '">' + cutHash + '</a>';
}
// Format difficulty
function formatDifficulty(x) {
    if(!x) return x
    if(typeof x.toString === 'undefined') return x
    return parseInt(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Format luck / current effort
function formatLuck(difficulty, shares) {
    var percent = Math.round(shares / difficulty * 100);
    
    if(!percent){
        return '<span class="luckGood">?</span>';
    }
    
    if(percent <= 100){
        return '<span class="luckGood">' + percent + '%</span>';
    }
    
    if(percent >= 101 && percent <= 150){
        return '<span class="luckMid">' + percent + '%</span>';
    }
    
    return '<span class="luckBad">' + percent + '%</span>';
}

function getDonationSmiley(level) {
    return (
        level <= 0 ? '😢' :
        level <= 5 ? '😎' :
        level <= 10 ? '😄' :
        level <= 25 ? '😂' :
        '💖');
}

/**
 * URLs
 **/

// Return transaction URL
function getTransactionUrl(id) {
    return window.config.transactionExplorer.replace(new RegExp('{symbol}', 'g'), window.config.symbol.toLowerCase()).replace(new RegExp('{id}', 'g'), id);
}

// Return blockchain explorer URL
function getBlockchainUrl(id) {
    return window.config.blockchainExplorer.replace(new RegExp('{symbol}', 'g'), window.config.symbol.toLowerCase()).replace(new RegExp('{id}', 'g'), id);    
}
 
/**
 * Tables
 **/
 
// Sort table cells
function sortTable() {
    var table = $(this).parents('table').eq(0),
        rows = table.find('tr:gt(0)').toArray().sort(compareTableRows($(this).index()));
    this.asc = !this.asc;
    if(!this.asc) {
        rows = rows.reverse()
    }
    for(var i = 0; i < rows.length; i++) {
        table.append(rows[i])
    }
}

// Compare table rows
function compareTableRows(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index);
        if (!valA) { valA = 0; }
        if (!valB) { valB = 0; }
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB.toString())
    }
}

// Get table cell value
function getCellValue(row, index) {
    return $(row).children('td').eq(index).data("sort")
}

/**
 * Translations
 **/

if (typeof langs == "undefined") {
    var langs = { en: 'English' };
}

if (typeof defaultLang == "undefined") {
    var defaultLang = 'en';
}

var langCode = defaultLang;
var langData = null; 

function getTranslation(key) {
    if (!langData || !langData[key]) return null;
    return langData[key];    
}

var translate = function(data) {
    langData = data;

    $("[tkey]").each(function(index) {
        var strTr = data[$(this).attr('tkey')];
        $(this).html(strTr);
    });

    $("[tplaceholder]").each(function(index) {
        var strTr = data[$(this).attr('tplaceholder')];
	$(this).attr('placeholder', strTr)
    });

    $("[tvalue]").each(function(index) {
        var strTr = data[$(this).attr('tvalue')];
        $(this).attr('value', strTr)
    });
} 

// Get language code from URL
const $_GET = {};
const args = location.search.substr(1).split(/&/);
for (var i=0; i<args.length; ++i) {
    const tmp = args[i].split(/=/);
    if (tmp[0] != "") {
        $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp.slice(1).join("").replace("+", " "));
        var langCode = $_GET['lang'];    
    }
}

// Load language
function loadTranslations() {
    if (langData) {
        translate(langData);
    }
    else if (langs && langs[langCode]) {
        $.getJSON('lang/'+langCode+'.json', translate);
        $.getScript('lang/timeago/jquery.timeago.'+langCode+'.js');    
    } else {
        $.getJSON('lang/'+defaultLang+'.json', translate);
        $.getScript('lang/timeago/jquery.timeago.'+defaultLang+'.js');    
    }
}

// Language selector
function renderLangSelector() {
    // Desktop
    var html = '';
    var numLangs = 0;
    if (langs) {
        html += '<select id="newLang" class="form-control form-control-sm">';
        for (var lang in langs) {
            var selected = lang == langCode ? ' selected="selected"' : '';
            html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
	    numLangs ++;
        }
	html += '</select>';
    }
    if (html && numLangs > 1) {
        $('#langSelector').html(html);	
        $('#newLang').each(function(){
            $(this).change(function() {
                var newLang = $(this).val();
                var url = '?lang=' + newLang;
                if (window.location.hash) url += window.location.hash;
                window.location.href = url;
            });
        });
    }	

    // Mobile
    var html = '';
    var numLangs = 0;
    if (langs) {
        html += '<select id="mNewLang" class="form-control form-control-sm">';
        for (var lang in langs) {
            var selected = lang == langCode ? ' selected="selected"' : '';
            html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
	    numLangs ++;
        }
	html += '</select>';
    }
    if (html && numLangs > 1) {
        $('#mLangSelector').html(html);	
        $('#mNewLang').each(function(){
            $(this).change(function() {
                var newLang = $(this).val();
                var url = '?lang=' + newLang;
                if (window.location.hash) url += window.location.hash;
                window.location.href = url;
            });
        });
    }	
}

// Parse block data
function parseBlock(networkHeight, depth, serializedBlock){
    if(!serializedBlock) {
        return;
    }
    var parts = serializedBlock.split(':');
    var properties = [
        'height',
        'hash',
        'timestamp',
        'difficulty',
        'shares',
        'donations',
        'reward',
        'miner',
        'poolType',
        'orphaned',
        'unlocked'
   ];

    var block = {};
    for(var i =0;i<properties.length;i++) {
       var property = properties[i];
       switch(property) {
            case 'unlocked':
            block[property] = (parts[i] === true || parts[i] === 'true');
            break;
            case 'orphaned':
            case 'height':
            case 'timestamp':
            case 'difficulty':
            case 'shares':
            case 'donations':
            case 'reward':
            case 'orphaned':
            block[property] = parseInt(parts[i])
            break;
            default:
            block[property] = parts[i]
            break;
        }
    }
    var toGo = depth - (networkHeight - block.height) + 1;
    if(toGo > 1){
        block.maturity = toGo + ' to go';
    } else if(toGo == 1){
        block.maturity = "<i class='fa fa-spinner fa-spin text-info'></i>";
    } else {
        block.maturity = "<i class='fa fa-unlock-alt text-success'></i>";
    }

    switch (block.orphaned){
        case '0':
            block.status = 'unlocked';
            block.maturity = "<i class='fa fa-unlock-alt'></i>";
            break;
       case '1':
            block.status = 'orphaned';
            block.maturity = "<i class='fa fa-times'></i>";
            break;
        default:
            block.status = 'pending';
            break;
    }
    if(typeof(block.miner) === 'undefined'){
       block.miner= "xxxxxxx....xxxxxx";
    }
    block.effort = formatLuck(block.difficulty, block.shares);
    block.donated = getReadableCoins(block.reward * (block.donations / block.shares));
    return block;
}


 const setBreadCrumbs = (crumb) => {
  var output = '<ol class="breadcrumb my-0 ms-2">';
  for(var i=0;i<crumb.length;i++) {
    const c = crumb[i];
    if(i === crumb.length -1) {
      output +=  '<li class="breadcrumb-item active"><span>' + c + '</span></li>';
    } else {
      output +='<li class="breadcrumb-item"><span>' + c + '</span></li>';
    }
  }

  output +='</ol>';
  $('#breadcrumbs').html(output);
  
};
Vue.createApp({
  data() {
    return {
      selectedMarket:"LTC",
      hosts:window.config.poolHosts,
      algos:["panthera"],
      ports:[],
      ui : {
        workers:[],
        worker:{
            idx:0,
            workerName:"x",
            hashrate:"",
            hashrate1h:"",
            hashrate6h:"",
            hashrate24h:"",
            lastShare:"",
            hashes:"",
            status:"",
            algo:""
        },
        user : {
          current : "0 H/sec",
          hr1 : "0 H/sec",
          hr6 : "0 H/sec",
          hr24 : "0 H/sec",
          lastShare : "0 H/sec",
          totalHashes : "0",
          balance:"0 XLA",
          paid:"0 XLA",
          payoutLevel:"0 XLA",
          payoutEstimate:"0 XLA"
        },
        market: {
          price: 0,
          volume_24h: 0,
          volume_change_24h: 0,
          percent_change_1h: 0,
          percent_change_24h: 0,
          percent_change_7d: 0,
          percent_change_30d: 0,
          percent_change_60d: 0,
          percent_change_90d: 0,
          market_cap: 0,
          market_cap_dominance: 0,
          fully_diluted_market_cap: 0
        },
        start : {
          port:'',
          host:'',
          workerName:'',
          login:''
        },
        block:{
          averageLuck:'N/A',
          currentEffort:'N/A',
          blocksTotal:'N/A',
          totalHashes:'N/A',
          lastBlockFound:'Never',
          blocksMaturityCount:0,
          soloAverageLuck:'N/A',
          soloCurrentEffort:'N/A',
          propsCurrentEffort:'N/A',
          propsBlocksTotal:'N/A',
          soloBlocksTotal:'N/A',
          propsLastBlockFound:'Never',
          soloLastBlockFound:'Never',
          unlockReward:'0%',
          blocksChartTitle:'Blocks found'
        },
        index : {
          difficult : 0,
          reward : 0,
          found : "Never",
          lastReward:0,
          lastHashFound:'Never',
          lastHashLink:'#',
          lastHash : "0000000000000000000000000000000000000000000000000000000000000000",
        },
        blocks:[],
        payment : {
          payment_total : 0,
          payment_miners : 0,
          max_payout : 0,
          min_payout : 0,
          interval : 0,
          denomation : 0,
          donations : 0,
          fee : 0,
          networkFee: 0
        },
        payments:[]
      },
      ranks: {},
      market:{
        symbols:[],
        charts : {},
        raw : {},
        
      },
      calcEarnSymbol:"KH/s",
      calcEarnMulti: 1000,
      calcEarnInput:'',
      calcEarnRate: 1,
      calcEarnPerDay:0,
      hashrate: {
        pool : 0,
        network :0,
      },
      efforts: {
        props:0,
        solo:0
      },
      pool : {
        miners: 0,
        workers:0
      },
      address: "",
      height: 1,
      difficulty : 0,
      lastReward: 0,
      currentPage : "none",
      gPaymentId:'',
      gDifficulty:'',
      gAddress:'',
      holdUpdatePayments:false,
      holdUpdateBlocks:false,
      rankNavigation:'none',
      telegramLoginEnabled:false
    }
  },
  methods: {
    workerView(idx) {
      this.ui.worker = this.ui.workers[idx];
    },
    loadMorePayments: function() {
      this.holdUpdatePayments = true;
    },
    loadMoreBlocks:function() {
      this.holdUpdateBlocks = true;
    },
    setPage: function(page) {
      this.currentPage = page;
    },
    marketPercentChange:function(value) {
      if(value > 100 || value <  -100) {
        return 100;
      } else if(value < 0) {
        return -1 * value;
      } else {
        return value;
      }
    },
    setSelectedMarket:function(symbol) {
      this.selectedMarket = symbol;
      this.ui.market = this.market.raw[this.selectedMarket].info;
    },
    update: function(data) {
      if(data.lastblock.height !== this.height) {
        this.holdUpdatePayments = false;
        this.holdUpdateBlocks = false;
      }
      const self = this;
      

window.config = Object.assign(window.config, data.config);
const c1 = Chart.getChart("chartHashrates");

  if(c1 && data.charts && data.charts.hashrates) {
    c1.data.labels = [];
    c1.data.datasets[0].data = [];
    c1.data.datasets[1].data = [];
    for(let i =0;i<data.charts.hashrates.length;i++) {
      var hashrate = data.charts.hashrates[i];
      c1.data.labels.unshift(hashrate.title);
      c1.data.datasets[0].data.unshift(hashrate.pool);
      c1.data.datasets[1].data.unshift(hashrate.network);
      if(i === 0){
        this.hashrate = hashrate;
      }
    }
    c1.update();
  }
  const c2 = Chart.getChart("chartEfforts");

  if(c2 && data.charts && data.charts.efforts) {
    c2.data.labels = [];
    c2.data.datasets[0].data = [];
    c2.data.datasets[1].data = [];
    for(let i =0;i<data.charts.efforts.length;i++) {
      var efforts = data.charts.efforts[i];
      c2.data.labels.unshift(efforts.title);
      c2.data.datasets[0].data.unshift(efforts.props);
      c2.data.datasets[1].data.unshift(efforts.solo);
      if(i === 0){
        this.efforts = efforts;
      }
    }
    c2.update();
  }

  const c3 = Chart.getChart("chartMinerWorkers");
  if(c3 && data.charts && (data.charts.miner_workers)) {
    c3.data.labels = [];
    c3.data.datasets[0].data = [];
    c3.data.datasets[1].data = [];

    for(let i =0;i<data.charts.miner_workers.length;i++) {
      var mw = data.charts.miner_workers[i];
      c3.data.labels.unshift(mw.title);
      c3.data.datasets[0].data.unshift(mw.miners);
      c3.data.datasets[1].data.unshift(mw.workers);
      if(i === 0){
        this.pool.miners = mw.miners;
        this.pool.workers = mw.workers;
      }
    }

    c3.update();
  }

    
  if(data.market) {
    this.market.symbols = Object.keys(data.market).filter(key => key !== 'last_updated');
    for(let [symbol,dirtyMarket] of Object.entries(data.market)) {
          let cleanMarket = {
            info:{
              price : Number(dirtyMarket.info.price).toFixed(9) + " " + symbol,
              volume_24h : dirtyMarket.info.volume_24h,
              volume_change_24h : dirtyMarket.info.volume_change_24h,
              percent_change_1h : parseFloat(Number(dirtyMarket.info.percent_change_1h).toFixed(2)),
              percent_change_24h : parseFloat(Number(dirtyMarket.info.percent_change_24h).toFixed(2)),
              percent_change_7d : parseFloat(Number(dirtyMarket.info.percent_change_7d).toFixed(2)),
              percent_change_30d :  parseFloat(Number(dirtyMarket.info.percent_change_30d).toFixed(2)),
              percent_change_60d : parseFloat(Number(dirtyMarket.info.percent_change_60d).toFixed(2)),
              percent_change_90d : parseFloat(Number(dirtyMarket.info.percent_change_90d).toFixed(2)),
              market_cap : dirtyMarket.info.market_cap,
              market_cap_dominance : dirtyMarket.info.market_cap_dominance,
              fully_diluted_market_cap : dirtyMarket.info.fully_diluted_market_cap,
              last_updated : dirtyMarket.info.last_updated
            },
            charts:dirtyMarket.charts
          }
          this.market.raw[symbol] = cleanMarket;
    }
    this.ui.market = this.market.raw[this.selectedMarket].info;
  }

  if(data.algos) {
    this.algos = data.algos;
  }

  if(data.config && data.config.ports){
    this.ports = data.config.ports.map(port => {
      port.difficulty = formatDifficulty(port.difficulty);
      if(!port.algos) {
        port.algos = self.algos .join("</br>");
      }
      return port;
    });
  }
  this.ui.index.lastHash = data.lastblock.hash;
  this.ui.index.lastHashLink = getBlockchainUrl(data.lastblock.hash);
  if(data.pool.stats.lastblock_lastReward) {
    this.lastRewardMiner = data.pool.stats.lastblock_lastMinerReward;
    this.lastReward = data.pool.stats.lastblock_lastReward;
    this.ui.index.lastReward = getReadableCoins(this.lastReward);
    this.ui.index.lastRewardMiner = getReadableCoins(this.lastRewardMiner);
  }
  if(data.lastblock.timestamp) this.ui.index.lastHashFound = moment(parseInt(data.lastblock.timestamp)*1000).fromNow();

  if(data.network) this.difficulty = data.network.difficulty;
      
this.ui.block.unlockReward = data.config.unlockBlockReward +"%";
this.ui.block.blocksMaturityCount = data.config.depth.toString();

this.ui.block.averageLuck = formatLuck(data.pool.stats.totalDiff, data.pool.stats.totalShares);
this.ui.block.soloAverageLuck = formatLuck(data.pool.stats.totalDiff_solo, data.pool.stats.totalShares_solo);
this.ui.block.propsAverageLuck = formatLuck(data.pool.stats.totalDiff_props, data.pool.stats.totalShares_props);

this.ui.block.blocksTotal = formatDifficulty(data.pool.stats.blocksFound);
this.ui.block.soloBlocksTotal =  formatDifficulty(data.pool.stats.blocksFound_solo || 0);
this.ui.block.propsBlocksTotal = formatDifficulty(data.pool.stats.blocksFound_props || 0);

this.ui.block.currentEffort = formatLuck(data.network.difficulty, data.pool.stats.roundShares);
this.ui.block.soloCurrentEffort = formatLuck(data.network.difficulty, data.pool.stats.roundSharessolo);
this.ui.block.propsCurrentEffort = formatLuck(data.network.difficulty, data.pool.stats.roundSharesprops);

this.ui.block.soloLastBlockFound =  moment(parseInt(data.pool.stats.lastBlockFound_solo || 0)).fromNow();
this.ui.block.propsLastBlockFound = moment(parseInt(data.pool.stats.lastBlockFound_props)).fromNow();
this.ui.block.lastBlockFound = moment(parseInt(data.pool.stats.lastBlockFound)).fromNow();

this.ui.block.totalHashes = formatDifficulty(data.pool.stats.totalShares || 0);
this.ui.block.soloTotalHashes = formatDifficulty(data.pool.stats.totalShares_solo || 0);
this.ui.block.propsTotalHashes = formatDifficulty(data.pool.stats.totalShares_props || 0);


var title = getTranslation('poolBlocks') ? getTranslation('poolBlocks') : 'Blocks found';
var chartDays = data.config.blocksChartDays || null;
if (chartDays) {
    if (chartDays === 1) title = getTranslation('blocksFoundLast24') ? getTranslation('blocksFoundLast24') : 'Blocks found in the last 24 hours';
    else title = getTranslation('blocksFoundLastDays') ? getTranslation('blocksFoundLastDays') : 'Blocks found in the last {DAYS} days';
    title = title.replace('{DAYS}', chartDays);
}
this.ui.block.blocksChartTitle = title;

if(!this.holdUpdateBlocks) {
	const blocksResults = data.pool.blocks;

	var blockElementSets = {};
	var incomeValue = 0;
	var blockCount = 0;
	var incomeHashes = 0;
	const days = [];
	this.ui.blocks = [];

	for (var i = 0; i < blocksResults.length; i++){
	    	
	    const block = parseBlock(data.network.height, data.config.depth, blocksResults[i]);
		if(block.hash === "") continue;
		var dIndex = formatDate(block.timestamp).split(" ")[0];
		if(days.indexOf(dIndex) < 0) {
			days.push(dIndex);
		}

	    if(block.orphaned == 0){
	    	blockCount++;
			incomeValue+=parseFloat(block.reward);
			incomeHashes+=block.shares;
	    }
	    block.moment = moment(block.timestamp*1000).fromNow();
	    block.height = formatNumber(block.height);
	    block.diffDisplay = formatNumber(block.difficulty);
	    block.shareDisplay = formatNumber(block.shares);
	    block.hashDisplay = formatHash(block.hash,true);
	    block.rewardDisplay = getReadableCoins(block.reward,2);
		this.ui.blocks.push(block);   	
	}
	this.ui.block.averageIncomeDay = getReadableCoins(incomeValue/blockCount, 2, false);
	this.calcEarnRate = (incomeValue * 86400/ incomeHashes);//How much do we get per day / how much hash average perday
}
var labels = [];
var values = [];
var avgDay = 0;

const c5 = Chart.getChart("blocksChartObj");
if(c5) {
    c5.data.labels = [];
    c5.data.datasets[0].data = [];
}
for (var key in data.charts.blocks) {
    var label = key;
    if (chartDays && chartDays === 1) {
        var keyParts = key.split(' ');
        label = keyParts[1].replace(':00', '');
    }
    var value = data.charts.blocks[key];
    avgDay+=value;
    if(c5) {
    	label = label.split("-");
    	c5.data.labels.push([label[2],label[1],label[0].replace('20','')].join("/"));
      	c5.data.datasets[0].data.push(value);
    }
}

avgDay = Math.round(avgDay / chartDays);
this.ui.block.averageBlockDay = formatDifficulty(avgDay, 2, false);
if(c5) {
 	c5.update();
}
      
    this.ui.payment.payment_total = (data.pool.totalPayments || 0).toString();
    this.ui.payment.payment_miners = data.pool.totalMinersPaid.toString();
    this.ui.payment.max_payout = getReadableCoins(data.config.maxPaymentThreshold);
    this.ui.payment.min_payout = getReadableCoins(data.config.minPaymentThreshold);
    this.ui.payment.interval = getReadableTime(data.config.paymentsInterval);
    this.ui.payment.denomation = getReadableCoins(data.config.denominationUnit, data.config.coinDecimalPlaces);
    this.ui.payment.donations = getReadableCoins(data.pool.totalDonations);
    this.ui.payment.fee = getReadableCoins(data.config.devFee);
    this.ui.payment.networkFee = data.config.dynamicTransferFee ? "Base on blockchain" : getReadableCoins(data.config.networkFee);

if(!this.holdUpdatePayments) {
    
    const paymentsResults = data.pool.payments;

    this.ui.payments = [];

    for (var i = 0; i < paymentsResults.length; i += 2){
        const parts = paymentsResults[i].split(':');
        var payment = {
            time: moment(parseInt(paymentsResults[i + 1]) * 1000).fromNow(),
            hash:  parts[0].split(',').map(h => {
                return formatPaymentLink(h);        
            }).join("</br>"),
            amount: getReadableCoins(parts[1]),
            fee: getReadableCoins(parts[2]),
            mixin: parts[3],
            recipients: parts[4]
        };
        this.ui.payments.push(payment)
    }
}


      

this.ranks = data.ranks;
      
if(data.miner) {
    if(data.miner.error){
        // $('#addressError').text(data.miner.error).show();
        this.address = "";
    } else {
        //$('#addressError').hide();
    }

    if (data.miner.stats.lastShare) {
        this.ui.user.lastShare = moment(parseInt(data.miner.stats.lastShare) * 1000).fromNow();
    } else {
        this.ui.user.lastShare = "Never";
    }
    this.ui.user.hashrate = (getReadableHashRateString(data.miner.stats.hashrate) || '0 H') + '/s';
    if ('hashrate_1h' in data.miner.stats) {
        this.ui.user.hashrate_1h = (getReadableHashRateString(data.miner.stats.hashrate_1h) || '0 H') + '/s';
    }

    if ('hashrate_6h' in data.miner.stats) {
        this.ui.user.hashrate_6h = (getReadableHashRateString(data.miner.stats.hashrate_6h) || '0 H') + '/s';
    }

    if ('hashrate_24h' in data.miner.stats) {
        this.ui.user.hashrate_24h = (getReadableHashRateString(data.miner.stats.hashrate_24h) || '0 H') + '/s';
    }
    this.ui.user.totalHashes = formatDifficulty(data.miner.stats.hashes || 0);
    this.ui.user.paid = getReadableCoins(data.miner.stats.paid || 0);
    this.ui.user.balance = getReadableCoins(data.miner.stats.balance || 0, 5);
    this.ui.user.payoutLevel = getReadableCoins(data.miner.stats.minPayoutLevel || data.config.minPaymentThreshold);

    var userRoundHashes = parseInt(data.miner.stats.roundHashes || 0);
    var poolRoundHashes = parseInt(data.pool.roundHashes || 0);
    var userRoundScore = parseFloat(data.miner.stats.roundScore || 0);
    var poolRoundScore = parseFloat(data.pool.roundScore || 0);
    var lastReward = parseFloat(data.lastblock.reward || 0);

    var score_pct = (userRoundScore > 0) ? userRoundScore * 100 / poolRoundScore : 0;
    var payoutEstimate = getReadableCoins(lastReward * score_pct,5,true);
    if (data.config.devFee > 0) payoutEstimate = payoutEstimate - devFee;
    if (data.config.networkFee > 0) payoutEstimate = payoutEstimate - devFee;
    if (payoutEstimate < 0) payoutEstimate = 0;
    this.ui.user.payoutEstimate = getReadableCoins(payoutEstimate,5);
    this.ui.workers = [];
    if(data.miner.workers) {
        const workersData = data.miner.workers.sort((a,b) => {
            var aH = a.hashrate;
            var bH = b.hashrate; 
            var aName = a.name.toLowerCase();
            var bName = b.name.toLowerCase();
            
            if(aH > bH){
                return -1;
            }
            if(aH < bH){
                return 1;
            }
            if(aName > bName){
                return 1;
            }
            if(aName < bName){
                return -1;
            }
            return 0;
        });
        var have_avg_hr = false;

        for (var i = 0; i < workersData.length; i++){
            const worker = workersData[i];
            var hashrate = getReadableHashRateString(worker.hashrate ? worker.hashrate : 0) + "/s";
            var hashrate1h = getReadableHashRateString(worker.hashrate_1h || 0) + "/s";
            var hashrate6h = getReadableHashRateString(worker.hashrate_6h || 0) + "/s";
            var hashrate24h = getReadableHashRateString(worker.hashrate_24h || 0) + "/s";
            var lastShare = worker.lastShare? moment(worker.lastShare * 1000).fromNow() : "Never";
            var hashes = formatDifficulty(worker.hashes || 0);
            var status = (worker.hashrate > 0);
            var algo = worker.algo ? worker.algo : this.algos[0];
            this.ui.workers.push({
                idx:i,
                workerName: worker.name ? worker.name : "x",
                hashrate,
                hashrate1h,
                hashrate6h,
                hashrate24h,
                lastShare,
                hashes,
                status,
                algo,
                poolType:worker.pool_type,
                block_count:worker.block_count,
                donations:getReadableCoins(worker.donations)
            })
        }

    }
    const getUsersGraphData = function (rawData,dataType) {
        var graphData = {
            labels: [],
            values: []
        };
        
        if(rawData) {
            for (var i = 0, xy; xy = rawData[i]; i++) {
                graphData.labels.push(moment(xy[0] * 1000).format("DD/MM/YY HH:mm:ss"));
                graphData.values.push(xy[1]);
            }
        }
        
        return graphData;
    }

    const hashratesUserChart = Chart.getChart('hashratesUserChart');
    if (hashratesUserChart) {
        hashratesUserChart.data.labels = [];
        hashratesUserChart.data.datasets[0].data = [];
        const graphData = getUsersGraphData(data.miner.charts.hashrate);
        if(graphData.values.length > 0) {
            hashratesUserChart.data.labels = graphData.labels;
            hashratesUserChart.data.datasets[0].data = graphData.values;  
            hashratesUserChart.update();
        }
    }
    const paymentsUserChart = Chart.getChart('paymentsUserChart');
    if (paymentsUserChart) {
        paymentsUserChart.data.labels = [];
        paymentsUserChart.data.datasets[0].data = [];
        const graphData = getUsersGraphData(data.miner.charts.payments);
        if(graphData.values.length > 0) {
            paymentsUserChart.data.labels = graphData.labels;
            paymentsUserChart.data.datasets[0].data = graphData.values;  
            paymentsUserChart.update();
        }
    }
        

}  else {
    
    this.ui.user.lastShare = "Never";
    this.ui.user.hashrate = '0 H/s';
    this.ui.user.hashrate_1h = '0 H/s';
    this.ui.user.hashrate_6h = '0 H/s';
    this.ui.user.hashrate_24h = '0 H/s';
    this.ui.user.totalHashes = 0;
    this.ui.user.paid = getReadableCoins(0);
    this.ui.user.balance = getReadableCoins(0,9);
    this.ui.user.payoutEstimate = getReadableCoins(0,5);
    this.ui.workers = [];
}

    },
    offPage : function(oldPage) {
      switch(oldPage) {
        case 'dashboard':
        Chart.getChart("chartHashrates").destroy();
        Chart.getChart("chartEfforts").destroy();
        Chart.getChart("chartMinerWorkers").destroy();
        Chart.getChart("chartMarket").destroy();
        break;
        case 'blocks':
        Chart.getChart("blocksChartObj").destroy();
        break;
        case 'user':
        Chart.getChart("paymentsUserChart").destroy();
        Chart.getChart("hashratesUserChart").destroy();
        break;
      }

    },
    onPage : async function(newPage) {
      const self = this;
      const np = newPage.toLowerCase();
      if(!np.includes('user_')) {
        setBreadCrumbs(["Home", np.charAt(0).toUpperCase() + np.slice(1)]);
      } else {
        const submodule = np.replace('user_','');
        setBreadCrumbs(["Home", "User",submodule.charAt(0).toUpperCase() + submodule.slice(1)]);
      }
      await new Promise(resolve => {
      $(document).ready(() => {
        if(np === 'dashboard')
        {
        
          
              (() => {
                
new Chart(document.getElementById('chartHashrates'), {
  type: 'line',
  responsie: false,
  data: {
    labels: [1,2,3,4,5,6,7],
    datasets: [{
      label: '',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1]
    },{
      label: '',
      backgroundColor: 'rgba(138, 147, 162,.25)',
      borderColor: coreui.Utils.getStyle('--cui-gray'),
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1],
      fill: true,
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  }
});

              })();
              (() => {
                
new Chart(document.getElementById('chartEfforts'), {
  type: 'line',
  responsie: false,
  data: {
    labels: [1,2,3,4,5,6,7],
    datasets: [{
      label: '',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1]
    },{
      label: '',
      backgroundColor: 'rgba(138, 147, 162,.25)',
      borderColor: coreui.Utils.getStyle('--cui-gray'),
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1],
      fill: true,
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 0.5,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  }
});

              })();
              (() => {
                
new Chart(document.getElementById('chartMinerWorkers'), {
  type: 'line',
  responsie: false,
  data: {
    labels: [1,2,3,4,5,6,7],
    datasets: [{
      label: '',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1]
    },{
      label: '',
      backgroundColor: 'rgba(138, 147, 162,.25)',
      borderColor: coreui.Utils.getStyle('--cui-gray'),
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1],
      fill: true,
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 0.5,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  }
});

              })();
              (() => {
                
new Chart(document.getElementById('chartMarket'), {
  type: 'line',
  responsie: false,
  data: {
    labels: [1,2,3,4,5,6,7],
    datasets: [{
      label: '',
      backgroundColor: 'transparent',
      borderColor: 'rgba(255,255,255,.55)',
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1]
    },{
      label: '',
      backgroundColor: 'rgba(138, 147, 162,.25)',
      borderColor: coreui.Utils.getStyle('--cui-gray'),
      pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
      data: [1,1,1,1,1,1,1],
      fill: true,
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 1,
        tension: 0.4
      },
      point: {
        radius: 0.5,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  }
});

              })();


        } else if(np === 'blocks') {
              (() => {
                

new Chart(document.getElementById('blocksChartObj'), {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Blocks',
            data: [],
            fill: false,
            backgroundColor: 'rgba(3, 169, 244, .4)',
            borderColor: '#03a9f4',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        // scales: {
        //     yAxes: [{
        //         ticks: {
        //             beginAtZero: true,
        //             userCallback: function(label, index, labels) {
        //                 if (Math.floor(label) === label) return label;
        //             }
        //         }
        //     }],
        // },
        layout: {
            padding: { top: 0, left: 0, right: 0, bottom: 0 }
        }
    }
});
              })();
        } else if(np === 'user') {
              (() => {
                
    var bordercolor = '#03a9f4';
    var borderwidth = 1;
    const chartOptions = {
      type: 'line',
      responsie: false,
      data: {
        labels: [],
        datasets: [{
          label: '',
          backgroundColor: 'transparent',
          borderColor: coreui.Utils.getStyle('--cui-gray'),
          pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
          data: [],
          fill: false,
      }]
  },
  options: {
    plugins: {
        tooltip:{
            callbacks:{
                label:function(context) {
                    let label = context.dataset.label || '';
                    if (context.parsed.y !== null) {
                        label = getReadableCoins(context.parsed.y);
                    }
                    return label;
                }
            }
        },
        legend: {
            display: false
        }
},
maintainAspectRatio: false,
scales: {
  x: {
    grid: {
      display: false,
      drawBorder: false
  },
  ticks: {
      display: false
  }
},
y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
      },
      ticks: {
          display: false
      }
  }
},
elements: {
  line: {
    borderWidth: 1,
    tension: 0.4
},
point: {
    radius: 0,
    hitRadius: 10,
    hoverRadius: 4
},
}
}
};
new Chart(document.getElementById('paymentsUserChart'), chartOptions);

              })();
              (() => {
                
    var bordercolor = '#03a9f4';
    var borderwidth = 1;
    const chartOptions = {
      type: 'line',
      responsie: false,
      data: {
        labels: [],
        datasets: [{
          label: '',
          backgroundColor: 'transparent',
          borderColor: coreui.Utils.getStyle('--cui-gray'),
          pointBackgroundColor: coreui.Utils.getStyle('--cui-dark'),
          data: [],
          fill: false,
      }]
  },
  options: {
    plugins: {
        tooltip:{
            callbacks:{
                label:function(context) {
                    let label = context.dataset.label || '';
                    
                    if (context.parsed.y !== null) {
                        label = getReadableHashRateString(context.parsed.y)+'/s';
                    }
                    return label;
                }
            }
        },
        legend: {
            display: false
        }
},
maintainAspectRatio: false,
scales: {
  x: {
    grid: {
      display: false,
      drawBorder: false
  },
  ticks: {
      display: false
  }
},
y: {
        // min: 0,
        // max: 2,
        display: false,
        grid: {
          display: false
      },
      ticks: {
          display: false
      }
  }
},
elements: {
  line: {
    borderWidth: 1,
    tension: 0.4
},
point: {
    radius: 0,
    hitRadius: 10,
    hoverRadius: 4
},
}
}
};
new Chart(document.getElementById('hashratesUserChart'), chartOptions);
              })();
        }
      });
      resolve();
    });

    },
    getCurrentAddress() {
        var urlWalletAddress = location.search.split('wallet=')[1] || 0;
        var address = urlWalletAddress || docCookies.getItem(window.config.symbol.toLowerCase() + '_mining_address');
        return address;
    },
    init:function() {
      // if(this.address === null ||  this.address === "" || !this.address) {
      //   const address = docCookies.getItem(window.config.symbol.toLowerCase() +  ":address");
      //   if(address !== null &&  address !== "" && !address) {
      //     this.address = address;
      //   }
      // }
      this.address = this.getCurrentAddress();
      const pages = ["dashboard","blocks",'payments','ranks','user',"user_payments","user_settings", "user_scores"];
      const hash = window.location.hash.replace("#","").toLowerCase();
      if(hash.includes('user')) {
        this.setPage(hash && pages.indexOf(hash) >= 0 ? hash :'user');
      } else {
        this.setPage(hash && pages.indexOf(hash) >= 0 ? hash :'dashboard');
      }
      
    },
    calculatorMultiplierSet:function(i) {
        var symbol = "";
        switch(i){
          case 1:
          symbol = " ";
          this.calcEarnMulti = 1;
          break;
          case 2:
          default:
          symbol= "K";
          this.calcEarnMulti = 1000;
          break;
          case 3:
          symbol = "M";
          this.calcEarnMulti = 1000000;
          break;
        }

        this.calcEarnSymbol =symbol + 'H/s';
         //EARN = RATE * INPUT * MULTIPLIER
       },
       calculateProfit(hashrate, difficulty, lastReward) {
         //var profit = (hashRate * 86400 / difficulty) * lastReward;

       }
     },
     watch: {
      difficulty(newDiff,oldDiff) {
        this.ui.index.difficulty = formatDifficulty(newDiff);
      },
      lastHash(newHash,oldHash) {
        if(newHash !== oldHash) this.ui.lastHashLink = getBlockchainUrl(newHash);
      },
      calcEarnMulti(newRate,oldRate) {
        var profit = this.calcEarnInput * newRate * 86400 / this.difficulty;

         this.calcEarnPerDay = getReadableCoins(this.calcEarnInput * this.calcEarnRate * newRate) + " ~ " + getReadableCoins(profit * this.lastRewardMiner);
      },
      // calcEarnRate(newRate,oldRate) {
      //    this.calcEarnPerDayAverage = getReadableCoins(this.calcEarnInput * newRate * this.calcEarnMulti);
      // },
      calcEarnInput(newRate,oldRate) {
        
        if(!newRate)  return this.calcEarnPerDay = getReadableCoins(0);
          var profit = this.calcEarnMulti * newRate * 86400 / this.difficulty;
         this.calcEarnPerDay = getReadableCoins(this.calcEarnMulti * this.calcEarnRate * newRate) + " ~ " + getReadableCoins(profit * this.lastRewardMiner);

      },
      address(newAddress, oldAddress) {

        if(newAddress === oldAddress) return;
        if(this.address === null || this.address === "" || !this.address) {
          this.address = "";
          docCookies.removeItem(window.config.symbol.toLowerCase() +  "_mining_address");
          return "";
        }
        if(this.address !== this.getCurrentAddress()) {
          docCookies.setItem(window.config.symbol.toLowerCase() +  "_mining_address", newAddress, Infinity);  
        }
        
        return newAddress;
      },
      currentPage(newPage, oldPage) {
        if(newPage === oldPage) return;
        this.offPage(oldPage);
        this.onPage(newPage);

      },
      gPaymentId(nG, oG) {
        let login = this.gAddress;
        if(nG) {
          login+='.';
          login+=nG;
        }

        if(this.gDifficulty) {
          login+='+';
          login+=this.gDifficulty;
        }
        this.ui.start.login = login;

      },
      gDifficulty(nG, oG) {
        let login = this.gAddress;
        if(this.gPaymentId) {
          login+='.';
          login+=this.gPaymentId;
        }
        if(nG) {
          login+='+';
          login+=nG;
        }

        this.ui.start.login = login;
      },
      gAddress(nG, oG) {
        let login = nG;
        if(this.gPaymentId) {
          login+='.';
          login+=this.gPaymentId;
        }

        if(this.gDifficulty) {
          login+='+';
          login+=this.gDifficulty;
        }


        this.ui.start.login = login;
      },
      rankNavigation(newRank,oldRank) {
        let i = 0;
        this.ui.ranks = this.ranks[newRank].map(m => {
          i++;
          m.position = i;
          m.donations = getReadableCoins(m.donations);
          m.lastShare = moment(m.lastShare * 1000).fromNow();

          return m;
        });
      },
      
    },
    async mounted() {
      const self = this;


      var originalEndPoint = window.config.api;
      await fetch(originalEndPoint).then(async response => {
          var data = await response.json();
          self.update(data);
          self.init();
        }).catch(e => console.log(e));
      originalEndPoint+= originalEndPoint.includes("?") ? "&" : "?";
      originalEndPoint+="longpoll=true";
      self.rankNavigation = 'hashes';
      
      $('#hashrateCalculatorTrigger').on('click', () => $('#hashrateCalculatorTrigger > select').toggleClass('open'));

      window.addEventListener("hashchange", () => self.init());


      const sleepAsync = async () => await new Promise(resolve => {
          setTimeout(async () => {
            resolve(true);
          },10000);
      });

      const syncStatus = async () => {
        while(true) {
          await sleepAsync();
          var endPoint = originalEndPoint;
          const address = self.getCurrentAddress();
          if(address !== null &&  address !== "" && address !== false) {
            endPoint = originalEndPoint + "&wallet=" + address;
          }
          await fetch(endPoint).then(async response => {
            var data = await response.json();
            self.update(data);
          }).catch(e => console.log(e));

        }
      };

      syncStatus();
      
    }
  }).mount('#app');

