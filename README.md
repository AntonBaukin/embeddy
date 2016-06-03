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


## Running Embeddy

Running `ant` in the root directory of the project creates `embeddy-x.y.z.jar`
file. There are several ways to start the application with Java 1.8 SE.

1) `java -jar embeddy-x.y.z.jar`
2) `java -Dlog.file=embeddy -jar embeddy-x.y.z.jar`
3) `java -Dstorage=dir -jar embeddy-x.y.z.jar`
4) `ant run`
5) `ant -Dsuspend=true run`

The simplest way, (1) makes Embeddy to extract OSGi bundles into a temporary
directory and to log to the console.

If you need the log files, execute (2) variant. By default, Embeddy creates
three log files with the prefix given: `embeddy.info.log`, `embeddy.debuf.log`,
and `embeddy.debug.json`.

To use the same installation path fot the OSGi bundles on each following run,
execute (3) variant. It may be combined with the loggin from (2).

Options (4) and (5) are for the debugging. The storage path is '.run' under
the project root, the log files are written there. JVM has remote debugging
argument on TCP port 5000. With (5) is starts suspended and waits for debugger.

In all console runs in the default build and settings Embeddy displays Karaf
console where you may enter the commands and exit the application with
`system:shutdown` command. (Invoke `help` command.) To turn off the console
set `system. karaf. startLocalConsole = false` in `osgi.properties`.

Embeddy also starts own SSH server that handles the Karaf environment. Option
`system. karaf. startRemoteShell = false` in `osgi.properties` turns it off.
Settings of the server are configured in OSGi properties file
`explode/ etc/ org/ apache/ karaf/ shell.config`.



## Layout of the JAR File

The configuration of the Embeddy application and all included bundles
is saved in META-INF directory of the archive.

    META-INF/
        MANIFEST.MF
        services/
        log4j2-console.xml
        log4j2-file.xml
        osgi.properties
    boot/
    bundles/
    explode/
        etc/
    net/java/osgi/embeddy/


MANIFEST.MF file contains special properties the define the constants
used uring the boot procedure. They are:

+ `Boot-Path` (defaults to 'boot') tells the path within the archive
  where the boot JAR libraries are placed. These are Log4J2, Commons
  Logging, SL4J API, Embeddy System module, and Apache Felix OSGi
  Framework implementation library.

+ `Bundles-Path` (defaults to 'bundles') is the path of the archive
  where all OSGi bundles (including the ones of Embeddy) are located.

+ `Explode-Root` (defaults to 'explode') is the path of the archive
  where configuration files and resources are located specific
  to some of OSGi bundles (frameworks) are being used. Hint: check
  'explode/etc' directory of Delegate bundle; there you find files
  for Karaf framework to support embedded SSH server (and the console).

+ `Log-File-Property` (defaults to 'log.file') tells the Java definition
  name to set the path of the file to log. When this definition is set,
  Embeddy applies nested 'log4j2-file.xml' configuration file to Log4J2
  logging library. When it's not set, Embeddy logs to the console with
  'log4j2-console.xml' configuration. Sample: `java -jar embeddy.jar
  -Dlog.file=/opt/log/embeddy.log`

+ `Log-Config-Properties` (defaults to 'log.config' or standard
  'log4j.configurationFile') tells the path to Log4J2 configuration file
  to use instead of the packed 'log4j2-file.xml' or 'log4j2-console.xml'.

+ `Log-Config-Default` and `Log-Config-File` tells the Log4J2 files of the
  archive. (See details of `Log-File-Property`.)

+ `OSGi-Properties` (defaults to 'META-INF/osgi.properties') names the file
  of the archive where all OSGi configuration properties are collected.

+ `Storage-Property` (defaults to 'storage') tells Java definition name
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
'explode' directory of the archive. (See `Explode-Root` property of the manifest.)

Hint: read the comments in 'osgi.properties' and check the documentation for
the bundles you use.


## Exploding OSGi Bundles

When OSGi extracts bundle JAR (from Embeddy root one) into the storage it
stores the file depending on the implementation. Apache Felix saves JAR file
renamed to 'bundle.jar'.

For your application bundle (Webapp bundle in Embeddy) it may be better not to
store it as an archive, but to extract it. This allows at least to update the
resource files (static content) without restarting the application, what
is great during the web development.

In the manifest file of the bundle set `Bundle-Explode: true`. Embeddy boot
strategy `Bundler` will extract the archive into permanent directory named
as bundle symbolic name (that must be unique) under the storage root. When
updating the bundle during the restart it compares the last modification
timestamps of the existing files and bundle archive entries.


## Configuration Admin Service

There are three ways of configuring bundles in an OSGi application: system
properties, OSGi properties global for OSGi framework, and via OSGi Configuration
Service (it's from Apache Felix Framework). Previous section defined the first two
ways, here we complete with the third one.

By default, `felix.cm.dir` OSGi property tells the directory where the configuration
files are located. It's the same directory where files required by Karaf are saved.
The 'etc' directcory is saved under 'explode' path of the Embeddy archive.

In OSGi services are named as full names of interface Java class of that service.
But this is not a strict requirement. A sample, SSH console service of Karaf
platform names itself as `org.apache.karaf.shell`. To configure this service
we have to created nested directories in 'etc': `org/apache/karaf` and place
there file `shell.config`. The files looks like Java properties file, but the
values are encoded in a harder way. (Also, spaces around '=' are forbidden,
at least for Apache Felix). Consider `etc/README.txt` file.


## Bundles Start Levels

Embeddy starts the bundles achieving the target start level. If you need to tune
the order, edit 'osgi.properties' file. Here you find:

    ##-- Start Levels --##
      
    #--> used by Karaf console
    system.org.osgi.framework.startlevel.beginning  = 5
      
    StartLevel-net.java.osgi.embeddy.loggy          = 1
    StartLevel-org.apache.felix.configadmin         = 2
    StartLevel-org.apache.aries.blueprint.core      = 3
    StartLevel-org.apache.aries.proxy.impl          = 4

System property `org.osgi.framework.startlevel.beginning` tells the initial start
level for all the root bundles (that do not depend on else ones).

Special properties prefixed with 'StartLevel-' (they are excluded from the OSGi
configuration) tell the start level of specific bundles. Here we define that
Embeddy Loggy bundle starts the first (after the framework bundle), then goes
Apache Aries, and only then Karaf.


## Apache Felix OSGi Dependency

Class path scanner is Spring Framework works only with JAR files, or classes
extracted to directories. In short, it have to access class files without loading
them in JVM to find out whether and Spring or JSR annotation is there, and to
process that class further.

First, it asks for a resource referring not a file, but a Java package. The class
loader must correctly handle this. Then, it checks the URL schema to be of a JAR,
or a file. But OSGi bundle class loaders return URLs to virtual schema 'bundle'.

To support Spring annotations we have to rewrite URLs from bundle resources
to global resources. This is done in framework dependent manner. See `BundleAccess`
interface in the system module and it's implementation for Felix.

The implementation of `BundleAccess` is found as a standard service registraton
in `META-INF/services` directory of Embeddy root archive.


## Embeddy System Library

Some classes from Embeddy Boot module (the classes of this module are directly
located in the root JAR file) must be loaded with the same class loader as the
classes nested in OSGi bundles. To do so we have to place them into separated
library under nested 'boot' path.

Classes from the system library are also available for the bundles (note,
the boot's are not), check `SpringerClassLoader`.


## Embeddy Boot Sequence

Embeddy starts as regular Java JAR-packed application having `Main-Class`
property defined in 'MANIFEST.MF' file of the root archive. That class, simply
named as `Main`, delegates the task to `BootLegger` (yes, named well) strategy.
There are three stages: initialization, prepare, and start.

Boot Legger **1)** reads the manifest file of the archive and gets the properties
described in *Layout of the JAR File* section. When running on Windows it **2)**
prevents JAR locking to safely remove the bundles when the storage is a temporary
directory.

Then **3)** it reads the properties from 'osgi.properties' file. It scans for all
the system properties prefixed with `system.` and sets them, also leaving them
in OSGi configuration having the prefix stripped. Properties being not system
may be overriden with `-Dproperty=value` argument of JVM, i.e., the file defines
the default values.

As the last task of the init stage Boot Legger **4)** finds out the full path of
the root JAR file. This allows to read it later. Hint: the root JAR file is the
file of Embeddy (and the Boot Module) is currently run by JVM, such as:
`java -jar embeddy-x.y.z.jar ...`

The prepare stage starts with creating instance of `BootJaRLoader` giving it the
path of the root JAR. The task of this sub-strategy is to **5)** scan the archive
and find there all level-one nested JAR archives (the archives nested the root one)
within the boot directory. During the scan **6)** it makes a copy of each of the
boot libraries into a temporary file.

The last thing, `BootJaRLoader` **7)** creates an instace of `ZiPClassLoader` having
as the parent loader the initial `AppClassLoader`, and all extracted boot libraries
connected.

`BootLegger` continues with **8)** creating application shutdown hook. When JVM
receives a program exit signal, it gracefully terminates the OSGi framework.
(See the details in *Embeddy Shutdown Sequence*.)

**9)** `BootLegger` installs `ZiPClassLoader` as the context loader of current
(main) thread. Note that various libraries freely select one from two variants:
some do use the context loader, else the loader used to load own classes. To
address this behaviour we had to place some of the classes in the system library,
or they would be loaded with `AppClassLoader` that is not suitable.

Next, **10)** `BootLegger` setups the logging. First, it defines what Log4j2
configuration file to take (user-defined, or to-console, or to-files), assigns
`log4j.configurationFile` system property, then invokes `LU.init()` (of the boot
module). The key feature of that function is to use `ZiPClassLoader` instead of
the initial `AppClassLoader` that loaded `LU` class. To do so, it has to use Java
reflection. Then **11)** additional shutdown hook is registered to turn off
the logging manager. (That is the last thing reported to log appenders.)

Then `BootLegger` takes for the OSGi framework. **12)** It finds and loads
`META-INF / services / org. osgi. framework. launch. FrameworkFactory` resource
that has value of `org. apache. felix. framework. FrameworkFactory` class.
It loads that class and asks `ZiPClassLoader` to mark it's JAR to be the first
in the order of searching for the resources. This makes the framework loading
clear and robust as resources from all other libraries has less priority.

To handle OSGi bundles `BootLegger` **13)** loads `Bundler` class (from the
system library) and creates it's instance, then invokes the initialization method.
`Bundler` is a strategy responsible for reading OSGi bundle archives from the
root one, extract them and update in the storage directory. `Bundles.init()` checks
the boot storage option, takes the given directory, or creates a temporary one,
then assigns `org.osgi.framework.storage` system property of the OSGi.

On the latter step the configuration is completed, and `Main` class proceedes
with `BootLegger.launch()`.

The launch starts with **14)** building the instance of Apache Felix framework
and invoking it's `start()`. Following behaviour depends on whether a temporary
storage is used, and whether this run is the first. If permanent storage directory
is defined by the user, and the start is repeated, Apache Felix OSGi loads all
the bundles installed and starts them. Else, it starts itself only (the system
bundle). Each case is considered by `Bundler` strategy when **15)** `BootLegger`
invokes `Bundler.install()`, then `Bundler.start()`. (At this step `BootLegger`
is completed, and the rest is on `Bundler`.)

The first goal of `Bundler.install()` **16)** is to find all the OSGi bundles
placed in the root archive under 'bundles' path (as the default). Then it **17)**
reads 'MANIFEST.MF' of each of JAR files found. Here it maps Symbolic Name of
each bundle and checks they are unique.

**Warning. Embeddy forbids different OSGi bundles (JAR files) to have
the same symbolic name!**

For each bundle found **18)** `Bundler` either installs it (if it's not in
the list of bundles present in the OSGi now), or updates if the version from
the manifest is newer than the version installed. During this cycle `Bundler`
also assigns the start levels of the bundles listed in 'osgi.properties'
with 'StartLevel-' prefixes. The bundles not listed there get the same value
of the maximim of the listed, plus 1, remembered as the target start level.

`Bundler` completes the installation with **19)** extracting all files placed
in 'exploded' (the default) path of the root archive into the storage directory.

**20)** Then goes the start. Starting with 1, `Bundler` increments it till
the target level reached. If OSGI framework already has this level, nothing
happens. So, when the framework is restarting on a persistent storage, it is
not switched off-on. At the end `Bundler` checks the status of each the bundle,
reports the success to the log, or throws an exception.

Hint. During the update Embeddy *does not uninstall* the bundles are not in
the root archive more!


## Class Loading in Embeddy

This is the most tricky thing here. During the development I've also made
it possible to load all OSGi bundles without extracting them, but this
method had it's limitations as random access of ZIP achives nested in
the root archive was slow.

As a regular JAR application Embeddy has class loader that takes classes from
the ZIP archive root, i.e., `Main` class, and the related. (The sources of that
classes are located in 'boot' module.)

Embeddy archive contains system libraries (not OSGi bundles, and OSGi core itself)
under 'boot' path of the archive. Note that in Java JAR file manifest property
`Class-Path` can not refer libraries inside the archive! So, during the boot
procedure Embeddy has to extract them into a temporary files and create special
class loader `ZiPClassLoader` that is able to load classes from that archives.

In Java we have two forms of accessing class loaders. First, is to take the loader
that created the class is being executed now. Second, access the context of the
thread. The problem with the latter variant is that we can't predict what thread
will invoke our class, and whether it installs own class loader. As the result,
most of the classes take the first variant.

At the point of creating `ZiPClassLoader` Embeddy has the boot classes loaded with
the application class loader that knows nothing about the archives under 'boot'
path. Embeddy has to split the boot implementation into two parts: the first
part starts with `Main` class, the second is placed in the System. The classes
of the library are loaded with `ZiPClassLoader` as are all classes of OSGi
framework. `ZiPClassLoader` becomes the parent class loader of the framework,
and the boot delagetion is addressed to it. We apply this by setting `org. osgi.
framework. bundle. parent` property of `osgi.properties` file that is required
to have 'framework' value.

We also set `org. osgi. framework. bootdelegation` property to the list of all Java
system packages, and packages of the boot archives. Look, that we had to place
there system libraries from Apache Felix, Aries, and Karaf frameworks as they
are not an OSGi bundles.

It's also possible to include there OSGi bundles we don't want to place in 'bundles'
path. This is done for all Log4J2 libraries as we configure logging during the boot
procedure and want it to be a single point of over-application logging. As some of
OSGi bundles require that packages, we need to resolve them. This is what the
delegation module is for: it's manifest file exports all required packages of the
boot libraries. Note that the classes are loaded not with the class loader of the
delegation module, but with `ZiPClassLoader`. This is handly in all the cases we
need static contexts of the classes to be application-wide (as it's for the logging).

When OSGi bundles are extracted from 'bundles' path of the root archive and installed
into the OSGi storage directory, the framework creates bundle class loader for every
bundle that handles the storage format. Embeddy does not interfere in them, but
each bundle class loader has `ZiPClassLoader` as it's parent.

Springer module extends Embeddy class loading with own `SpringerClassLoader`.
The details are provided in 'springer/README.md' file.


## Embeddy Shutdown Sequence

**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**

## Embeddy Loggy Bundle

Creates a single logging point of the application applying Log4J2 library. Also
implements OSGi Logging Service that wraps Log4j2.


## Embeddy Delegate Bundle

This bundle has no own classes. It exports Karaf JAAS library as of it's internal.
It's 'build.ivy' file contains dependecies on all external bundles needed.


## Embeddy Springer Bundle

Spring Framework of version 3 had all it's JAR files as OSGi bundles. Modern Spring
has no support for OSGi. Springer bundle contains Spring core and AspectJ Weaving to
be used in all user-programmed bundles. This is a cool stuff, but still under
development and extending.

Springer bundle uses special class loader `SpringerClassLoader` that supports
transformation of classes and makes the Weaving to work. It also makes class
path scanning possible. (Note that it's not with the bundle class loaders!)

The details on what Springer is able for are provided in 'springer/README.md'.


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
with support of re-loading after they changed. Execution of jsx-scripts has the
same speed as of JSP pages! Nashorn is as fast as ordinary Java application.

Regretfully, I was unable to debug Nashorn scripts under IntelliJ IDEA 14.