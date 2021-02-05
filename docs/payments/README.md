#PAYMENT PAYOUTS PLUGIN

There are 4 events that a payout plugin must fulfilled.

##1. afterSubmit

### Description:

### Arguments

1. replies - Reply from on submit
2. miner - The miner submitting the block
3. job - The job the miner submitted
4. shareDiff - The share's difficulty
5. blockCandidate - If this is an unblocking event a block candidate should be avaliable
6. hashHex - The hex of current hash
7. blockTemplate

### Returns
Array of redis commands to execute or return false to do nothing after submit



module.exports.blockCandidate
module.exports.recordShare
module.exports.unlocker