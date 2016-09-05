**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


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


## Embeddy Shutdown Sequence

