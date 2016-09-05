**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


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
