
const assert = require('assert').strict;
const fs = require('fs');
const stripIndent = require('strip-indent');

const {DOMParser} = require('xmldom');
const { parseABNF } = require('../lib/nearley-abnf/index.js');

function toArray(arrayLike){ return Array.prototype.slice.call(arrayLike); }

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
			errorHandler: function(level,msg){ throw new Error(msg); },
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
	assert.equal(document.documentElement.getAttribute('xmlns:w'), "tag:fullstack.wiki,2018:ns/");
	// Verify the <title/> tag exists and has text content
	assert(document.getElementsByTagName('title')[0].textContent.length);
	// Verify the <meta charset="UTF-8" /> tag exists
	assert(toArray(document.getElementsByTagName('meta')).filter(function(e){
		return e.tagName=='meta' && e.hasAttribute('charset') && e.getAttribute('charset')==='UTF-8';
	}).length);
	// Verify that referenced documents exist
	toArray(document.getElementsByTagName('a')).forEach(function(e){
		// The links may be a full URI reference,
		// a link to a .xml document (presumably relative reference),
		// or a blank relative reference to the current document
		const uriref = e.getAttribute('href');
		if(uriref.match(/^mailto:/)) return;
		assert( uriref.match(/\/\//) || uriref.match(/\.(xml|md)($|#|\?)/) || uriref.match(/^($|#)/), e.toString() );
	});
	toArray(document.getElementsByTagName('link')).forEach(function(e){
		const uriref = e.getAttribute('href');
		// Same as above, but also could be a .css link to a stylesheet
		assert( uriref.match(/\/\//) || uriref.match(/\.(xml|md|css)($|#|\?)/) || uriref==='', e.toString() );
		// and must have a link relationship or reverse relationship
		assert( e.hasAttribute('rel') || e.hasAttribute('rev'), e.toString() );
	});
	// Test syntax
	toArray(document.getElementsByTagName('pre')).forEach(function(e){
		const pre_type = e.getAttribute('type');
		if(pre_type && e.textContent.indexOf("\n")>=0){
			// As a rule, all multi-line code samples should have w:space="indent"
			// so that the macro parser will strip out the leading whitespace.
			assert.equal(e.getAttribute('w:space'), 'indent');
		}
		const pre_text = stripIndent(e.textContent);
		switch(pre_type){
			case 'abnf': {
				const rules_abnf = parseABNF(pre_text+'\r\n');
				break;
			}
		}
	});
}

describe('Test HTML documents', function(){
	listHTMLFiles('htdocs').filter(function(f){
		// Specify a list of files here to be ignored, if needed
		// Or, you know, don't
		return true;
	}).forEach(testHTMLFilepath);
});

describe('Test syntax index pages', function(){
	listHTMLFiles('htdocs').filter(function(f){
		return f.match(/htdocs\/syntax\/.*\/index\.xml/);
	}).forEach(function(filepath){
		it(filepath, function(){
			const document = new DOMParser({
				locator:{
					systemId: filepath,
				},
				errorHandler: function(level,msg){ throw new Error(msg); },
			}).parseFromString(fs.readFileSync(filepath, 'UTF-8'));

			// Ensure the required "rules-abnf" element is present and well-formed
			const e_abnf = document.getElementById('rules-abnf');
			assert(e_abnf);
			// Walk the DOM and ensure that elements are opened in this order, if they exist
			const elementOrder = [
				'h1',
				'overview-table',
				'main-article',
				'specification',
				'syntax-imports',
				'syntax',
				'rules-abnf',
			];
			var last_found_i = -1;
			for(var e = document; e;){
				if(e.nodeType==e.ELEMENT_NODE){
					var e_id = e.hasAttribute('id') ? e.getAttribute('id') : null;
					if(e_id){
						var e_i = elementOrder.indexOf(e_id);
						if(e_i >= 0){
							assert(e_i > last_found_i, `Element ${e_id} out of order`);
							last_found_i = e_i;
						}
					}
				}
				if(e.firstChild){
					e = e.firstChild;
				}else{
					while(e && !e.nextSibling) e = e.parentNode;
					if(e) e = e.nextSibling;
				}
			}

		});
	});
});

describe('Test syntax rule pages', function(){
	listHTMLFiles('htdocs').filter(function(f){
		return f.startsWith('htdocs/syntax/') && !f.endsWith('/index.xml');
	}).forEach(function(filepath){
		it(filepath, function(){
			const document = new DOMParser({
				locator:{
					systemId: filepath,
				},
				errorHandler: function(level,msg){ throw new Error(msg); },
			}).parseFromString(fs.readFileSync(filepath, 'UTF-8'));

			const e_abnf = document.getElementById('definition-abnf');
			assert(e_abnf);

			// Title form should be "${standardName} Syntax: ${ruleName}"
			const e_title = document.getElementsByTagName('title')[0];
			assert(e_title);
		});
	});
});
