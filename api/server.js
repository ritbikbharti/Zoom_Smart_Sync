const express = require("express");
const server = express();
const AWS = require('aws-sdk');
const url = require('url');
const port = process.env.PORT || 3200;

server.listen(port, () => {
  console.log(`running at port ${port}`);
});

//IAM user credentials configuration
var credentials = {
	accessKeyId: "access id here",
	secretAccessKey: "secret key here"
};

AWS.config.update({
	credentials: credentials,
	region: 'ap-south-1'
});

////Function to handle the GET Request API Call

var presignedGETURL;

server.get('/getSignedUrl', function(req, res) {
	try {
		const reqUrl = url.parse(req.url, true);
		let bucketParams = {
			Bucket: 'bucket name here',                 //bucket name
			Key: reqUrl.query.name,              //file name is parsed from API Url
			Expires: 60*60 ,                     //Expiry time for the signed Url
			ACL: 'bucket-owner-full-control'
		}
		var s3 = new AWS.S3();
		presignedGETURL = s3.getSignedUrl('putObject', bucketParams);
		console.log("presigned url obtained from s3: ", presignedGETURL);
		res.status(200).send(presignedGETURL);     //Signed URL is returned alongwith status code 200
	}
	catch (err) {
		console.log("error call during call s3 ".concat(err))
		throw err;
	}
})

////Function to handle the DELETE Request API Call

server.delete('/deleteObject', function(req, res) {
	try{
		const reqUrl = url.parse(req.url, true);
		let bucketParams = {
			Bucket: 'minorzoom',               //bucket name
			Key: reqUrl.query.name,            //file name is parsed from API Url
		}
		var s3 = new AWS.S3();
		s3.deleteObject(bucketParams, function(err, data) {
			res.status(200).send(data);       //Status code 200 is returned if deletion successfull
			console.log(data);
		});
	}
	catch (err) {
		console.log("error during delete: ".concat(err))
		throw err;
	}
})