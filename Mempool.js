/*
from the project description:
The mempool component will store temporal validation requests for 5 minutes (300 seconds).
The mempool component will store temporal valid requests for 30 minutes (1800 seconds).
*/
const TimeoutRequestsWindowTime = 5*60*1000; // in millisecond
const TimeoutMempoolValidWindowTime = 30*60*1000; // in millisecond

// Importing bitcoin message module to use for verfication
const bitcoinMessage = require('bitcoinjs-message');

// Template for validation request object (will be used to create objects)
const reqObjectTemp =
{
  "walletAddress" : '',
  "requestTimeStamp" : '',
  "message": '',
  "validationWindow" : TimeoutRequestsWindowTime / 1000
};

// Template for valid request object (will be used to create objects)
const validReqTemp =
{
    "registerStar": true,
    "status": {
        "address": '',
        "requestTimeStamp": '',
        "message": '',
        "validationWindow": TimeoutMempoolValidWindowTime / 1000 ,
        "messageSignature": false
    }
};

// The mempool class
class Mempool {
  constructor ()
  {
    this.mempool = [];  // to hold validation request
    this.timeoutRequests = []; // to hold timeouts for validaton requets.
    this.mempoolValid = [];   // to hold valid requests.
    this.timeoutValid = [];   // to hold timeouts for valid requests
  }

// add request validation takes the API request as parameter
  addRequestValidation (req)
  {
    let address = req.body.address; //get the address from the request
    let tReq; // validation request
    if (this.mempool[address])  //if already exist for this address.
    {
      //return the same request after updating the validation window
      tReq = this.mempool[address];
      let timeElapse = (new Date().getTime().toString().slice(0,-3)) - tReq.requestTimeStamp;
      let newWindow = (TimeoutRequestsWindowTime / 1000) - timeElapse;
      tReq.validationWindow = newWindow;
    }
    // if it does not exist, we create it and added to the mempool and return it.
    else {
      tReq = { ...reqObjectTemp }; // new request copied from request object template
      tReq.walletAddress = address;
      tReq.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
      tReq.message =  `${address}:${tReq.requestTimeStamp}:starRegistry`;
      this.mempool[address] = tReq;
      this.timeoutRequests[address] = setTimeout(() => {
        this.removeValidationRequest(address);
      },TimeoutRequestsWindowTime);
    }
    return tReq;
  }

// validate request using wallet. it takes API request as parameter
  validateRequestByWallet(req)
  {
    const NOT_FOUND = 'not found';
    const NOT_VALID = 'invalid';
    let address = req.body.address; //get the address and signature from the request
    let sig = req.body.signature;
    let tReq; // validation request
    if (this.mempoolValid[address]) // if already exist
    {
      let aReq = this.mempoolValid[address];
      // make sure the signature is still valid.
      // if yes, return the same object after updating the validation window.
      if (bitcoinMessage.verify(aReq.status.message,address, sig))
      {
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - aReq.status.requestTimeStamp;
        let newWindow = (TimeoutMempoolValidWindowTime / 1000) - timeElapse;
        aReq.status.validationWindow = newWindow;
        return aReq;
      }
      else { // if signature has changed;
        return NOT_VALID;
      }
    }

    // if no valid request exists, search for request validation.
    if (this.mempool[address]) // if not found then either timed out or not exist
    {
      tReq = this.mempool[address];
      // verify the message against the signature using the wallet.
      let isValid = bitcoinMessage.verify(tReq.message, address, sig);
      if (!isValid) // if not valid, return the error message.
      {
        return NOT_VALID;
      }
      else {
        // if valid, we create the response and add it to valid requests and return.
        let vReq = { ...validReqTemp };
        vReq.status.address = 'address';
        vReq.status.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
        vReq.status.message = tReq.message;
        vReq.status.validationWindow = TimeoutMempoolValidWindowTime / 1000;
        vReq.status.messageSignature = true;
        this.mempoolValid[address] = vReq;
        this.timeoutValid[address] = setTimeout(() => {
          this.removeValidRequest(address);
        },TimeoutMempoolValidWindowTime);

        return vReq;
      }
    }
    else { // no request validation found.
      return NOT_FOUND;
    }
  }

// verifiy address request. takes API request as parameter. it returns true
// if there is a valid request in the valid mempool and false otherwise.
  verifyAddressRequest(req)
  {
    let address = req.body.address;
    if (this.mempoolValid[address])
    {
      return true;
    }
    else {
      return false;
    }
  }

// used to remove requests after timeout or after being used (consumed);
  removeValidationRequest (address)
  {
    delete this.mempool[address];
    delete this.timeoutRequests[address];
  }
  removeValidRequest (address)
  {
    delete this.mempoolValid[address];
    delete this.timeoutValid[address];
  }
}

module.exports.Mempool = Mempool;
