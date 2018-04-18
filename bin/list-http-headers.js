var WAE = require('web-auto-extractor').default
var fs = require('fs');
var h = require('./lib/html-escape.js').escapeHTML;

var files = process.argv.slice(2);
var results = files.map(function(v){
	var body = fs.readFileSync(v);
	var wae = WAE();
	var parsed = wae.parse(body);
	return parsed;
});

console.log('<!DOCTYPE html>');
console.log('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
console.log('	<head>');
console.log('		<meta charset="UTF-8" />');
console.log('		<title>HTTP Headers</title>');
console.log('		<meta name="description" content="" />');
console.log('	</head>');
console.log('	<body>');
console.log('		<main id="main-content">');

console.log('<h1>HTTP Headers</h1>');
console.log('<table>');
console.log('<thead>');
console.log('<tr><th>Header Name</th><th>Direction</th><th>Description</th></tr>');
console.log('</thead><tbody>');
results.forEach(function(row){
	// This is not how to look up RDFa data, but it suffices for now
	var data = row.rdfa['HTTP-Header'] && row.rdfa['HTTP-Header'][0];
	if(!data) return;
	var description = row.metatags.description && row.metatags.description[0];
	console.log('<tr>');
	console.log('<td><a href="headers/'+h(data['HTTP-Header-name'])+'.xhtml">'+h(data['HTTP-Header-name'])+'</a></td>');
	console.log('<td>'+h(data['HTTP-Header-direction'])+'</td>');
	console.log('<td>'+h(description)+'</td>');
	//console.log('<td><pre>'+h(JSON.stringify(data, null, "\t"))+'</pre></td>');
	console.log('</tr>');
});
console.log('</tbody>');
console.log('</table>');

console.log('		</main>');
console.log('	</body>');
console.log('</html>');

