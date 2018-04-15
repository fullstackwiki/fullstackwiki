<?xml version="1.0"?>
<xsl:stylesheet
	version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:html="http://www.w3.org/1999/xhtml"
	>
	<xsl:output method="xml"/>
	<xsl:template match="@*|node()">
		<!-- By default, copy all tags as they are -->
		<xsl:copy>
			<xsl:apply-templates select="@*|node()"/>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template name="string-replace-suffix">
		<xsl:param name="text"/>
		<xsl:param name="search"/>
		<xsl:param name="replacement"/>
		<xsl:choose>
			<xsl:when test="$search = substring($text, string-length($text) - string-length($search) + 1)">
				<xsl:value-of select="substring($text, 0, string-length($text) - string-length($search) + 1)"/>
				<xsl:value-of select="$replacement"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<!-- Rewrite authority-relative link targets to be relative -->
	<xsl:template match="@href">
		<xsl:attribute name="href">
			<xsl:if test="starts-with(., '/')">
				<xsl:value-of select="$root" />
			</xsl:if>
			<xsl:call-template name="string-replace-suffix">
				<xsl:with-param name="text" select="."/>
				<xsl:with-param name="search" select="'.html'"/>
				<xsl:with-param name="replacement" select="'.xhtml'"/>
		 </xsl:call-template>
		</xsl:attribute>
	</xsl:template>
</xsl:stylesheet>
