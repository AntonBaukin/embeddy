## Embeddy System Level

Embeddy system level has three main goals:

1. Extract and start the OSGi application from a single JAR archive that
is solely enough to run itself as it includes both the bundles and the
configuration that may be further extended with the JVM launch definitions.

2. Provide overall seamless logging integrated with interfaces of all major
logging facilities and implementing the OSGi logging service.

3. Support OSGi bundles from the frameworks that require external files of
the configuration and additional resources.

Embeddy boot procedure and the related class loading do target these goals
making Embeddy not alike those Java applications that simply start the OSGi
framework and delegate to it the rest.


### Dependency on Apache Felix OSGi Framework

Embeddy is shipped with the OSGi framework of Apache Felix. The implementation
of the framework affects the lower-level aspects of Embedy boot procedure
and the class loading support for `springer` bundle. Embeddy is not tested
with else OSGi frameworks, thus any matters may occur, simple or not.

The class loader of `springer` bundle requires `BundleAccess` strategy that
is found in the standard services folder of `META-INF` in Embeddy archive,
or the sources of `boot` module. The implementation of the strategy depends
on the framework. It may be tricky to create it for else than Felix.


### Embeddy System Library

Some classes from Embeddy `boot` module must be loaded with the same class
loader as the classes nested in the system libraries of Embeddy that are
located in `boot` folder of the archive. These classes may not be in the
root archive alongside with the starting `Main` one as JVM's initial class
loader is then suppressed with `ZiPClassLoader` that works with the boot
libraries and becomes the parent loader for the OSGi framework.

So, that classes are extracted into separated `system` module. They are
also available for the bundles (note, the boot's are not).


### Embeddy Delegate and Loggy Bundles

Every OSGi bundle has two options how to define what Java classes it requies
and requests during the runtime. The OSGi way is to explicitly import the
packages in the manifest file. In this case bundles that do export these
packages must exist. Second, is not to cope with the OSGi importing and
simply ask for the classes when they are required. This way is allowed for
system classes that are shipped with Java.

Embeddy creates own class loader for the libraries in `boot` folder of the
archive. This loader becomes the parent of OSGi framework. All classes in
the boot libraries are available for OSGi bundles for the implicit loading.

The most of the boot libraries are not the OSGi bundles. Their manifest files
do not declare the symbolic name and the exported packages. If any of the OSGi
bundles imports their packages, the framework start fails with the cause of
unsatisfied dependency. (This is true for Karaf framework that imports classes
from Karaf and Aries utilities being not bundles.)

`delegate` OSGi bundle module has no Java classes, but two things only:
the OSGi manifest file that lists required packages from the boot libraries;
exploded `etc` files for Apache Karaf framework.

It's notable that Log4J2 logging framework is OSGi compatible, but is placed
into the boot libraries. This is true because it is required during the boot
procedure. Also, the libraries are not copied into the bundles folder not
in the sake of smaller archive size. The true reason here is that logging
objects must be the same for the boot procedure and each of the bundles.
Class `LogManager` that collects the logger objects via static variables
must be loaded with the boot class loader.

Module `loggy` being an OSGi bundle that exports Log4J2 packages embeds not
these libraries (as `springer` module does for Spring Framework), but loads
them imlicitly from the parent loader created by Embeddy boot.

Module `loggy` also implements fast JSON layout plug for Log4J2 that
has no dependencies on any JSON processing library. (Note that own Log4J2
layout for JSON requies Jackson library.) And implements the OSGi Logging
Service that also traces the OSGi events.


### Embeddy Boot Sequence

Embeddy starts as regular Java JAR packed application having `Main-Class`
property defined in `MANIFEST.MF` file of the root archive. That class, named
as `Main`, delegates the task to `BootLegger` (named well) strategy. There are
three stages: initialization, prepare, and the start.

`BootLegger` **1)** reads the manifest file of the archive and applies the
properties described in [Application Layout](layout.md) document. When running
on Windows, it **2)** prevents JAR locking to safely remove the bundles from
the installation folder in the case of a temporary storage.

Then **3)** it reads the properties from `osgi.properties` file. It scans for
all the system properties prefixed with `system.` and sets them, also leaving
them in OSGi configuration having the prefix stripped. Properties being not
system may be overriden with `-Dproperty=value` definition of the JVM, so the
file defines the default values.

As the last task of the init stage `BootLegger` **4)** finds out the full path
of the root JAR file of the running Embeddy.

The prepare stage starts with creating instance of `BootJaRLoader` giving it
the path of the root JAR file. The task of this sub-strategy is to **5)** scan
the archive and find there all level-one nested JAR archives (the archives
nested into the root one) within the boot directory. During the scan **6)**
it makes a copy of each of the boot libraries into a temporary file.

The last thing, `BootJaRLoader` **7)** creates an instace of `ZiPClassLoader`
with the parent loader the initial `AppClassLoader` of Java, and having each
of the extracted boot libraries connected.

`BootLegger` continues with **8)** creating application shutdown hook. When
the JVM receives a kill signal, it gracefully terminates the OSGi framework.

**9)** `BootLegger` installs `ZiPClassLoader` as the context loader of current
`main` thread. Note that various libraries freely select one from two variants
how to find the resource files and to load classes dynamically: some do ask
the context loader of the executing thread, else do ask the loader used to load
that classes. To address this behaviour Embeddy had to place some of the classes
in `system` library, or they would be loaded with `AppClassLoader` that is not
suitable.

Next, **10)** `BootLegger` setups the logging. First, it defines what Log4J2
configuration file to take (user-defined, or to-console, or to-files), assigns
`log4j.configurationFile` system property, then invokes `LU.init()` of `boot`
module. The key feature of that function is to use `ZiPClassLoader` instead of
the initial `AppClassLoader` that loaded `LU` class. To do so, it has to use
Java reflection. Then **11)** additional shutdown hook is registered to turn
off the logging manager. (That is the last thing reported to log appenders.)

Then `BootLegger` proceedes for the OSGi framework. **12)** It finds and loads
`org.osgi.framework.launch.FrameworkFactory` resource in `services` folder of
`META-INF` located in the OSGi framework implementation library included into
`boot` folder of Embeddy archive. This factory is of Apache Felix framework. It
loads that class via `ZiPClassLoader` and asks to mark it's JAR to be the first
in the order of searching for the resources. This makes the framework loading
clear and robust as resources from all other libraries has less priority.

To handle OSGi bundles `BootLegger` **13)** loads `Bundler` class from the
system library and creates it's instance, then invokes the initialization
method. `Bundler` is a strategy responsible for reading OSGi bundle archives
from the root one, extract them and update in the storage directory. Method
`init()` checks the boot storage option, takes the given directory, or creates
a temporary one, then assigns `org.osgi.framework.storage` system property
of the OSGi standard.

On the latter step the configuration is completed, and `Main` class proceedes
with `BootLegger.launch()`.

The launch starts with **14)** building the instance of Apache Felix framework
and invoking it's `start()`. Following behaviour depends on whether a temporary
storage is used, and whether this run is the first. If `storage` definition of
the permanent installation directory is set for the JVM, and this start is
repeated, Apache Felix OSGi loads all the bundles installed and starts them.
Else, it starts only the system bundle (the framework). Each case is considered
by `Bundler` strategy when **15)** `BootLegger` invokes `install()` method, then
goes `start()` one. At this step `BootLegger` strategy is completed, and the
rest is on `Bundler`.

The first goal of `Bundler.install()` **16)** is to find all the OSGi bundles
placed in the root archive under `bundles` path (as the default). Then it
**17)** reads `MANIFEST.MF` of each of JAR files found. Here it maps symbolic
name of each bundle and checks they are unique.

**Warning.** Embeddy forbids different OSGi bundles (JAR files) to have
the same symbolic name!

For each bundle found **18)** `Bundler` either installs it (if it's not in
the list of bundles present in the OSGi now), or updates if the version from
the manifest is newer than the version installed. During this cycle `Bundler`
also assigns the start levels of the bundles listed in `osgi.properties`
with `StartLevel-` prefixes. The bundles not listed there get the same value
of the maximim of the listed, plus 1, remembered as the target start level.

`Bundler` completes the installation with **19)** extracting all the files and
folders placed in `exploded` (the default) path of the root archive into the
storage directory.

**Note** that during the update Embeddy does not uninstall the bundles that are
not in the root archive more and leaves them as is — the framework still starts
them. This makes Embeddy not to fight against manual installation of bundles.

**20)** Then goes the start. Going from level 1, `Bundler` increments it till
the target level reached. If the OSGi framework already got to this level,
nothing happens. So, when the framework is restarting on a persistent storage,
it is not toggled off-on. At the end `Bundler` checks the status of each bundle,
reports the success to the log, or throws an exception. On success the starting
thread `main` waits the OSGi framework to stop.


### Embeddy Shutdown Sequence

There are two valid ways to stop Embeddy. First, if Karaf console is included
in the build, whether with the local TTY console, or via SSH terminal to
invoke `system:shutdown` command (and type `yes` when it asks). Second,
to send the kill signal invoking `kill $pid` with the process ID of the
running Embeddy — this suits when Embeddy is made a system service.

Before setting the logging `BootLegger` strategy installs the shutdown hook
in the JVM. This hook sequentially: 1) asks `Bundler` strategy to stop the
OSGi framework (if it is running); 2) then to close the bundles; 3) then
tells `BootJaRLoader` sub-strategy to close.

Closing the bundles means deleting the temporary OSGi installation storage.
If Embeddy runs with the permanent one, nothing happens here.

As `BootJaRLoader` is responsible for the boot libraries it had extracted
into a temporary files during the boot, it closes the boot class loader
`ZiPClassLoader` instance, then marks the temporary files to be removed
on the JVM exit. Note that the logging objects of Log4J2 framework are
still active while the boot class loader is not able to load anything.
This has no matter as all the required logging classes are already loaded.

Embeddy defines system property of Log4J2 framework to set shutdown callback
registry (in the terms of Log4J2) with instance of `LogGlobalShutdown`. There
is nothing special with this class. The JVM invokes the hooks in the order
of registering, and the logging one comes after the OSGi's, — this makes
the framework stop to be logged.