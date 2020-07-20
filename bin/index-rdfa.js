
var rdfa = require('rdfa');

var files = process.argv.slice(2);

var parse = rdfa.RDFaXHTMLParser.parse;

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;


files.forEach(function(filepath){
	try {
		//console.error(filepath);
		var inputContents = fs.readFileSync(filepath, 'UTF-8');
		var document = new DOMParser({
			locator: { systemId: filepath },
			errorHandler: function(level,msg){ throw new Error(msg); },
		}).parseFromString(inputContents, 'text/xml');
		var baseURI = filepath.replace(/^web\//, 'http://fullstack.wiki/');
		var result = parse(baseURI, document);
		console.log(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
	}catch(err){
		console.error(err.stack);
	}
});
