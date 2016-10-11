# Build Embeddy

Embeddy is a skeleton OSGi application. The `webapp` folder contains the
demo application bundle. Exclude it from your project or rewrite. Look
how `webapp` bundle is organized. Note that it both adds required OSGi
bundles into the application root (PostgreSQL driver), and includes
regular JAR libraries into own bundle.

To build Embeddy from the source code you require:
1) Apache Ant installed;
2) Apache Ivy added to Ant. To accomplish this download Ivy distribution
   archive having all the debendent libraries included and unpack all
   JAR files into `ant/lib` directory;
3) Java JDK 1.8.


## The Default Build

Simply run `ant` in the root directory of the sources, and you'll get
the default build of Embeddy that includes:

1) Embeddy boot application (with the system library);
2) Apache Felix OSGi framework of version 5.4;
3) Embeddy Loggy bundle that makes overall logging to Log4J2 version 2.5;
4) Embeddy Springer bundle that provides Spring Framework version 4.2.6 to
   your bundles with annotations scanning and class load weaving supported;
5) Webapp bundle with sample web application;
6) Eclipse Jetty HTTP server version 9.3.8.

You also able to add Apacke Karaf Console version 4.0.5 with embedded
Apache SSH server version 0.14 to remotely login into the application.


#### Apache Karaf Console

Apache Karaf Framework is a complex application shipped as multiple
OSGi bundles. It depends on Apache Aries framework. Embeddy includes
only a tiny part of it: the console and the SSH server, plus several
bundles with general commands (to control the system, bundles, and
JAAS realms).

When you build Embeddy application with Apache Karaf Console you get
more than 20 additional libraries included in your project! If you
want to exclude them, build application as `ant -Dkaraf=false`
or set this property in the root Ant build file `build.xml`.

Note that in the demo project Karaf is turned off by default!
Build with `-Dkaraf=true` to put it back.

Ivy dependencies on Apache Karaf are located in `delegate/karaf.ivy` file.


#### Eclipse Jetty HTTP Server

Jetty server included in Embeddy by default consists of about 15 bundles.
To exclude it from the build run Ant as `ant -Djetty=false` or set this
property in the root Ant build file `build.xml`.

Ivy dependencies on Jetty are located in `delegate/jetty.ivy` file.

Warning. If you exclude Jetty from the build, sample Webbap bundle
is also excluded as it may not be built without that libraries!


## Managing Dependencies With Apache Ivy

**This document is not complete: all the details on building Embeddy
would be appended here during the latter work!**