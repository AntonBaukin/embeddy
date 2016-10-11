# Embeddy

Embeddy is the OSGi skeleton application that has special boot techique
to allow to pack in single JAR file bundles with Spring 4, Log4J2,
Apache Felix and Jetty, parts of Apache Aries, Karaf, Blueprint (as
optional bundles), and any bundles specific for your application.


## Single JAR Application

The project is named so as it packs the OSGi application in regular
Java SE JAR file having the main class written in
MANIFEST.MF. When you run this jar (named as embeddy-x.y.z.jar),
it finds all the OSGi bundles packed in it, extracts them
into a temporary directory, or the user-defined permanent one.


## Table of Contents

[Application Layout](docs/layout.md)

[Building Embeddy](docs/build.md)

[Running Embeddy](docs/run.md)

[Configuring Embeddy](docs/config.md)

[Embeddy Core Libraries](docs/libs.md)

[Embeddy Boot Sequence](docs/boot.md)

[Class Loading in Embeddy](docs/class-loading.md)

[Spring Framework 4 with Springer Bundle](docs/springer.md)

[Nashorn Java Scripting with JsX](docs/jsx.md)

[Demo Web Application Bundle](docs/webapp.md)


## About the Project

The original goal of the project was to build a desktop application having
web interface instead of a regular Java’s one. To do so we need a web server
embedded, and a browser addressing local host. There are quite a few options
for a browser: also embed it (as Chromium Embedded Framework, CEF); or start
a native one. The middle variant is to take a portable native browser having
special extensions pre-installed to make it look like a regular application.
To display a full-screen animated interactive UI, or rich media content —
such as with video inserts, images and texts over — a kiosk plug-in suits
best. (Note that an embedded browser problem is not addressed
in this demo project!)

And a step aside: why should we prefer web interface over a classic desktop
one? Of course, not in every domain, but in the most of: business, data
visualization, search and information access, educational, media displays,
and many others. There are tens of pros, the best to mention are:
unification of the UI design, speed and quality, complex things made
simple with myriads of wildly-adopted libraries for JavaScript and CSS.
But the major lack is of a powerful browser stripped of it’s branding
and regular controls (such as the address bar, and tools, and the menus)
and nested with the UI required for the application — assuming that
the most of it would be placed in the web documents instead.

So, Embeddy begins from dealing with a web server. There are two opposite
variants here. First, to take an application server (such as Apache Tomcat
container, or TomEE) and to place the program there. Second, to embed a
server into the application itself. It’s the best choice here — one may
argue, but it is. Moreover, a web server is not a one to be embedded: what
about SSH server with nested command console? FTP, WebDAV?

Going further, skeleton requires a glue to bind all the component bricks
separated into single-standing unrelated projects. Simply — it’s the OSGi.
And the web server is Eclipse Jetty. SSH server and the console are ripped
from Apache Karaf framework, they are optional (and turned off in the demo
build files). In the demo local HyperSQL DBMS is used — it also comes as
the OSGi bundle. External PostrgeSQL is also supported.

Having the core composed, we take to the application itself. Not to write
it in bare Java and to cope with raw HTTP OSGi service, we need some
powerfull framework. It’s Spring. Regretfully, modern Spring Framework
is not shipped as the OSGi bundles, thus it's not compatible directly.
To meet this Springer bundle was created. It’s potential is great. Some
tricks were involved to make the class loading be as simple and straight
as in Java SE programs. Spring Web is coupled with OSGi HTTP.

But this was not enough. As a fan of JavaScript, I couldn’t pass over not to
include it in the server side layer. And migrated own infrastructure to use
Oracle Nashorn in Embeddy — JsX library. This also includes scripts (*.jsx)
that provide JSON documents directly composing them in JavaScript instead of
somehow producing from Java objects. You may check — the demo project’s
application logic is written entirely on JavaScript that store JSON
documents in the database having only one table (in the demo).

All the details are left for the documentation sections. You are also
welcomed to ask the author, to argue, and to discuss!
Thanks, Anton Baukin.
