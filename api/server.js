const express = require("express");
const server = express();
const AWS = require('aws-sdk');
const url = require('url');
const port = process.env.PORT || 3200;
const { Client } = require('pg')
const conectionString='postgressql://petcitrusevqze:95139e9143a89ed96bb744cd186060ba9c71cee439bc71d5614b9784a42fbbcf@ec2-34-204-22-76.compute-1.amazonaws.com:5432/dr7l86pgmeq30';

const multer = require('multer'),
  path = require('path'),
  fs = require('fs'),
  miniDumpsPath = path.join(__dirname, 'app-crashes');

server.listen(port, () => {
  console.log(`running at port ${port}`);
});


//IAM user credentials configuration
var credentials = {
	accessKeyId: "enter your access key id here",
	secretAccessKey: "enter your access secret key here"
};

AWS.config.update({
	credentials: credentials,
	region: 'ap-south-1'
});


////Function to handle the GET Request API Call to allow authorization
server.get('/api/verifyUser', function(req, res) {
	try {
		const reqUrl = url.parse(req.url, true);
		var username = reqUrl.query.name;
		var pwd = reqUrl.query.pwd;
		const client= new Client({
			connectionString:conectionString,
			ssl: { rejectUnauthorized: false }
		})
		client.connect()
		
		var sql = `SELECT password,folders FROM public."Users" where id=$1 and password=$2;`;
		client.query(sql, [username,pwd] , function(err, ress) {
			if(ress.rowCount>0){
				if(ress.rows[0].password==pwd){
					res.status(200).send(ress.rows[0].folders);
				}
			}
			else{
				res.status(201).send('mybad');
			}
			client.end()
		});
	}
	catch(err) {
		console.log("error during call to db ".concat(err))
		throw err;
	}
})

////Function to handle the GET Request API Call to return the signed URL

var presignedGETURL;

server.get('/api/getSignedUrl', function(req, res) {
	try {
		const reqUrl = url.parse(req.url, true);
		let bucketParams = {
			Bucket: 'minorzoom',                 //bucket name
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

server.delete('/api/deleteObject', function(req, res) {
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

let upload = multer({
	dest: miniDumpsPath
  }).single('upload_file_minidump');

// API for crash reporting
server.post('/api/app-crash', upload, (req, res) => {
	req.body.filename = req.file.filename
	const crashData = JSON.stringify(req.body);
	fs.writeFile(req.file.path + '.json', crashData, (e) => {
	  if (e){
		return console.error('Cant write: ' +  e.message);
	  }
	  console.info('crash written to file:\n\t' + crashData);
	})
	res.end();
  });