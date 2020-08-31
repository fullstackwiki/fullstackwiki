
# E-Mail Addresses

## Syntax

The syntax for E-Mail addresses is derived from RFC 5322, which specifies the syntax for an address inside a MIME message.

The `mailbox` production should be used if you intend to allow the name of the user to be specified:

	mailbox         =   name-addr / addr-spec

This allows addresses like `abob@example.com` or `Alice Bob <abob@example.com>`.

To match only the email address portion, for example if you've collected the user's name in a different input, use the `addr-spec` production:

	addr-spec       =   local-part "@" domain

The `CFWS`, `FWS`, and `comment` productions represent strings that may be added to a MIME message, but are not technically part of the email address. To validate an email address outside the context of a MIME message, remove these productions from the ABNF.

RFC 5322 explains:

> Both atom and dot-atom are interpreted as a single unit, comprising
   the string of characters that make it up.  Semantically, the optional
   comments and FWS surrounding the rest of the characters are not part
   of the atom; the atom is only the run of atext characters in an atom,
   or the atext and "." characters in a dot-atom.

Additionally, the productions starting with `obs-` are obsolete forms that must not be generated, though they may be read by servers for historical reasons. In most cases, also remove these.

RFC 5322 explains:

> In some of the definitions, there will be non-terminals whose names
	start with "obs-".  These "obs-" elements refer to tokens defined in
	the obsolete syntax in section 4.  In all cases, these productions
	are to be ignored for the purposes of generating legal Internet
	messages and MUST NOT be used as part of such a message.

The ABNF with these rules removed becomes:

	local-part      =   dot-atom / quoted-string
	domain          =   dot-atom / domain-literal

	quoted-string   =   DQUOTE *qcontent DQUOTE
	qcontent        =   qtext / quoted-pair
	qtext           =   %d33 / %d35-91 / %d93-126
	quoted-pair     =   "\" (VCHAR / WSP)

	dot-atom        =   1*atext *("." 1*atext)
	atext           =   ALPHA / DIGIT / "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "/" /
	                    "=" / "?" / "^" / "_" / "`" / "{" / "|" / "}" / "~"

	domain-literal  =   "[" *dtext "]"
	dtext           =   %d33-90 / %d94-126

### Internationalized Email

In order to support internationalized E-Mail addresses, you must amend these rules with the rules in [RFC 6532](https://tools.ietf.org/html/rfc6532#section-3.2):

	VCHAR   =/  UTF8-non-ascii
	atext   =/  UTF8-non-ascii
	qtext   =/  UTF8-non-ascii
	dtext   =/  UTF8-non-ascii

`UTF8-non-ascii` is a production that matches UTF-8 byte multi-byte sequences (code points U+0080 and above), excluding single-byte ASCII characters. It assumes the ABNF is matching octets; so for systems that use UTF-16, UTF-32, or another encoding, [the official definition](https://tools.ietf.org/html/rfc3629) needs to be adapted.

### Length Limits

[RFC 5321](https://tools.ietf.org/html/rfc5321) specifies a maximum size for the local-part of 64 octets, and a maximum size for the domain of 255 octets. To compute this for Unicode addresses (see below), the address must be converted to UTF-8.


## Validating an Email Address

0. Verify a maximum length of 320 characters (64 + 1 + 255).
0. For Unicode addresses, verify well-formed UTF-8.
0. Match the pattern
0. Verify length limits of each component (64 bytes for the user portion, 255 for the domain portion).
0. To verify that the mailbox exists, send it an email.

Remember, validating the email address only verifies that it will not cause a syntax error with compliant E-Mail servers.
It does not actually verify that mail to the address will be received.
In order to verify that an email address is valid _for a particular user_, you must send an email address.
Do not consider this finalized until the user is able to confirm receipt.


### ASCII Regular Expression

To make a regular expression for an email address, you should follow two rules:

- The pattern must only disallow forms that are guaranteed to be non-deliverable, now and in the future
- The pattern must match the actual email address, not necessarily how it is encoded in the MIME message.

RFC 5322 specifies what is legal to send in a MIME message; consider this the upper bound on what is a legal email address.

You must remove the `CFWS`, `BWS`, and `obs-*` rules, because these are parts of MIME message that are specified to be transparent.

This produces the following regular expression:

    ("(?:[!#-\[\]-~]|\\[\t -~])*"|[!#-'*+\-/-9=?A-Z\^-~](?:\.?[!#-'*+\-/-9=?A-Z\^-~])*)@([!#-'*+\-/-9=?A-Z\^-~](?:\.?[!#-'*+\-/-9=?A-Z\^-~])*|\[[!-Z\^-~]*\])


### Internationalized Regular Expression

Since the first `UTF8-non-ascii` character is immediately after the tilde, and since all Unicode U+0080 and above are matched, it suffices to substitute each occurrence of the tilde with the highest unicode character, `\u{10FFFF}`.

In ECMAScript, using UTF-32 characters requires the "u" flag:

	/^("(?:[!#-\[\]-\u{10FFFF}]|\\[\t -\u{10FFFF}])*"|[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}](?:\.?[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}])*)@([!#-'*+\-/-9=?A-Z\^-\u{10FFFF}](?:\.?[!#-'*+\-/-9=?A-Z\^-\u{10FFFF}])*|\[[!-Z\^-\u{10FFFF}]*\])$/u

For environments that only support UTF-16 (.Net, older ECMAScript without the "u" flag), simply use `\uFFFF`, this will match surrogate pairs:

	/^("(?:[!#-\[\]-\uFFFF]|\\[\t -\uFFFF])*"|[!#-'*+\-/-9=?A-Z\^-\uFFFF](?:\.?[!#-'*+\-/-9=?A-Z\^-\uFFFF])*)@([!#-'*+\-/-9=?A-Z\^-\uFFFF](?:\.?[!#-'*+\-/-9=?A-Z\^-\uFFFF])*|\[[!-Z\^-\uFFFF]*\])$/

### Regular Expression Breakdown

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

This also sets non-capturing groups such that `match[1]` will be the user, `match[2]` will be the host. However if `match[1]` starts with a double quote, then filter out backslash escapes, and the start and end double quotes.
