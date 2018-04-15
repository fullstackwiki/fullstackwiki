
# Before running:
# Install Node.js
# Install submodules `git submodule init`
# Install NPM packages `npm install`

NODEJS ?= node
XSLTPROC ?= xsltproc --nonet

# Disable `make` builtin/implicit rules
.SUFFIXES:

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
	web/http/http-headers.json \
	web/http/http-headers.html \
	web/search-index.js \

all: html $(INDEXES)

html: $(XHTML)

%.html: %.md web/about/readme.md
	$(NODEJS) bin/markdown.js $< > $@

# First, read the HTML file and style it up with the theme
# Second, modify link targets: change authority-relative references to path-relative references, and change filename extensions
%.xhtml: %.html
	$(XSLTPROC) templates/xhtml.xslt $< \
	| $(XSLTPROC) --stringparam root $(call RELPATH,web,$(dir $<)) templates/root.xslt - \
	> $@

# Make the README accessible from the website
web/about/readme.md: README.md
	cp -a $< $@

web/http/http-headers.json:
	$(NODEJS) bin/index-rdfa.js web/http/headers/*.html > $@

web/http/http-headers.html: web/http/headers/*.html
	$(NODEJS) bin/list-http-headers.js $^ > $@

web/search-index.js: web/http/headers/*.html
	cat /dev/null > $@
	echo 'var searchIndex = ' >> $@
	$(NODEJS) bin/lunr-index.js $^ >> $@
	echo ';if(typeof searchIndexLoaded=="function") searchIndexLoaded();' >> $@

.PHONY: all html clean

clean:
	rm -f $(MD_HTML) $(XHTML) $(INDEXES)
