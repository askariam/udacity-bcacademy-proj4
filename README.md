# Project #3. RESTful Web API with Node.js Framework

This is Project 3, in this project I created the RESTful API to expose some functionality of my private blockchain through web API. For this project I used Express.js Node.js Framework.

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __node app.js__ in the root directory.

## Testing the project

The file __app.js__ in the root directory has the code needed to run the API and have the server ready to listen in localhost on port number 8000.

* To test the GET endpoint use URL:
```
http://localhost:8000/block/x
```
x here is the block height

* To test the POST endpoint use URL:
```
http://localhost:8000/block
// Use Payload as follows:
{
      "body": "Testing block with test string data"
}
```
Not providing the Payload content will result in error.

## What do I learned with this Project

* I was able to use 3rd party framework for creating the API.
* I was able to create and test GET & POST endpoints.
* I was able to reuse the operations I have already created in the Blockchain.
