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
  
}
Vue.createApp({
  data() {
    return {
      selectedMarket:"LTC",
      hosts:window.config.poolHosts,
      algos:["panthera"],
      ports:[],
      ui : {
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
        payments : {
          payment_total : 0,
          payment_miners : 0,
          max_payout : 0,
          min_payout : 0,
          interval : 0,
          denomation : 0,
          donations : 0,
          fee : 0,
          networkFee: 0
        }
      },
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
      address: false,
      height: 1,
      difficulty : 0,
      lastReward: 0,
      currentPage : "none",
      gPaymentId:'',
      gDifficulty:'',
      gAddress:'',
      holdUpdatePayments:false,
      holdUpdateBlocks:false
    }
  },
  methods: {
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
    this.ports = data.config.ports;
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


    const blocksResults = data.pool.blocks;

      if(!this.holdUpdateBlocks) {
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
        this.ui.block.averageBlockDay = formatDifficulty(blockCount/days.length, 2, false);
      }

      this.ui.payments.payment_total = (data.pool.totalPayments || 0).toString();
      this.ui.payments.payment_miners = data.pool.totalMinersPaid.toString();
      this.ui.payments.max_payout = getReadableCoins(data.config.maxPaymentThreshold);
      this.ui.payments.min_payout = getReadableCoins(data.config.minPaymentThreshold);
      this.ui.payments.interval = getReadableTime(data.config.paymentsInterval);
      this.ui.payments.denomation = getReadableCoins(data.config.denominationUnit, data.config.coinDecimalPlaces);
      this.ui.payments.donations = getReadableCoins(data.pool.totalDonations);
      this.ui.payments.fee = getReadableCoins(data.config.devFee);
      this.ui.payments.networkFee = data.config.dynamicTransferFee ? "Base on blockchain" : getReadableCoins(data.config.networkFee);
    },
    setAddress : function(addr) {
      this.address = addr;
    },
    offPage : function(oldPage) {
      switch(oldPage) {
        case 'index':
        Chart.getChart("chartHashrates").destroy();
        Chart.getChart("chartEfforts").destroy();
        Chart.getChart("chartMinerWorkers").destroy();
        Chart.getChart("chartMarket").destroy();
        break;
      }

    },
    onPage : async function(newPage) {
      const self = this;

      switch(newPage) {
        case 'blocks':
        setBreadCrumbs(["Home", "Blocks"]);
        break;
        case 'payments':
        setBreadCrumbs(["Home", "Payments"]);
        break;
        case 'index':
        setBreadCrumbs(["Home", "Dashboard"]);

        await new Promise(resolve => {
          $(document).ready(() => {
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

            resolve();
          });
        });
        break;
      }
    },
    init:function() {
      if(!this.address) {
        this.address = window.localStorage.getItem(window.config.symbol +  ":address");
      }
      const pages = ["index","blocks",'payments'];
      const hash = window.location.hash.replace("#","");
      this.setPage(hash && pages.indexOf(hash) >= 0 ? hash :'index');
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
        window.localStorage.setItem(window.config.symbol +  ":address", newAddress);
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
      }
    },
    async mounted() {
      const self = this;
      const endPoint = window.config.api;
      await fetch(endPoint).then(async response => {
          var data = await response.json();
          self.update(data);
          self.init();
        }).catch(e => console.log(e));
      

      $('#hashrateCalculatorTrigger').on('click', () => $('#hashrateCalculatorTrigger > select').toggleClass('open'));

      window.addEventListener("hashchange", () => self.init());
      setInterval(async () => {
        await fetch(endPoint).then(async response => {
          var data = await response.json();
          self.update(data);
        }).catch(e => console.log(e));
      },10000);
    }
  }).mount('#app');

