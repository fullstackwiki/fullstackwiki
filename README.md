
# Fullstack.wiki

## Charter

Fullstack.wiki is a repository of documentation for how to build reliable, accessible, cross-platform Web applications.

This can be broken down into several broad categories of content:

* Original specification text, for offline reference
* Writing technical standards & participating in standards groups
* Writing Web applications (i.e. publishing data)
* Writing Web user-agents (i.e. consuming data)
* Techniques & tools for programming


## Principles

* Document techniques for building reliable, accessible, cross-platform Web applications.
* Centrally document how to use/implement standards, cross referencing the relevant authortative documents.
* Document best practices, not necessarially everything.
* Document implementation status by each platform.
* Support progressive enhancement and graceful degradation.
* Encourage defense in depth and emphasize security at every step.
* Keep accessibility, UX, and security notes in-line as essential requirements, not as separate sections.


## Prerequisites

* make
* node
* npm (or compatible package install)


## Building

1. Install submodules (if any, `git submodule update --init`)
1. Install dependencies (`yarn install`)
1. run `make`


## Index of Files

* `bin/` - Executables and helper scripts
* `lib/` - Web server related libraries
* `web/` - webroot/docroot for the website
* `app.js` - Web server routing
* `Makefile` - The commands to build the website
* `index.html` - Redirects to the `web/index.xhtml` for the lazy


## Technical requirements

* Host specifications as HTML
* Convert plaintext RFCs to HTML
* Searchable collection of documents for quick navigation
* Cross-references to other pages and official standards
* Extract RDF data from HTML pages
* Build indexes and tables from RDF data
* Provide implementation status of features by different implementations, aggregated from test suites
* Syntax highlighting of code blocks
* Test your own input against ABNF & validators
* List compliant implementations in your programming language
