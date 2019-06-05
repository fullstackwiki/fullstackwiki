
var rdf = require('rdf');
var rdfaParse = require('rdfa-template').parserFrom(require('rdfa').RDFaXHTMLParser);

var DOMParser = require('xmldom').DOMParser;

module.exports.IndexRDFa = IndexRDFa;
function IndexRDFa(app){
	this.app = app;
	this.data = new rdf.Dataset;
	this.graph = new rdf.Graph;
}

IndexRDFa.prototype.import = function import_(route){
	var self = this;
	if(route && route.watch){
		return route.watch(function(resource){
			self.reindexFile(resource);
		});
	}else{
		console.error('Route '+JSON.stringify(route.template)+' has no watch method');
	}
}

IndexRDFa.prototype.reindexFile = function reindexFile(resource){
	var self = this;
	var graphURI = resource.uri;
	var accept = [
		'application/x.wiki.fullstack.template+xml',
		'application/xhtml+xml',
	];
	var req = {
		url: graphURI,
		method: 'GET',
		headers: {
			accept: accept.join(', '),
		}
	};
	resource.renderString(req).then(function(res){
		var responseBody = res.body;
		// First purge the old data
		self.data.removeMatches(null, null, null, graphURI);
		// Ensure it is a document type that we index
		if(accept.indexOf(res.getHeader('Content-Type'))<0) return;
		try {
			//console.error(filepath);
			var document = new DOMParser().parseFromString(responseBody, 'text/xml');
			var result = rdfaParse(graphURI, document);
			// console.log('# '+graphURI+'\n');
			// console.log(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
			// Import new data
			result.data().forEach(function(e){
				self.data.add(new rdf.Quad(e.subject, e.predicate, e.object, graphURI));
			});
		}catch(err){
			console.error(err.stack);
		}
		self.graph.clear();
		self.data.forEach(function(s){
			self.graph.add(new rdf.Triple(s.subject, s.predicate, s.object));
		});
	});
}
