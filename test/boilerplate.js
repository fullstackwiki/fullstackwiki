
const assert = require('assert');
const fs = require('fs');
const util = require('util');
const mocha = require('mocha');

const {DOMParser} = require('xmldom');

// TODO: Test that each document fills necessary conditions:
// UTF-8 is valid
// XML is well-formed and valid,
// HTML is valid,
// self-closing HTML tags are self-closing in the XML,
// examples are valid, etc.

function listHTMLFiles(base){
	var files = [];
	function ls(dir){
		fs.readdirSync(dir).forEach(function(filename){
			if(fs.statSync(dir+'/'+filename).isDirectory()) ls(dir+'/'+filename);
			else if(filename.match(/\.xml$/)) files.push(dir+'/'+filename);
		});
	}
	ls(base);
	return files;
}

function testHTMLFilepath(filepath){
	it(filepath, function(){
		const document = new DOMParser({
			locator:{
				systemId: filepath,
			},
			errorHandler: function(level,msg){ throw new Error(msg); }
		}).parseFromString(fs.readFileSync(filepath, 'UTF-8'));
		testHTMLDocument(document);
	});
}

function testHTMLDocument(document){
	// Verify i18n information is set
	assert(document.documentElement.hasAttribute('lang'));
	assert(document.documentElement.hasAttribute('dir'));
	// Verify namespaces are defined
	assert.equal(document.documentElement.getAttribute('xmlns'), "http://www.w3.org/1999/xhtml");
	assert.equal(document.documentElement.getAttribute('xmlns:w'), "http://fullstack.wiki/ns/");
	// Verify the <title/> tag exists and has text content
	assert(document.getElementsByTagName('title')[0].textContent.length);
	// Verify the <meta charset="UTF-8" /> tag exists
	assert(Array.prototype.slice.call(document.getElementsByTagName('meta')).filter(function(e){
		return e.tagName=='meta' && e.hasAttribute('charset') && e.getAttribute('charset')==='UTF-8';
	}).length);
}

describe('Test HTML documents', function(){
	listHTMLFiles('web').filter(function(f){
		// Specify a list of files here to be ignored, if needed
		// Or, you know, don't
		return true;
	}).forEach(testHTMLFilepath);
});
