## Configuring Embeddy

Embeddy is shipped as standalone JAR file, and there are two distinct
ways how to configure it: 1) to store the default values of the options
in the files inside the archive 2) to alter them via `-D...` definitions
of the Java VM launch command. Actually, there is third one, 3) to set
values in the OSGi configuration service, but this suits for the applied
level or the OSGi services, not for the system level such as the boot
procedure, or the logging facility.

Configuration files inside Embeddy archive are located

    META-INF/
        MANIFEST.MF
        services/
        log4j2-console.xml
        log4j2-file.xml
        osgi.properties
    explode/
        etc/

in `META-INF` folder taken from `boot/meta` folder of the sources;
and in `explode` folder from `delegate/explode` one. The latter is
extracted directly into the storage (installation) folder and contains
files for those frameworks (namely, Karaf) that rely upon some type
of `etc` files in the file system.


### Manifest File

Embeddy Manifest file `MANIFEST.MF` defines the system level options
to alter constants used in the boot procedure not to change the
program code. They are:

+ `Boot-Path` (defaults to `boot`) tells the path within the archive
  where the boot JAR libraries are placed. These are Log4J2, Commons
  Logging, SL4J API, Embeddy System module, and Apache Felix OSGi
  Framework implementation library.

+ `Bundles-Path` (defaults to `bundles`) is the path of the archive
  where all OSGi bundles (including the ones of Embeddy) are located.

+ `Explode-Root` (defaults to `explode`) is the path of the archive
  where configuration files and resources are located to extract them
  as-is into the OSGi storage folder.

+ `Log-File-Property` (defaults to `log.file`) tells the Java definition
  name to set the path of the file to log. When this definition is set,
  Embeddy provides nested `log4j2-file.xml` configuration file to Log4J2
  logging facility. When it's not set, Embeddy logs to the console with
  `log4j2-console.xml` setup.

+ `Log-Config-Properties` (defaults to `log.config` or standard
  `log4j.configurationFile`) tells the path to Log4J2 configuration file
  to use instead of the default `log4j2-file.xml` or `log4j2-console.xml`.

+ `Log-Config-Default` and `Log-Config-File` tells the Log4J2 files of the
  archive.

+ `OSGi-Properties` (defaults to `META-INF/osgi.properties`) names the file
  of the archive where all OSGi configuration properties are located.

+ `Storage-Property` (defaults to `storage`) tells Java definition name
  to set the path to store extracted OSGi bundles and to use as the value
  of standard `org.osgi.framework.storage` system property.

Read [Running Embeddy](run.md) on how to set the definitions for OSGi
permanent storage and Log4J2 logging facility.


### OSGi Properties File

Embeddy configures OSGi framework and the bundles by reading Java properties
file `osgi.properties` located in `META-INF` folder of the archive. Here all
the properties for all the bundles are collected. Note that they are not
exposed as the system properties of the JVM unless have `system.` prefix.

Values of the properties may contain references to Java properties. They
are standard `${abc}` for `-Dabc=...` launch definitions. Even more: while
the boot procedure reads the list of the properties, it repeatedly resolves
the references thus not requiring to define them before the first usage.

Java system properties are defined in the OSGi properties file (with
`system.` prefix) to make this file be a single configuration point
of the application. Placing system properties here helps with the bundles
that support some of their configuration options not as OSGi properties,
but only as the system ones.

Namely, Karaf framework has this bad manner. The following sample:

    system.karaf.etc = ${org.osgi.framework.storage}/etc

defines `karaf.etc` to be the absolute path of `etc` folder inside the OSGi
storage folder with absolute path saved into `org.osgi.framework.storage`
system property (of the OSGi standard) assigned during the boot procedure
from `-Dstorage=...` launch definition.

Thers is no strict convention how to name the OSGi properties. Some are
defined in OSGi standard on the services. Else are based on the full class
name of the service Java interface. Else are named from the symbolic names
of the bundles. Read the documentation on the service and on the concrete
implementation you use.


### OSGi Configuration Service

OSGi properties file provides the default values of the properties read
by the services of the installed OSGi bundles. It is possible to alter
the values during the run time, — and carefully implemented services
must detect the change and re-initialize themself without restarting the
whole application. A change of a property must survive the application
restart.

Embeddy takes implementation of the OSGI Configuration Service from Apache
Felix Framework. OSGi property `felix.cm.dir` set as

    felix.cm.dir = ${org.osgi.framework.storage}/etc

tells to save the configuration files of the service in `etc` folder
within the OSGi storage. Note that if Embeddy is started with a temporary
storage, the configuration is lost on the restart as the storage changes
on each launch.

Apache Felix CM Service saves configuration properties in `*.config` files
under a sequence of nested folders that match the symbolic name of the OSGi
bundle this configuration is for. Inspect `encodePid()` method of Felix's
`FilePersistenceManager` class for the implementation details. Each
configuration file must contain `service.pid` property with the value
of the symbolic name.

**Note** that configuration files are not in Java properties format, but
in the format of 1.4.2 section of OSGi Core Specification. The comments
are in `ConfigurationHandler` class.

Embeddy contains one sample of the configuration for the embedded Karaf
SSH server and the console. SSH console service of Karaf platform names
itself as `org.apache.karaf.shell`. To configure this service we need to
created nested directories in `etc`: `org/apache/karaf` and place
there file `shell.config`. The properties of the file look like:

    sshPort=I"2022"
    sshHost="0.0.0.0"
    sshIdleTimeout=L"1800000"
    consoleLogger=B"false"

Note that spaces are not allowed around `=`. Value must be placed in the
quotes and prefixed with the type letter, if not a string, such as `I`
for integers, `L` for long integers, `B` for booleans...


### OSGi Bundle Manifest

Embeddy requires `Bundle-SymbolicName` tag in the OSGi Bundle manifest file
to be defined to string value of Java package name format and be unique
within the bundles present.

`Bundle-Version` tag is inspected during the boot procedure of the repeated
launches on permanent OSGi storage folder. If the value is greater than of
the same bundle currently installed, the bundle is updated.

Specific for Embeddy `Bundle-Explode` tag set to `true` tells to extract
the content of the bundle into directory under the storage by the symbolic
name of the bundle. Demo `webapp` bundles does so to make updates during
the development be fast and require no restart.


### Bundle Start Level

The last stage of the framework boot procedure is activating the bundles
of the OSGi framework by achieving the target start level. The framework
tries to guess the correct order from the dependencies between exported
and imported packages of the bundles, provided and required services.

When the dependencies are not clear, or side-effects of the activation
order do play, manual assignment of the start level is required. Embeddy
allows this with special configuration properties as are:

    system.org.osgi.framework.startlevel.beginning  = 5
    StartLevel-net.java.osgi.embeddy.loggy          = 1
    StartLevel-org.apache.felix.configadmin         = 2
    StartLevel-org.apache.aries.blueprint.core      = 3
    StartLevel-org.apache.aries.proxy.impl          = 4

System property `org.osgi.framework.startlevel.beginning` tells the initial
start level for all the bundles that do not depend on else ones.

Properties prefixed with `StartLevel-` (they are excluded from the OSGi
configuration) tell the start level of specific bundles. Here we define
that `loggy` bundle starts the first (after the framework bundle), then
goes the configuration service, Apache Aries, and only then Karaf, Jetty
and the others.


### Jetty HTTP Service

The following OSGi properties stand for embedded HTTP service implemented
by Eclipse Jetty:

    org.apache.felix.http.host = 0.0.0.0

IP address of the host from available in the system to bind TCP socket.
Value `0.0.0.0` means all of, `127.0.0.1` the local loop only.

    org.apache.felix.http.enable  = true
    org.apache.felix.https.enable = false

What of HTTP and HTTPS services is activated.

    org.osgi.service.http.port        = 8080
    org.osgi.service.http.secure.port = 8443

TCP ports of HTTP and HTTPS services.

    org.apache.felix.http.timeout = 20000

Connection timeout in milliseconds.
        
    org.apache.felix.http.session.timeout = 360

Web session timeout in minutes.

    org.apache.felix.http.nio  = true
    org.apache.felix.https.nio = true

Use modern Java IO routines.

    org.apache.felix.http.jetty.maxFormSize = 1048576

Maxumum size in bytes URL encoded POST requests.


### Karaf SSH Server and Console

In contrast to Jetty HTTP service, bundles to embed SSH server and the
related console facility were extracted from huge enterprise framework,
Apache Karaf, that has own methods to configure going further from simple
OSGi properties.

There are four files it the exploded `etc` folder related to Karaf and
a group of system properties in `osgi.properties`.

File `branding.properties` defines two things of the console: 1) the prompt
string layout; and 2) how the welcome text looks.

File `users.properties` lists the roles, users, and passwords.

File `host.key` is serialized Java class `java.security.KeyPair` of public
and private keys of the SSH server.

File `shell.config` in `org/apache/karaf` folder defines the properties
of the embedded SSH server. They are defined in the format of OSGi
Configuration Service — check the section above.

By default, SSH server binds to all IP addresses on TCP port `2022`.

Karaf console relies upon system properties, not the OSGi, that have
`system.` prefix in `osgi.properties`:

    system.karaf.etc = ${org.osgi.framework.storage}/etc

Tells the absolute location of Karaf configuration directory. By default
it is `etc` folder that is exploded into the OSGi storage.

    system.karaf.name                = embeddy.${user.name}
    system.karaf.local.user          = admin
    system.karaf.local.roles         = admin,manager,viewer

Defines the name of the user of the local console. (Not of the console
of the SSH server.)

    system.karaf.startLocalConsole   = true

Tells whether to start local console bound to TTY of the process.

    system.karaf.startRemoteShell    = true

Tells whether to start embedded SSH server.

    karaf.systemBundlesStartLevel    = 1

Affects bundles filtering in the console commands: bundles with this level
or lower are not listed by the commands controlling OSGi.