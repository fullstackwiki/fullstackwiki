# HTTP (Hypertext Transfer Protocol)

HTTP (Hypertext Transfer Protocol) is an application-level Internet protocol for transferring and manipulating representations of resources, such as webpages. HTTP supports many features, including retrieving and manipulating resources, caching, content negotiation, range (subset) requests, link relationships, authentication, and more.


## Uses for HTTP

Use HTTP whenever you need to download files from another system on a network, or let clients manipulate the documents, settings, or devices on the network. It supports:

* Downloading & uploading documents
* Making changes to documents
* Changing the state of a device
* Authenticating users making requests
* Checking if a document has changed
* Publishing link relationships between resources
* Segmented downloads
* Caching with private and shared caches


## Table of Contents

### HTTP Concepts

* [HTTP Methods](methods/index.xml)
* [HTTP Status Codes](status-codes/index.xml)
* [HTTP Headers](headers/index.xml)
* [HTTP Authentication Schemes](authschemes/index.xml)
* [HTTP Preferences](preferences/index.xml)


### Articles

* [Clients](client.xml)
* [Servers](server.xml)
* [Idempotent requests](idempotent.xml)
* [Conditional requests](conditional.xml)
* [Redirecting requests](redirect.xml)
* [Resumable uploads](resumable-uploads.xml)
* [Conceptual Model](stack.xml)
* [Closing client connections](close.xml)
* [Query resources and server-side query evaluation](query.xml)

## Specifications

* BCP56: RFC3205: On the use of HTTP as a Substrate
* RFC3230: Instance Digests in HTTP
* RFC6249: Metalink/HTTP: Mirrors and Hashes
* RFC6265: HTTP State Management Mechanism
* RFC6266: Use of the Content-Disposition Header Field in the Hypertext Transfer Protocol (HTTP)
* RFC6585: Additional HTTP Status Codes
* RFC7230: HTTP/1.1: Message Syntax and Routing
* RFC7231: HTTP/1.1: Semantics and Content
* RFC7232: HTTP/1.1: Conditional Requests
* RFC7233: HTTP/1.1: Range Requests
* RFC7234: HTTP/1.1: Caching
* RFC7235: HTTP/1.1: Authentication
* RFC7239: HTTP Forwarded
* RFC7240: HTTP Preferences
* RFC7538: Status Code 308 (Permanent Redirect)
* RFC7540: Hypertext Transfer Protocol Version 2 (HTTP/2)
* RFC7694: Hypertext Transfer Protocol (HTTP) Client-Initiated Content-Encoding
* RFC7725: An HTTP Status Code to Report Legal Obstacles
* RFC8164: Opportunistic Security for HTTP/2
* RFC8188: Encrypted Content-Encoding for HTTP
* RFC8246: HTTP Immutable Responses
* RFC8288: Web Linking
* RFC8470: Using Early Data in HTTP

## History

### 1992-06-11
[HTTP/0.9](https://www.w3.org/DesignIssues/HTTP0.9Summary.html) is described. It only supports GET.

### 1993-03
[Gopher](https://tools.ietf.org/html/rfc1436) is first published.

### 1996-05
[RFC 1945 (HTTP/1.0)](https://tools.ietf.org/html/rfc1945#section-10.13) is published.

### 1997-01
[RFC 2068 (HTTP/1.1)](https://tools.ietf.org/html/rfc2068#section-14.37) is published.

### 1999-06
[RFC 2616 (HTTP/1.1)](https://tools.ietf.org/html/rfc2616#section-14.36) is published.

### 2014-06
[RFC 7231 (HTTP Semantics)](https://tools.ietf.org/html/rfc7231#section-5.5.2) is published.
