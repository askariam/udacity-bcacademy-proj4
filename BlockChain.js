/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

  //the constructor creates an instance of the DB and generates the Genesis blk
  constructor() {
    this.bd = new LevelSandbox.LevelSandbox();
    this.generateGenesisBlock();
  }

  // Helper method to create a Genesis Block (always with height= 0)
  // You have to options, because the method will always execute when you create your blockchain
  // you will need to set this up statically or instead you can verify if the height !== 0 then you
  // will not create the genesis block
  async generateGenesisBlock(){
    let gBlock = new Block.Block("Genesis");
    let h = undefined; // height is set to undefined to know if it got changed
    // later.
    // set Genesis Block Properties
    gBlock.time = new Date().getTime().toString().slice(0,-3);
    gBlock.hash = SHA256(JSON.stringify(gBlock)).toString();

    // Get the Height of the Chain
    await this.getBlockHeight().then((hh) => {h = hh
    }).catch((err)=>{ // catch errors if any
      console.log(err);
    });
    if (h == 0)
    {
      // add the Genesis block if not already added
      await this.addBlock(gBlock).then((blk) => {
        console.log("Genesis: \n" + blk ); // just print it.
        console.log("Genesis Block Added Successfully!");
      }).catch((err) => {
        console.log("Error creating Genesis", err);
      });
    }
  }

  // Get block height, it is a helper method that return the height of the blockchain
  getBlockHeight() {
    return this.bd.getBlocksCount(); // just call the DB to get count of objects
  }

  // Add new block
  addBlock(block) {
    if (block.hash !== "") // this is the Genesis block;
    {
      // just add it to the DB (the addLevelDBData returns a Promise)
      return this.bd.addLevelDBData(0, JSON.stringify(block).toString());
    }
    else
    {
      // get the height of the block being added (because height starts at 0)
      return this.getBlockHeight().then ((h) => {
        return this.getBlock(h-1);  // get previous block
      }).then( (blk) => {
        let prevBlock =  blk ;//JSON.parse(blk);
        block.height = prevBlock.height + 1; //height of current block
        block.time = new Date().getTime().toString().slice(0,-3);
        block.previousBlockHash = prevBlock.hash; //previous block hash
        block.hash = SHA256(JSON.stringify(block)).toString(); //hash
        return this.bd.addLevelDBData(block.height , JSON.stringify(block).toString());
      }).catch ((err) => {
        console.log(err);
      });
    }
  }

  // Get Block By Height (the getLevelDbData returns a Promise)
  getBlock(height) {
    return this.bd.getLevelDBData(height); // just call the db to get an object
  }


// added for Project 4: get block by its hash
  getBlockByHash(hash)
  {
    return this.bd.getBlockByHash(hash);
  }

// added for Project 4: get blocks for a wallet address
  getBlockByWalletAddress(address)
  {
    return this.bd.getBlockByWalletAddress(address);
  }
  // Validate if Block is being tampered by Block Height
  validateBlock(height) {
    // get the block being validated first
    return this.getBlock(height).then((resultBlock) => {
      let tempBlock = {...resultBlock};  //copy it to another block
      tempBlock.hash = "";  //reset the hash of the copy and re-calculate
      let calcHash = SHA256(JSON.stringify(tempBlock)).toString();
      // return a promise based on the check of the stored hash compared to
      // the calculated hash.
      return new Promise(function(resolve, reject){
        if (calcHash === resultBlock.hash)
        {
          resolve(true);
        }
        else{
          resolve(false);
        }
      });

    }).catch((err) => {
      console.log(err);
    });
  }

  // Validate Blockchain
  async validateChain() {
    let arr = [];  // array to hold all promises of all checks (true/false)
    let tmpArr = []; // to track where the error occurs if any
    let msgArr = [];  // to list clear messages about the error
    let self = this;

    // an async we will use try -catch
    try{
      // make sure we get the height.
      const h = await this.getBlockHeight();
      for (let i = 0; i < h ; i++ ) // loop over all blocks;
      {
        // Genesis block does not have previous block. Therefore the only check
        // we can perform is to check its validity only (no check for prev hash)
        arr.push(this.validateBlock(i));  // push the promise to the array
        tmpArr.push("Block @ height " + i);
        if (i > 0)    // for all other blocks we need to check prevBlockHash
        {
          let b1 = await this.getBlock(i);  // get current block
          let b2 = await this.getBlock(i-1); // get previous block
          // track the stage in which we are performing the check
          tmpArr.push(`Block ${i} link to Block ${i-1}`);
          // return true or false based on the check result
          arr.push(new Promise((res, rej) =>
          {
            if (b1.previousBlockHash === b2.hash)
            res(true);
            else {
              res(false);
            }
          }));
        }

      }
      return await Promise.all(arr).then((a)=>
      { // we will get the array of test results (true/false values)
        // and we will return a promise with the exact error messages only.
        for (let i = 0 ; i < a.length ; i++)
        { // we loop over all the results and we print only those with false value
          if (!a[i])
          {
            //console.log(a[i], tmpArr[i]);
            msgArr.push(tmpArr[i]); // we will resolve with this array;
          }
        }
        return new Promise((resolve, reject) => {
          resolve(msgArr);
        });
      } );

    }
    catch (err)
    {
      console.log(err);
    }
  }


  // Utility Method to Tamper a Block for Test Validation
  // This method is for testing purpose
  _modifyBlock(height, block) {
    let self = this;
    return new Promise( (resolve, reject) => {
      self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
        resolve(blockModified);
      }).catch((err) => { console.log(err); reject(err)});
    });
  }

}

module.exports.Blockchain = Blockchain;
