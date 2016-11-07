## Class Loading in Embeddy

A key feature of Embeddy is that it is a self-extracting application shipped
as single execution artifact, a JAR file, that Java VM is able to execute
without any additional parameters, libraries or launch scripts. Moreover,
if the application contained is a type of server, Embeddy supports permanent
installation and configuration directory.

In this document the implementation of class loading in Embeddy is addressed
from the start of the application to `springer` module and the applied level.


### Application Loader of Java

From the outer view, Embeddy is a regular Java application packed in a JAR file.
It requies no external libraries in the class path as some straight applications
using only core Java do.

The manifest file of Embeddy (`boot` module sources) contains standard tag
`Main-Class` referring class `Main` located directly in the root JAR nested
into the folders of it's package:

    net/java/osgi/embeddy/boot/Main.class

When Java starts it creates an instance of `AppClassLoader`, a subclass of
`URLClassLoader` able to fetch classes from folders of the file system, or
from ZIP archives such as JAR files. In the case of Embeddy, this class loader
sees only the classes and the resources of the root JAR file.

Note that Java supports `Class-Path` tag in the manifest file that lists
additional libraries required by a JAR-packed application. But this list
may not address JAR files located inside the root JAR file itself. Compare
this with `Bundle-ClassPath` tag of the OSGi standard. (In `springer` and
`webapp` modules it is populated by the build scripts from the list of the
libraries in the dependencies.) So, Embeddy has no help from this feature.


### Boot Class Loader

All classes and resources located directly in the root JAR file of Embeddy
may be loaded only with the initial class loader of Java, `AppClassLoader`.
The boot procedure creates own class loader `ZiPClassLoader` with the parent
assigned to the the initial loader.

In Java there are two major forms of accessing class loaders. First, is to take
the loader that had created the class is being executed now. Second, access the
context of the thread. The problem with the latter variant is that class code
can not predict what thread will invoke the class, and whether it installs own
class loader that sees the classes and resources located around the executed
one. As the result, most of the classes take the first variant.

To meet this issue Embeddy boot classes were split into two parts. Second part
(`Bundler` strategy) is located in `system` library with the other boot ones.
All these libraries are extracted from the root JAR into temporary files and
are connected to the boot loader `ZiPClassLoader`. Embeddy instantiates the OSGi
framework with the boot loader that becomes the parent loader of the framework.

File `osgi.properties` defines the following standard property:

    org.osgi.framework.bundle.parent = framework

It tells that all class loaders created by the framework for the OSGi bundles
must delegate queries for the classes not found to the framework loader,
`ZiPClassLoader` instance defined during the boot.

A class loader is queried not only for classes, but also for the resources.
Loader is able to collect resources with the same name from all the libraries
it is attached. Embeddy forces that resources from the root JAR file come the
first, then from the library implementing the OSGi framework (Apache Felix),
then all the boot libraries in the order of the file names in JAR archive.

    org.osgi.framework.bootdelegation = \
     java.*, javax.*, org.osgi.*, jdk.*, sun.*, \
     org.xml.sax, org.xml.sax.*, \
     org.w3c.dom, org.w3c.dom.*,\
     org.apache.logging.*, \
     org.slf4j, org.slf4j.*, \
     org.apache.commons.logging, \
     org.apache.commons.logging.*, \
     org.apache.felix.utils.*, \
     org.apache.aries.util, \
     org.apache.aries.util.*, \
     org.apache.aries.spifly, \
     org.apache.aries.spifly.weaver, \
     org.apache.karaf.util., \
     org.apache.karaf.util.*, \
     org.apache.karaf.jaas.boot, \
     org.apache.karaf.jaas.boot.*, \
     org.objectweb.asm, \
     org.objectweb.asm.*, \
     net.java.osgi.embeddy.boot, \
     net.java.osgi.embeddy.boot.*

This section of `osgi.properties` defines the packages that the OSGi class
loaders do not try to load, but query the boot class loader instead. There
are packages from Java, JDK (for Nashorn) and Sun, Log4J2, utilities from
Apache Aries and Karaf frameworks. Note the notation here: a package is
included, then the wildcard for all the nested packages, — this is the format
supported by Apache Felix OSGi implementation, and may vary with else, such
as Knopflerfish.


### Class Loaders of the OSGi Bundles

Embeddy contains two modules, the OSGi bundles, that do help with the OSGi
declared dependcencies. Module `delegate` resolves all the dependencies
required by various frameworks included in Embeddy: Apache Aries and Karaf, —
to be precise. Module `loggy` exports Log4J2 packages as the libraries of
this framework are placed in the boot, not in the bundles folder. But these
modules contain no own libraries as they implicitly delegate the class loading
to the boot loader.

After the boot procedure had extracted the OSGi bundles from the bundles folder
of the root archive, when the OSGi framework is starting, it creates bundle class
loader for each bundle. An OSGi framework has own implementation how to store
the libraries located in the bundles and to load classes from them.

Embeddy does not interfere in the implementation of the framework's class
loaders, but has to extend it in the implementation-dependent manner to
support the class loading and class path scanning of Spring Framework.


### What is Required for Spring Framework

Class path scanner is Spring Framework works only with JAR files or classes
extracted into folders of the file system. It needs to read class files
(compiled bytecode) without loading them into the running JVM to find out
whether Spring's or JSR annotations are there, and to process that class
further if so.

As a starting point, Spring asks for a resource referring not a file, but a
package (of Java) the class path scanning was requested. The class loader
must be able to handle this request to provide the list of the folders and
the files of the package. Then Spring checks the URL schema of each resource
to be of a JAR or a file. But OSGi bundle's class loaders return resource URL
to a virtual schema called 'bundle'. It looks like `bundle://12/...` where
the integer defines the bundle System ID.

To support Spring class path scanner, thus the annotations, we have to rewrite
URLs from bundle resources to global resources. This is done in framework
dependent manner. Check `BundleAccess` interface in `system` module.

`ApacheFelixBundleAccess` class of Embeddy implements this interface. It has
no system hacks, but invokes the internal classes of Felix to find out the
real location of the bundle's library in the file system.


### Springer Class Loader

Module `springer` looks like regular OSGi bundle. It includes libraries of
Spring Framework, adds them to own class path with `Bundle-ClassPath` tag
of it's manifest file, exports packages of Spring, imports the required
and optional.

**But `springer` will not work without a special setup!**

The procedure how to access Spring Framework from the OSGi bundle with
the target application (here, the demo web application) was made as
simple as possible.

The activator of the web application bundle `WebappActivator` creates
instance of `SpringerBoot` class and tells it two types of package lists:
to scan for bean definitions, and to load the classes. The first list is
implicitly included in the second.

`SpringerBoot` instance creates an instance of `SpringerClassLoader` that
solves three goals:

1. It loads classes from Spring Framework located inside `springer` bundle
**without importing them as dependencies** in the requesting bundle. Check
the manifest file of `webapp` module: there are no Spring packages! (Except
two of them that `webapp` module directly needs for utility purposes to
populate the database. This has no relation to Spring and the beans.)

2. Transform the byte code of the loaded classes to fully support AspectJ
weaving process that eliminates need for proxies for the bean objects and
makes transparent wrapping with aspects, such as `@Transactional` scopes.

3. Supports class path scanning for the beans located inside `springer`
bundle and the requesting one. This is crucial for the beans defined in
Java classes with the annotations.

After creating the class loader `SpringerBoot` builds Spring Application
Context selecting from two options: with web support, or plain. Proceed
for the details to [Spring Framework 4 with Springer Bundle](springer.md)
document.

`SpringerClassLoader` simultaneously works with two class loaders: `that` —
of the requesting application bundle; `this` — of `springer` bundle. Here
are the steps of the class loading:

1. it checks whether the class is within own package that starts with the
prefix from one of the listed below. If so, the call is redirected to `this`
loader without the transformation.

2. it checks whether the class must be transformed. If not, the load is
given directly to `that` loader. A class is transformed if it is in the
list of the packages of `springer` that contain Spring beans, or within
a set of packages united from the two lists given to `SpringerBoot`.

3. it loads the bytes of the class without defining it into a class object
inside the JVM. Then is inspects the class bytes (with the reader of Spring
Framework) whether the class is marked with `@LoadDefault` annotation. If
class is marked, `that` loader is invoked. If not, the bytes are transformed,
defined to class instance that is resolved to `SpringerClassLoader`.

The list of the own (root) packages of `springer`:

    net.java.osgi.embeddy.springer.boot
    org.springframework
    org.aopalliance
    org.aspectj
    org.objectweb.asm
    aj.org.objectweb

It is notable that `that` class loader of the requesting bundle becomes the
parent class loader of `SpringerClassLoader`. This means that any class of
the application bundle outside the packages given to `SpringerBoot` is
still available for the Spring beans instanciated. This technique makes
`SpringerClassLoader` to be in the inner layer of the class loading.

Annotation `@LoadDefault` has special intent to work with Java singletones
from Spring beans. Java singletone instance is referred from a static field
of a class. Demo application `webapp` has it: `Database` class. The instance
of the class is created before the spring context. The class is loaded with
the bundle class loader of `webapp`. When spring bean loaded with nested
`SpringerClassLoader` class loader tries to access the singletone located
inside the packages given to `SpringerBoot`, `SpringerClassLoader` makes
a new instance of the same Java class, and the static field differs!
`Database` class is marked with `@LoadDefault` to order springer loader
to skip it regardless the package it is located in. This sample is repeated
in depth in [Spring Framework 4 with Springer Bundle](springer.md) document.