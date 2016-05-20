# Embeddy

Embeddy is an OSGi skeleton application that has special boot techique 
to allow to pack in single JAR file bundles with Spring 4, Log4J2,
Apache Felix and Jetty, parts of Apache Aries, Karaf, Blueprint bundles.


## Single-JAR Application

The project is named so as it packs the OSGi application in regular
Java SE application JAR file having the main class written in
MANIFEST.MF. When you run this jar (named as embeddy-x.y.z.jar),
it finds all the OSGi bundles packed in it, extracts them
to temporary directory (or user-defined one witn -Dstorage=...
Java option).


## Layout of the JAR File

The configuration of the Embeddy application and all included bundles
is saved in META-INF directory of the archive.

    META-INF/
        MANIFEST.MF
        log4j2-console.xml
        log4j2-file.xml
        osgi.properties

MANIFEST.MF file contains special properties the define the constants
used uring the boot procedure. They are:

+ Boot-Path (defaults to 'boot') tells the path within the archive
  where the boot JAR libraries are placed. These are Log4J2, Commons
  Logging, SLS4J API, Embeddy System module, and Knopflerfish OSGi
  Framework implementation library.

+ Bundles-Path (defaults to 'bundles') is the path of the archive
  where all OSGi bundles (including the ones of Embeddy) are located.

+ Explode-Root (defaults to 'explode') is the path of the archive
  where configuration files and resources are located specific
  to some of OSGi bundles (frameworks) are being used. Hint: check
  'explode/etc' directory of Delegate bundle; there you find files
  for Karaf framework to support embedded SSH server (and the console).

+ Log-File-Property (defaults to 'log.file') tells the Java definition
  name to set the path of the file to log. When this definition is set,
  Embeddy applies nested 'log4j2-file.xml' configuration file to Log4J2
  logging library. When it's not set, Embeddy logs to the console with
  'log4j2-console.xml' configuration. Sample: `java -jar embeddy.jar
  -Dlog.file=/opt/log/embeddy.log`

+ Log-Config-Properties (defaults to 'log.config' or standard
  'log4j.configurationFile') tells the path to Log4J2 configuration file
  to use instead of the packed 'log4j2-file.xml' or 'log4j2-console.xml'.

+ Log-Config-Default and Log-Config-File tells the Log4J2 files of the
  archive. (See details of Log-File-Property.)

+ OSGi-Properties (defaults to 'META-INF/osgi.properties') names the file
  of the archive where all OSGi configuration properties are collected.

+ Storage-Property (defaults to 'storage') tells Java definition name
  to set the path to store extracted OSGi bundles and to use as the value
  of standard `org.osgi.framework.storage` system property. Note that
  this long property may be used instead. Sample: `java -jar embeddy.jar
  -Dstorage=~/app-bundles`.

When the bundles storage directory is not defined, Embeddy takes a temporary
one instead. On the application shutdown it tries to delete it (with all
the bundles contained). On each run the temporary directory differs.

But when storage definition is given, on each run Embeddy uses the same
path. It is also able to update the bundles (when you upgrade embeddy.jar)
comparing the versions of the bundles. So, this is the preferred way for
server applications


## Configuring OSGi Bundles

Embeddy configures OSGi framework (and the bundles) by reading properties file
packed in the archive (default location is 'META-INF/osgi.properties'). Here all
properties for all the bundles are collected. Note that they are not exposed
as the system properties of JVM if not prefixed with 'system.'.

Support for placing system properties in helps with those bundles that has
configuration options only as system properties. Namely, SSH server of Karaf
console checks `-Dkaraf.etc` definition for etc directory. This definition equals
to `${org.osgi.framework.storage}/etc` — this is 'etc' path located in the bundles
storage. During the startup Embeddy extracts there all the files placed under
'explode' directory of the archive. (See 'Explode-Root' property of the manifest.)

Hint: read the comments in 'osgi.properties' and check the documentation for
the bundles you use.


## Automatic Start Levels

Embeddy starts the bundles according to the defined dependencies on Java packages.
But if you need to tune the order, edit 'osgi.properties' file. Here you find:

    ##-- Start Levels --##

    #--> used by Karaf console
    system.org.osgi.framework.startlevel.beginning  = 4

    StartLevel-net.java.osgi.embeddy.loggy          = 1
    StartLevel-org.apache.aries.blueprint.core      = 2
    StartLevel-org.apache.aries.proxy.impl          = 3

System property 'org.osgi.framework.startlevel.beginning' tells the initial start
level for all the root bundles (that do not depend on else ones).

Special properties prefixed with 'StartLevel-' (they are excluded from the OSGi
configuration as do the system definitions) tell the start level of specific bundles.
Here we define that Embeddy Loggy bundle starts the first (after the framework bundle), then go
Apache Aries, and only then Karaf.


**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**

## Class Loading in Embeddy

This is the most tricky thing here. During the development I've also made
it possible to load all OSGi bundles without extracting them, but this
method had it's limitations as random access of ZIP achives nested in
the root archive was slow.


## Embeddy System Library


## Embeddy Boot Application


## Embeddy Loggy Bundle

Creates a single logging point of the application applying Log4J2 library. Also
implements OSGi Logging Service that wraps Log4j2.


## Embeddy Delegate Bundle

This bundle has no own classes. It exports Karaf JAAS library as of it's internal.
It's 'build.ivy' file contains dependecies on all external bundles needed.


## Embeddy Springer Bundle

Spring Framework of version 3 had all it's JAR files as OSGi bundles. Modern Spring
has no support for OSGi. Springer bundle contains Spring core and AspectJ Weaving to
be used in all user-programmed bundles. This is a cool stuff, but experimental.

Springer bundle uses special class loader `SpringerClassLoader` that supports
transformation of classes and makes the Weaving to work.

Springer also has (alpha-version) of bridging OSGi services as Spring beans.

**There is a lot of cool stuff to do and to propose here!**


## Embeddy Static Bundle

This bundle if in fact is a demo application. It contains the simplest service
being client of embedded Jetty web server to surve the static content. It's not
packed in Embeddy JAR until you invoke Ant with `-Dstatic.content=/some/path/`
definition.

Note that this bundle would be renamed to 'webapp', and a rigorous example
having Bootstrap and Angular is given.


## Embeddy JsX Bundle

This bundle is not ready yet. (Implementation of JsX is a part of my private
project.) JsX will be placed separately on GiHub and included in Embeddy and
ExtJSF projects. In short, JsX contains Zero-ZeT JavaScript library (see
ExtJSF with it's browser variant) and applies it to run in Oracle Nashorn
engine. It also has Servlet that invokes server-side scripts named '*.jsx'.
This is not a Node.js, but a very convenient tool to use alongside with
Java application if you want to natively work with JSONs and store them
in document-oriented backends.

JsX is written to be effective. It pre-compiles the scripts and reuses them
with support of re-loading after they changed. Execution of jsx-scripts has the same speed as of JSP pages! Nashorn is as
fast as ordinary Java application.

Regretfully, I was unable to debug Nashorn scripts under IntelliJ IDEA 14.