<?xml version="1.0"?>
<xsl:stylesheet
	version="1.0"
	xmlns="http://www.w3.org/1999/xhtml"
	xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:w="http://fullstack.wiki/ns/"
	>
  <xsl:output method="xml"/>
  <xsl:template match="/">
<!--<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">-->
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr" xml:space="preserve">
	<head profile="http://www.w3.org/1999/xhtml/vocab">
		<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<xsl:apply-templates select="//html:meta[@name]" />
		<!--<base><xsl:attribute name="href"><xsl:value-of select="$root" /></xsl:attribute></base>-->
		<link rel="stylesheet" href="/style/default.css" />
		<title><xsl:apply-templates select="/html:head/html:title"/> | Fullstack.wiki</title>
		<!-- the search runner will use this id= to get the src attribute -->
		<script id="search-runner-script" type="application/ecmascript" src="/style/search-runner.js"></script>
	</head>
	<body class="">
		<div id="skip-link">
			<a href="#main-content">Skip to main content</a>
		</div>
		<header>
			<ul>
				<li><h1><a href="/index.xhtml">Fullstack.wiki</a></h1></li>
				<li><a href="/protocols/index.xhtml">Protocols</a></li>
				<li><a href="/media_types/index.xhtml">Media Types</a></li>
				<li><a href="/vocabularies/index.xhtml">Vocabularies</a></li>
				<li><a href="/tools/index.xhtml">Tools</a></li>
				<li><a href="/about/index.xhtml">About</a></li>
			</ul>
			<form id="searchform" action="/index.xhtml">
				<input type="search" name="q" id="search" placeholder="Search..." />
			</form>
			<div id="search-results">
				<div class="search-results-header">Search Results</div>
				<table><tbody id="search-results-list"></tbody></table>
			</div>
		</header>
		<main id="main-content">
			<div id="edit"><a><xsl:attribute name="href"><xsl:value-of select="$editlink" /></xsl:attribute>Edit on GitHub</a></div>
			<xsl:apply-templates select="//html:main/*"/>
		</main>
	</body>
</html>
	</xsl:template>

	<xsl:template match="@*|node()">
		<!-- By default, copy all tags as they are -->
		<xsl:copy>
			<xsl:apply-templates select="@*|node()"/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="html:main">
		<!-- Ignore the outer <main> tag and its attributes -->
		<xsl:copy>
			<xsl:apply-templates select="node()"/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="w:http-header">
		<nav><ol class="breadcrumbs">
			<li><a href="/http/index.html">HTTP</a></li>
			<li><a href="/http/http-headers.html">Headers</a></li>
			<xsl:apply-templates select="node()"/>
		</ol></nav>
	</xsl:template>

</xsl:stylesheet>
