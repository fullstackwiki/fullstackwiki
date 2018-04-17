
# Fullstack.wiki

## Charter

Fullstack.wiki is a repository of documentation for how to build reliable, accessible, cross-platform Web applications.

This repository includes all the broad categories of content:

* Original specification text, for offline reference
* Writing technical standards & participating in standards groups
* Writing Web applications
* Writing Web user-agents
* Techniques & tools for programming


## Principles

* Document techniques for building reliable, accessible, cross-platform Web applications.
* Centrally document how to use/implement standards, cross referencing the relevant documents.
* Keep things simple.
* Document best practices, not necessarially everything.
* Document implementation status by each platform.
* Explain how to degrade on platforms that don't support the feature.
* Emphasize security and defense in depth.
* Keep accessibility, UX, and security notes in-line as essential requirements, not as separate sections.


## Building

1. Install Node.js
1. Install submodules (if any, `git submodule update --init`)
1. Install NPM packages (`npm install`)
1. run `make`

## Index of Files

* `bin/` - Executables and helper scripts
* `templates/` - Declarative documents and transforms
* `web/` - webroot/docroot for the website
* `Makefile` - The commands to build the website
* `index.html` - Redirects to the index inside `web/` for the lazy


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
