# Project #4. Build a Private Blockchain Notary Service

This is Project 4, in this project I built on the previous project and added functionality to be able to verify and notarize user data. All the functionality of the application is accessible using Web API. For this project I used Express.js Node.js Framework.

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __node app.js__ in the root directory.

## Testing the project

The file __app.js__ in the root directory has the code needed to run the API and has the server ready to listen in localhost on port number 8000.

* To test the POST endpoint for request validation use URL:
```
http://localhost:8000/requestValidation
// Use Payload as follows:
{
      "address": "address goes here"
}
```
Not providing the correct payload content will result in error.
The response should give the needed message to be verified and other attributes too.

* To test the POST endpoint for validating a message with a signature using wallet address, use URL:
```
http://localhost:8000/message-signature/validate
// Use Payload as follows:
{
      "address":"address goes here",
      "signature": "signature goes here"
}
```
Not providing the correct payload content will result in error.
The response should give the needed validation attributes.

* To test the POST endpoint for adding a star data, use URL:
```
http://localhost:8000/block
// Use Payload as follows:
{
    "address": "address goes here",
    "star": {
                "dec": DEC,
                "ra": RA,
                "mag": MAG,
                "cen": CEN,
                "story": "story goes here"
            }
}
```
Not providing the correct payload content will result in error.
The response should give the added block including the decoded story.

* To test the GET endpoint for getting a star by hash, use URL:
```
http://localhost:8000/stars/hash/x
```
x here is the hash of the block to be returned
The response should give the block with the passed hash including the decoded story. An error will be displayed if no block with the passed hash exist.

* To test the GET endpoint for getting a star by height, use URL:
```
http://localhost:8000/block/x
```
x here is the height of the block to be returned
The response should give the block with the passed height including the decoded story. An error will be displayed if no block with the passed height exist.

* To test the GET endpoint for getting stars by wallet address, use URL:
```
http://localhost:8000/stars/address/x
```
x here is the wallet address of the block(s) to be returned
The response should give an array of blocks with related to the passed wallet address including the decoded story for each block/star in the array. An error will be displayed if no blocks belong to the passed address.

## What do I learned with this Project

* I was able to use 3rd party framework to handle message verification.
* I was able to create and test GET & POST endpoints.
* I was able to handle mempool operations.
* I was able to reuse the operations I have already created in previous projects.
