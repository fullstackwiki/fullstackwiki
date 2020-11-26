# Generate like:
# ./node_modules/.bin/nearleyc bin/gen-rule-page.parser.ne -o bin/gen-rule-page.parser.js
@{%
function getValue(d) {
	return d[0].value;
}

function literals(list) {
	var rules = {};
	for (var lit of list) {
		rules[lit] = {match: lit};
	}
	return rules;
}

var moo = require('moo');
var lexer = moo.compile(Object.assign({
	CRLF: {match: /\r?\n/, lineBreaks: true},
	comment: /;.*\r?\n/,
	WSP: {match: /[ \t]+/},
	number: {
		match: /[0-9]+/,
		value: x => JSON.parse(x),
	},
	bin_val: {
		match: /%b[01]+(?:(?:\.[01]+)*|(?:-[01]+))?/,
		value: x => x,
	},
	dec_val: {
		match: /%d[0-9]+(?:(?:\.[0-9]+)*|(?:-[0-9]+))?/,
		value: x => x,
	},
	hex_val: {
		match: /%x[0-9A-Fa-f]+(?:(?:\.[0-9A-Fa-f]+)*|(?:-[0-9A-Fa-f]+))?/,
		value: x => x,
	},
	string: {
		match: /"[\x20-\x21\x23-\x7E]*"/, // All SP and VCHAR except DQUOTE
		value: s => s.substring(1, s.length-1),
	},
	prose: {
		match: /<[ -=?-~]*>/,
		value: s => s.substring(1, s.length-1),
	},
	word: {
		match: /[A-Za-z][0-9A-Za-z-]*/,
		value: x => x,
	},
}, literals([
	"=", "/", "*", "#",
	"(", ")",
	"[", "]",
])));

function insensitive(sl) {
	var s = sl.literal;
	var result = [];
	for (var i=0; i<s.length; i++) {
		var c = s.charAt(i);
		if (c.toUpperCase() !== c || c.toLowerCase() !== c) {
			result.push(new RegExp("[" + c.toLowerCase() + c.toUpperCase() + "]"));
		} else {
			result.push({literal: c});
		}
	}
	return {subexpression: [{tokens: result, postprocess: function(d) {return d.join(""); }}]};
}

%}
@lexer lexer

rulelist -> %c_wsp:* line:+
{% function(d) { return d[1].filter(d=>d); } %}

line -> rule {% d => d[0] %}
	| c_nl {% d => null %}

rule -> word _ "=" _ elements c_nl
{% function(d) {
	return {name: d[0], rules: d[4]};
} %}

elements -> alternation _ {% d => d[0] %}

alternation -> concatenation alternation1:*
{% function(d) {
	return [d[0]].concat(d[1]).filter(v => v);
} %}

alternation1 -> _ "/" _ concatenation {% d => d[3] %}

concatenation -> repetition concatenation1:*
{% function(d) {
	return { tokens: [d[0]].concat(d[1]).filter(v => v) };
} %}

concatenation1 -> __ repetition {% d => d[1] %}

repetition -> repeat:? element
{% function(d) {
	const repeat = d[0];
	if(repeat){
		if(repeat.max===0){
			return null;
		}
		if(repeat.min===0){
			if(repeat.max===1) return {ebnf:d[1], modifier:':?'};
			if(repeat.max===null) return {ebnf:d[1], modifier:':*'};
			return {ebnf:d[1], modifier:':*', max:repeat.max};
		}else if(repeat.min===1){
			if(repeat.max===null) return {ebnf:d[1], modifier:':+'};
			return {ebnf:d[1], modifier:':+', max:repeat.max};
		}
		return {ebnf:d[1], modifier:':+', min:repeat.min, max:repeat.max};
	}
	return d[1];
} %}

repeat -> number {% function(d){ return { min: d[0], max:d[0] }; } %}
	| number:? "*" number:? {% function(d){ return { min: d[0]||0, type:d[1], max:d[2] }; } %}
	| number:? "#" number:? {% function(d){ return { min: d[0]||0, type:d[1], max:d[2] }; } %}

element -> rulename {% d => d[0] %}
	| group {% d => d[0] %}
	| option {% d => d[0] %}
	| char_val {% d => d[0] %}
	| num_val {% function(d){
		const num_val = d[0];
		var range = num_val.match(/%.([0-9A-Fa-f]+)-([0-9A-Fa-f]+)?/);
		var string = num_val.match(/%.[0-9A-Fa-f]+(?:\.[0-9A-Fa-f]+)*?/);
		var base = ({ b:2, d:10, x:16 })[num_val[1]];
		function escapeRange(chr){
			return chr.replace(/[[\]]/g, function(a){ return '\\x'+a.charCodeAt(0).toString(16) });
		}
		if(range){
			var start = escapeRange(String.fromCharCode(parseInt(range[1], base)));
			var end = escapeRange(String.fromCharCode(parseInt(range[2], base)));
			return new RegExp('[' + start + '-' + end + ']', 'u');
		}else if(string){
			const literal = num_val
				.substring(2)
				.split('.')
				.map(function(v){
					return String.fromCharCode(parseInt(v, base));
				})
				.join('')
				.replace(/[.*+?^${}()|[\]\\]/g, function(a){ return '\\x'+a.charCodeAt(0).toString(16) });
			return { literal };
		}else{
			throw new Error('Unknown num_val '+JSON.stringify(num_val));
		}
	} %}
	| prose_val {% d => d %}

group -> "(" _ alternation _ ")"
{% function(d) {
	return {subexpression: d[2]};
} %}

option -> "[" _ alternation _ "]"
{% function(d) {
	return { ebnf: {subexpression:d[2]}, modifier: ':?' };
} %}

rulename -> word {% d => d[0] %}

word -> %word {% getValue %}

char_val -> string {% d => ({literal: d[0]}) %}

num_val -> %bin_val {% getValue %}
	| %dec_val {% getValue %}
	| %hex_val {% getValue %}

number -> %number {% getValue %}

string -> %string {% getValue %}

prose_val -> %prose {% getValue %}

charclass -> %charclass  {% getValue %}

_ -> c_wsp:*

__ -> c_wsp:+

c_wsp -> %WSP | c_nl %WSP

c_nl -> %comment | %CRLF
