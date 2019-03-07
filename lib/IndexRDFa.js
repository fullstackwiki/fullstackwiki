
var rdf = require('rdf');
var rdfaTemplate = require('rdfa-template');

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
const { makeRequestBuffered, Route, Resource } = require('dive-httpd');

module.exports.IndexRDFa = IndexRDFa;
function IndexRDFa(app){
	this.app = app;
	this.data = new rdf.Dataset;
	this.graph = new rdf.Graph;
}

IndexRDFa.prototype.import = function import_(route){
	var self = this;
	if(route.name && route.name.watch){
		route.name.watch(function(data){
			self.reindexFile(route.gen(data));
		});
	}else{
		console.error('Route '+JSON.stringify(route.template)+' has no watch method');
	}
}

IndexRDFa.prototype.reindexFile = function reindexFile(graphURI){
	var self = this;
	this.app.makeRequestBuffered({url: graphURI, method:'GET'}).then(function(res){
		// First purge the old data
		self.data.removeMatches(null, null, null, graphURI);
		// Ensure it is a document type that we index
		if(res.getHeader('Content-Type')!=='application/xhtml+xml') return;
		try {
			//console.error(filepath);
			var document = new DOMParser().parseFromString(res.body, 'text/xml');
			var result = rdfaTemplate.parse(graphURI, document);
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
		})
	});
}
IndexRDFa.prototype.createRoute = function createRoute(){
	return RouteRDF({index:this});
}
