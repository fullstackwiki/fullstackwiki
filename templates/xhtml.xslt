<?xml version="1.0"?>
<xsl:stylesheet
	version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:html="http://www.w3.org/1999/xhtml"
	>
  <xsl:output method="xml"/>
  <xsl:template match="/">
  <!--<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">-->
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr">
	<head profile="http://www.w3.org/1999/xhtml/vocab">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<!--<base><xsl:attribute name="href"><xsl:value-of select="$root" /></xsl:attribute></base>-->
		<link rel="stylesheet" href="/style/default.css" />
		<title><xsl:value-of select="//title" /> | WebDev.docs</title>
	</head>
	<body class="">
		<div id="skip-link">
			<a href="#main-content">Skip to main content</a>
		</div>
		<header>
			<ul>
				<li><h1><a href="/index.xhtml">WebDev.docs</a></h1></li>
				<li><a href="/protocols/index.xhtml">Protocols</a></li>
				<li><a href="/media_types/index.xhtml">Media Types</a></li>
				<li><a href="/vocabularies/index.xhtml">Vocabularies</a></li>
				<li><a href="/tools/index.xhtml">Tools</a></li>
				<li><a href="/about/index.xhtml">About</a></li>
			</ul>
			<form id="search">
				<input type="search" placeholder="Search..." />
			</form>
		</header>
		<main id="#main-content">
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

	<xsl:template match="html:a">
		<!-- Modify the target of links to reflect the new filename extension -->
		<a>
			<xsl:attribute name="href"><xsl:value-of select="@href" /></xsl:attribute>
			<xsl:copy>
				<xsl:apply-templates select="@*|node()"/>
			</xsl:copy>
		</a>
	</xsl:template>
</xsl:stylesheet>
