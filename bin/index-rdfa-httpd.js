// This is a simple, minimal server to run against the RDFa Test Suite
// <http://rdfa.info/test-suite/>
var parse = require('rdfa-parser');
var fs = require('fs');
var path = require('path');
var http = require('http');
var get = require('http').get;

var httpd = http.createServer(handleRequest);
httpd.listen(8080);

function handleRequest(req, res){
	if(req.method=='OPTIONS'){
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.statusCode = 200;
		res.end();
	}
	var uri = req.url.split('uri=')[1];
	res.setHeader('Access-Control-Allow-Origin', '*');
	get(uri, function(dl){
		console.log(dl.statusCode + ' ' + uri);
		res.statusCode = dl.statusCode;
		res.setHeader('Content-Type', 'text/turtle');
		dl.setEncoding('utf8');
		let rawData = '';
		dl.on('error', function(chunk){
			res.statusCode = 500;
			res.write('# error');
			res.end();
		});
		dl.on('data', function(chunk){ rawData += chunk; });
		dl.on('end', function(){ haveData(rawData); });
	});
	function haveData(body){
		var parsed = parse.parseRDFa(body, uri);
		for (var i = 0; i < parsed.length; i++) {
			console.log(parsed[i].toString());
		}
		res.write('# <'+uri+'>\n');
		for(var i=0; i<req.rawHeaders.length; i+=2) res.write('# '+req.rawHeaders[i]+': '+req.rawHeaders[i+1]+' \n');
		res.write('#\n');
		res.write(body.replace(/^/gm, '# '));
		res.write('\n\n');
		for (var i = 0; i < parsed.length; i++) {
			res.write(parsed[i].toString()+'\n');
		}
		res.end();
	}
}
