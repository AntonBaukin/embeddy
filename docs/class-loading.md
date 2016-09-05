**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


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