# Build Embeddy

Embeddy is a skeleton OSGi application. After you had forked it from Git
repository you start adding your own bundles or alter the included `webapp`
bundle (previously named as `static`).


To build Embeddy from the source code you require:
1) Apache Ant installed;
2) Apache Ivy added to Ant. To accomplish that download Ivy distribution
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
6) Apacke Karaf Console version 4.0.5 with embedded Apache SSH server
   version 0.14 to remotely login into the application;
7) Eclipse Jetty HTTP server version 9.3.8.


#### Apache Karaf Console

Apache Karaf Framework is a complex application shipped as multiple
OSGi bundles. It depends on Apache Aries framework. Embeddy includes
only a tiny part of it: the console and the SSH server, plus several
bundles with general commands (to control the system, bundles, and
JAAS realms).

When you build Embeddy application with Apache Karaf Console you get
more than 20 additional libraries included in your project! If you
want to explude them, build application as `ant -Dkaraf=false`
or set this property in the root Ant build file `build.xml`.

Ivy dependencies on Apache Karaf are located in `delegate/karaf.ivy` file.


#### Eclipse Jetty HTTP Server

Jetty server included in Embeddy by default consists of about 15 bundles.
To exclude it from the build run Ant as `ant -Djetty=false` or set this
property in the root Ant build file `build.xml`.

Ivy dependencies on Jetty are located in `delegate/jetty.ivy` file.

**Warning. If you exclude Jetty from the build, sample Webbap bundle
is also excluded as it may not be built without that libraries!**


## Managing Dependencies With Apache Ivy

**This document is not complete: all the details on building Embeddy
would be appended here during the latter work!**