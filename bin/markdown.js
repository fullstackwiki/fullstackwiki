
var markdown = require( "markdown" ).markdown;
var readFileSync = require( "fs" ).readFileSync;

var sourceFilename = process.argv[2];
console.error('Source', sourceFilename);
var sourceContents = readFileSync(sourceFilename, 'UTF-8');

console.log('<!DOCTYPE html>');
console.log('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
console.log('	<head>');
console.log('		<meta charset="UTF-8" />');
console.log('		<title></title>');
console.log('		<meta name="description" content="" />');
console.log('	</head>');
console.log('	<body>');
console.log('		<main id="main-content">');
console.log(markdown.toHTML(sourceContents));
console.log('		</main>');
console.log('	</body>');
console.log('</html>');
