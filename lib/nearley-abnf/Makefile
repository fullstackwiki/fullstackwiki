
all: lib/nearley-abnf-language.ne.js

lib/nearley-abnf-language.ne.js: lib/nearley-abnf-language.ne
	node_modules/.bin/nearleyc $< -o $@
