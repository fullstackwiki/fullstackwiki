
const assert = require('assert');
const fs = require('fs');
const util = require('util');
const mocha = require('mocha');

const {DOMParser} = require('xmldom');

// TODO: Test that each document fills necessary conditions... UTF-8 is valid, XML is valid, HTML is valid, examples are valid, etc.

function listHTMLFiles(base){
	var files = [];
	function ls(dir){
		fs.readdirSync(dir).forEach(function(filename){
			if(fs.statSync(dir+'/'+filename).isDirectory()) ls(dir+'/'+filename);
			else if(filename.match(/\.html$/)) files.push(dir+'/'+filename);
		});
	}
	ls(base);
	return files;
}

function testHTMLFilepath(filepath){
	it(filepath, function(){
		const document = new DOMParser().parseFromString(fs.readFileSync(filepath, 'UTF-8'));
		testHTMLDocument(document);
	});
}

function testHTMLDocument(document){
	assert(document.documentElement.hasAttribute('lang'));
	assert(document.documentElement.hasAttribute('dir'));
	assert.equal(document.documentElement.getAttribute('xmlns'), "http://www.w3.org/1999/xhtml");
	assert.equal(document.documentElement.getAttribute('xmlns:w'), "http://fullstack.wiki/ns/");
}

describe('Test HTML documents', function(){
	listHTMLFiles('web').filter(function(f){
		// Specify a list of files here to be ignored, if needed
		// Or, you know, don't
		return true;
	}).forEach(testHTMLFilepath);
});
