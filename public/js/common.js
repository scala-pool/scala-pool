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