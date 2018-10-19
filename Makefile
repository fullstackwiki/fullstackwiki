
# Before running:
# Install Node.js
# Install submodules `git submodule init`
# Install NPM packages `npm install`

NODEJS ?= node
XSLTPROC ?= xsltproc --nonet
RDFAT ?= $(NODEJS) ~/rdf/rdfa-template/bin/process.js

# Disable `make` builtin/implicit rules
.SUFFIXES:
# Undo file creation for failed build steps
.DELETE_ON_ERROR:

# Function for computing relative path to another file
RELPATH = $(shell python -c 'import os, sys; print(os.path.relpath(*sys.argv[1:]))' $(1) $(2))

# Get list of Markdown files
MD := $(shell find web -name '**.md')
# List of HTML files with a Markdown file dependancy
MD_HTML := $(patsubst %.md,%.html,$(MD))
# List of all HTML files from above HTML lists
HTML := $(MD_HTML) $(shell find web -name '**.html')
XHTML := $(patsubst %.html,%.xhtml,$(HTML))
INDEXES = \
	web/http/http-headers.ttl \
	web/http/http-headers.xhtml \
	web/search-index.js \

all: html $(INDEXES)

html: $(XHTML)

%.html: %.md web/about/readme.md
	$(NODEJS) bin/markdown.js $< > $@

# First, read the HTML file and style it up with the theme
# Second, modify link targets: change authority-relative references to path-relative references, and change filename extensions
%.xhtml: %.html
	$(XSLTPROC) --stringparam editlink 'https://github.com/awwright/fullstackwiki/edit/master/'$< templates/xhtml.xslt $< \
	| $(XSLTPROC) --stringparam root $(call RELPATH,web,$(dir $<)) templates/root.xslt - \
	> $@

# Make the README accessible from the website
web/about/readme.md: README.md
	cp -a $< $@

web/http/http-headers.ttl: web/http/headers/*.html
	$(NODEJS) bin/index-rdfa.js web/http/headers/*.html > $@

web/http/http-headers.html: web/http/http-headers.tpl.html web/http/http-headers.ttl
	$(RDFAT) web/http/http-headers.tpl.html web/http/http-headers.ttl 'http://fullstack.wiki/http/http-headers.html' > $@

web/search-index.js: $(XHTML)
	cat /dev/null > $@.tmp
	echo 'var searchIndex = ' >> $@.tmp
	(cd web && $(NODEJS) ../bin/lunr-index.js $(^:web/%=%)) >> $@.tmp
	mv $@.tmp $@

.PHONY: all html clean

clean:
	rm -f $(MD_HTML) $(XHTML) $(INDEXES)
