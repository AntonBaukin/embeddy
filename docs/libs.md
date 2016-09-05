**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


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


## Embeddy Loggy Bundle

Creates a single logging point of the application applying Log4J2 library. Also
implements OSGi Logging Service that wraps Log4j2.


## Embeddy Delegate Bundle

This bundle has no own classes. It exports Karaf JAAS library as of it's internal.
It's 'build.ivy' file contains dependecies on all external bundles needed.


## Embeddy Static Bundle

This bundle if in fact is a demo application. It contains the simplest service
being client of embedded Jetty web server to surve the static content. It's not
packed in Embeddy JAR until you invoke Ant with `-Dstatic.content=/some/path/`
definition.

Note that this bundle would be renamed to 'webapp', and a rigorous example
having Bootstrap and Angular is given.