

# Deriving an email address regular expression

To make a regular expression for an email address, you should follow two rules:

- The pattern must only disallow forms that are guaranteed to be non-deliverable, now and in the future
- The pattern must match the actual email address, not necessarily how it is encoded in the MIME message.

To start, RFC 5322 specifies what is legal to send in a MIME message; consider this the upper bound on what is a legal email address.

However, to follow this ABNF exactly would be a mistake: this pattern technically represents how you encode an email address _in a MIME message_, and allows strings not part of the email address, like folding whitespace and comments; and support for obsolete forms that are not legal to generate (but that servers read for historical reasons). When most people ask for an email address, they do not likely include these.

By removing the `CFWS`, `BWS`, and `obs-*` rules from the `addr-spec` in RFC 5322, you can produce this regular expression:

    ("(?:[!#-\[\]-~]|\\[\t -~])*"|[!#-'*+\-/-9=?A-Z\^-~](?:\.?[!#-'*+\-/-9=?A-Z\^-~])*)@([!#-'*+\-/-9=?A-Z\^-~](?:\.?[!#-'*+\-/-9=?A-Z\^-~])*|\[[!-Z\^-~]*\])

It contains the following components:

* The user part before the @ may be a dot-atom or a quoted-string
* `"([!#-\[\]-~]|\\[\t -~])*"` specifies the quoted-string form of the user, e.g. `"root@home"@example.com`. It permits any non-control character inside double quotes; except that spaces, tabs, doublequotes, and backslashes must be backslash-escaped.
* `[!#-'*+\-/-9=?A-Z\^-~]` is the first character of the dot-atom of the user
* `(\.?[!#-'*+\-/-9=?A-Z\^-~])*` matches the rest of the user part, allowing dots (except after another dot, or as the final character)
* `@` denotes the domain
* The domain part may be a dot-atom or a domain-literal
* `[!#-'*+\-/-9=?A-Z\^-~](\.?[!#-'*+\-/-9=?A-Z\^-~])*` is the same dot-atom form as above, but here it represents domain names and IPv4 addresses.
* `\[[!-Z\^-~]*\]` will match IPv6 addresses and future definitions of host names.

This RegExp allows all spec-compliant email addresses, and can be used verbatim in a MIME message (except for line length limits, in which case folding whitespace must be added).

This also sets non-capturing groups such that `match[1]` will be the user, `match[2]` will be the host. (However if `match[1]` starts with a double quote, then filter out backslash escapes, and the start and end double quotes.)
