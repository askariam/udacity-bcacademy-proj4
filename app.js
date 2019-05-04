// Importing Express Module
const express = require('express');

// Importing BodyParser Module
const bodyParser = require('body-parser');

// Importing BlockChain module and Initializing my Blockchain
const myBlockChain = require('./BlockChain');
const BChain = new myBlockChain.Blockchain();

// Importing hex2ascii module
const hex2ascii = require('hex2ascii');

// Importing and Initializing mempool component
const Mempool = require('./Mempool');
const mempoolObj = new Mempool.Mempool();

// Importing Block Module
const Block = require('./Block');

// Selecting port number 8000
const port = 8000;

// initialize express app
const app = new express;

// use body parser to enable JSON body to be presented in request object
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); //like intercept to the server requests.

// constants to be used to check for the mempool requests;
const NOT_FOUND = 'not found';
const NOT_VALID = 'invalid';

// POST endpoint to receive a validation request.
// the API request must have a payload with the wallet address in JSON format.
app.post('/requestValidation', (req, res) => {
  try
  {
    if (req.body.address) // address must be populated
    {
      // if it is avaliable we add the request validation to mempool
      res.status(201).send(mempoolObj.addRequestValidation(req));
    }
    else {
      // send an error to the caller
      res.status(500).send("Please provide an address!");
    }
  }
  catch (e) // in case any error caught.
  {
    res.status(500).send(e + "Bad request! please check the payload!");
  }

});

// POST endpoint to validate a message with signature
app.post('/message-signature/validate', (req, res) => {
  try
  {
    // both address and signature must be populated
    if (req.body.address && req.body.signature)
    {
      // call the mempool validateRequestByWallet
      let msgValidationResult = mempoolObj.validateRequestByWallet(req);
      if (msgValidationResult === NOT_FOUND) // no active requests for the address
      {
        res.status(500).send("No active requests for this wallet. Submit one using /requestValidation");
      }
      else if (msgValidationResult === NOT_VALID) // validation failed.
      {
        res.status(500).send("Message Validation Failed!");
      }
      else {
        res.status(201).send(msgValidationResult); // return the response
      }
    }
    else {
      res.status(500).send("Please provide an address and signature!");
    }
  }
  catch (e) // to handle any errors
  {
    res.status(500).send("Bad request! please check the payload!");
  }
});

// this is the star body template to be used to create star objects
let bodyTemp = {
  "address": null,
  "star": {
    "ra": null,
    "dec": null,
    "mag": null,
    "cen": null,
    "story": null
  }
};

// POST endpoint API to add a star
app.post('/block', (req, res) => {
  try {
    // address and star data must be poulated.
    if (req.body.address && req.body.star)
    {
      //check that the star is not an array. (one star at a time requirements)
      if (typeof req.body.star.length === 'undefined' ) // if no length then not array
      {
        // check if there is a valid request (verified)
        if (mempoolObj.verifyAddressRequest(req))
        {
          // if yes, build the response by assigning attributes from req
          let body = { ...bodyTemp };
          body.address = req.body.address;
          for (let key in req.body.star)
          {
            if (key === "story") // encode the story.
            {
              body.star[key] = Buffer.from(req.body.star[key], "utf8").toString('hex');
            }
            else {  // just pass the attribute
              body.star[key] = req.body.star[key];
            }
          }

          for (let key in body.star) // to delete non-populated properties
          {
            if (body.star[key] == null)
            {
              delete body.star[key];
            }
          }

          //adding the block to the blockchain
          let toAddBlock = new Block.Block(body);
          let p = BChain.addBlock(toAddBlock); // get the promise resolve value
          p.then((b) => {
            b = JSON.parse(b);
            // for the requirements (one star at a time), remove the validation
            // requests after adding the star
            mempoolObj.removeValidationRequest(req.body.address);
            mempoolObj.removeValidRequest(req.body.address);

            //get and add the story decoded to the response.
            if (b.body.star)
            {
              b.body.star.storyDecoded = hex2ascii(b.body.star.story);
            }
            res.status(201).send(b);
          });

        }
        else {
          res.status(500).send("No active requests for this address!");
        }
      }
      else {
        res.status(500).send("Make sure you send one star only!");
      }
    }
    else {
      res.status(500).send("Please provide correct payload content");
    }

  }
  catch (e)
  {
    res.status(500).send("Bad request! please check the payload!");
  }
});



// GET endpoint API to get a star(block) by height
app.get('/block/:height', (req, res) =>
{
  try{
    // if height is not specified, the framework itself return
    // message: Cannot GET /block/ (no need to handle this case).
    let height = req.params.height;   //get the height
    let p = BChain.getBlock(height);  //get the block (promise)
    p.then((b) => {
      // the getBlock promise will resolve with undefined if block not found.
      if (b === undefined)
      {
        res.status(404).json({
          "status": 404,
          "message": "Block not found"
        });
      }
      else {
        // get the decoded story and add to the response
        if (b.body.star)
        {
          b.body.star.storyDecoded = hex2ascii(b.body.star.story);
        }
        res.status(201).send(b);
      }

    });
  }
  catch (e)
  {
    res.status(500).send("Bad request! please check the payload!");
  }
});


// GET endpoint API to get star/block by hash
app.get('/stars/hash/:hash', (req, res) =>
{
  try{
    let hash = req.params.hash.trim();   //get the hash from the request.
    let p = BChain.getBlockByHash(hash);
    p.then((b) => {
      // the getBlockByHash promise will resolve with undefined if block not found.
      if (b === undefined)
      {
        res.status(404).json({
          "status": 404,
          "message": "Block not found"
        });
      }
      else {
        // get the decoded story and added to the response.
        if (b.body.star)
        {
          b.body.star.storyDecoded = hex2ascii(b.body.star.story);
        }
        res.status(201).send(b);
      }
    });
  }
  catch (e)
  {
    res.status(500).send("Bad request! please check the payload!");
  }
});

// GET endpoint API to get blocks/stars by wallet address
// this expects an array of blocks
app.get('/stars/address/:address', (req, res) =>
{
  try{
    let address = req.params.address.trim();   //get the wallet address
    let p = BChain.getBlockByWalletAddress(address);
    p.then((bArr) => {
      // if the array is empty we response with proper error.
      if (bArr.length == 0)
      {
        res.status(404).json({
          "status": 404,
          "message": "No Blocks found for the address!"
        });
      }
      else {
        // get the decoded story for all the blocks and adjust the array
        for (let i in bArr)
        {
          bArr[i].body.star.storyDecoded = hex2ascii(bArr[i].body.star.story)
        }
        // response with the array
        res.status(201).send(bArr);
      }
    });
  }
  catch (e)
  {
    res.status(500).send("Bad request! please check the payload!");
  }
});

// start express app
app.listen(port, () => console.log(`Server Listening for port: ${port}`)) ;
