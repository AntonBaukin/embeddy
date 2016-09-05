**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


## Layout of the Root JAR File

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