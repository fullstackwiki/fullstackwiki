const inherits = require('util').inherits;
const resolve = require('url').resolve;

var app = require('../app.js');

const {DOMParser} = require('xmldom');

inherits(LintElementError, Error);
function LintElementError(message, element, uri){
	if(Error.captureStackTrace) Error.captureStackTrace(this, LintElementError);
	else this.stack = (new Error()).stack;
	// Error.call(this, message);
	this.message = message;
	this.element = element;
	if(element){
		this.uri = uri || (element.document ? element.document.documentURI : element.documentURI) ;
		this.line = element.lineNumber;
		this.column = element.columnNumber;
	}
}

function DetailReporter(){
	this.errors = [];
}
DetailReporter.prototype.emitStart = function(resource){
	console.log('\u00B7 '+resource.uri);
};
DetailReporter.prototype.emitError = function(err){
	this.errors.push(err);
	console.log('\u2718 ' + (err.message || err.toString() || err));
};
DetailReporter.prototype.emitEnd = function(){

};
DetailReporter.prototype.emitDone = function(){
	if(this.errors.length){
		console.log('\u2718 ' + this.errors.length + ' errors');
		process.exitCode = 1;
	}else{

	}
};

function SummaryReporter(){
	this.errors = [];
}
SummaryReporter.prototype.emitStart = function(r){
	process.stdout.write('.');
	this.test = r;
};
SummaryReporter.prototype.emitError = function(err){
	this.errors.push(err);
	process.stdout.write('\u2718');
};
SummaryReporter.prototype.emitEnd = function(){

};
SummaryReporter.prototype.emitDone = function(){
	process.stdout.write('\n');
	if(this.errors.length){
		console.log('\u2718 ' + this.errors.length + ' errors:');
		this.errors.forEach(function(err){
			console.log(err.uri + ' ' + err.message);
			if(err.uri){
				console.log(`\tat <${err.uri}>:${err.line}:${err.column}`);
			}else{
				const stackLines = err.stack.split("\n");
				console.log('\t'+stackLines[2]);
			}
			// console.log(err.stack);
		});
		process.exitCode = 1;
	}else{
		console.log('\u2714 No errors');
	}
};

const reporter = new SummaryReporter;

execute();

async function execute(){
	const listing = await app.listing();
	for(var i=0; i<listing.length; i++){
		const resource = listing[i];
		reporter.emitStart(resource);
		const response = await testResponse(resource);
		if(response.length){
			response.forEach(function(line){
				reporter.emitError(line);
			});
		}
		reporter.emitEnd(resource);
	}
	reporter.emitDone();
}

async function testResponse(resource){
	const req = {
		url: resource.uri,
		method: 'GET',
		headers: {
			accept: 'application/xhtml+xml',
		}
	};
	const msg = await resource.renderString(req)
	// process.stdout.write('\u2026 '+resource.uri);
	// console.log('\u2026 '+resource.uri);
	if(msg.getHeader('Content-Type') == 'application/xhtml+xml'){
		try {
			const document = new DOMParser({
				locator: { systemId: resource.uri },
				errorHandler: function(level,msg){ throw new Error(msg); },
			}).parseFromString(msg.body);
			msg.document = document;
			return verifyHTML(document).catch(function(err){
				return [ err ];
			});
		}catch(err){
			return [ err ];
		}
	}else{
		return [];
	}
}

async function verifyHTML(document){
	var errors = [];
	function assert(t, message, element){
		if(!t){
			errors.push(new LintElementError(message, element || document, document.documentURI));
		}
	}
	// Verify i18n information is set
	assert(document.documentElement.hasAttribute('lang'), 'Root element must have a `lang` property', document.documentElement);
	assert(document.documentElement.hasAttribute('dir'), 'Root element must have a `dir` property', document.documentElement);
	// Verify namespaces are defined
	assert(document.documentElement.getAttribute('xmlns') == "http://www.w3.org/1999/xhtml");
	assert(document.documentElement.getAttribute('xmlns:w') == "tag:fullstack.wiki,2018:ns/");
	// Verify the <title/> tag exists and has text content
	assert(document.getElementsByTagName('title')[0].textContent.length);
	// Verify the <meta charset="UTF-8" /> tag exists
	assert(Array.prototype.slice.call(document.getElementsByTagName('meta')).filter(function(e){
		return e.tagName=='meta' && e.hasAttribute('charset') && e.getAttribute('charset')==='UTF-8';
	}).length == 0, 'document must declare UTF-8 encoding');
	// Verify that referenced documents exist
	await Promise.all(Array.prototype.slice.call(document.getElementsByTagName('a')).map(async function(e){
		// The links may be a full URI reference,
		// a link to a .xml document (presumably relative reference),
		// or a blank relative reference to the current document
		const uriref = e.getAttribute('href');
		const uri = resolve(document.documentURI, uriref);
		const uri_abs = uri.replace(/#.*$/, '');
		if(uri.startsWith('http://fullstack.wiki/')){
			var resource = await app.prepare(uri_abs);
			assert(resource, `Target <${uri_abs}> not OK`, e);
		}
	}));
	await Array.prototype.slice.call(document.getElementsByTagName('link')).map(async function(e){
		const uriref = e.getAttribute('href');
		const uri = resolve(document.documentURI, uriref);
		const uri_abs = uri.replace(/#.*$/, '');
		// Same as above, but also could be a .css link to a stylesheet
		if(uri.startsWith('http://fullstack.wiki/')){
			var resource = await app.prepare(uri_abs);
			assert(resource, `Target <${uri_abs}> not OK`, e);
		}
		// and must have a link relationship or reverse relationship
		assert( e.hasAttribute('rel') || e.hasAttribute('rev'), 'link element must have rev/rel' );
	});
	return errors;
}
