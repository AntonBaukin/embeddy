## Application Folder Layout

Source folder of Embeddy application has the following structure. Here
some of the files are omitted, middle packages of Java are compacted.

    build.xml
    boot
        boot.iml
        build.ivy
        build.xml
        meta
            MANIFEST.MF
            log4j2-console.xml
            log4j2-file.xml
            osgi.properties
            services
                net.java.osgi.embeddy.boot.BundleAccess
        sources
            net/java/osgi/embeddy/boot
    build
        embeddy.ipr
        embeddy.iws
        setup.ivy
    delegate
        build.xml
        delegate.iml
        explode
            etc
                README.txt
                branding.properties
                host.key
                org/apache/karaf
                    shell.config
                users.properties
        jetty.ivy
        karaf.ivy
        meta
            MANIFEST.MF
    docs
    loggy
        build.xml
        loggy.iml
        meta
            MANIFEST.MF
        sources
            net/java/osgi/embeddy/loggy
    springer
        build.ivy
        build.xml
        meta
            MANIFEST.MF
        sources
            net/java/osgi/embeddy/springer
        springer.iml
        test
            java
                net/java/osgi/embeddy/springer/jsx
            resources
                log4j2.xml
                net/java/osgi/embeddy/springer/jsx/tests
    system
        build.xml
        meta
            MANIFEST.MF
        sources
            net/java/osgi/embeddy
                boot
                log
        system.iml
    webapp
        build.ivy
        build.xml
        content
            items
            login
            system
        meta
            MANIFEST.MF
            applicationContext.xml
            c3p0.xml
            dispatcherContext.xml
        sources
            net/java/osgi/embeddy
                app
                webapp
        webapp.iml

There are six modules:

1. `boot` contains Java classes and the configuration files to place
   directly under the root JAR. The Main class invoked by the JVM is here.

2. `system` has classes that are actually a part of the boot process to be
   placed in separated JAR file and loaded by special Boot Class Loader.
   (Check [Embeddy Boot Sequence](boot.md) document.)

3. `delagate` is packed as the OSGi bundle to resolve the dependencies
   on utility libraries of the nested frameworks that are not the OSGi
   bundles themself. Exploded configuration directory is also here —
   read [Configuring Embeddy](config.md) on this.

4. `loggy` exports Log4J2 library to make it sole logging facility
   of the application including the boot procedure and each of the
   bunbles. It also implements OSGi Log Service.

5. `springer` is the key bundle to write modern applications. It includes
   Spring Framework 4 and contains classes to couple it with the OSGi and
   a lot of helping utilities and handy stuff. JsX infrastructure to run
   the server side JavaScript with Oracle Nashorn is also placed here and
   tightly integrated with the Spring.

6. `webapp` is demo application that applies Spring, JsX, and Angular.js
   to remotely configure media devices displaying media files on public
   screens. (It's cut out from actual program that does that.)

Folder `build` contains project file of IntelliJ IDEA 14 and Apache Ivy
setup file. After running the build it is extended with `.ivy-cache` folder
and the number of `.libs-*` folders. The cache is local Ivy repository
populated with libraries downloaded from public Maven ones. Build command
`ant clean` leaves it as is (not to download on a rebuild); `ant clean-all`
— removes. JAR libraries of the dependecies are split in several folders
on the module basis. They are for IntelliJ IDEA project.

**Note** that IntelliJ IDEA is not required to build Embeddy, but only
Apache Ant with Ivy — read [Building Embeddy](build.md).

Folder `explode` created during the build is analogue of Maven's
`target`. It's the root of the resulting Embeddy JAR file —
proceed with the next section.


## Layout of the Root JAR File

Embeddy is shipped as a single JAR file what is far from common for an
OSGi application. The root folders of the archive are the same as of
the folder `explode` it's based on:

    META-INF
        MANIFEST.MF
        log4j2-console.xml
        log4j2-file.xml
        osgi.properties
        services
    boot
        system-0.1.1.jar
        ***
    bundles
        delegate-0.1.1.jar
        loggy-0.1.1.jar
        springer-0.1.2.jar
        webapp.jar
        ***
    explode
        etc
            README.txt
            branding.properties
            host.key
            org
                apache
                    karaf
                        shell.config
            users.properties
    net/java/osgi/embeddy/boot

Folder `boot` contains the system library and all the libraries required for
Embeddy's own modules, or the user's application that are not the OSGi
bundles. There are two types of using classes from that libraries:

1) As in Java SE application having general class loader. This is not a way
   of the OSGi programs, but is required in rare cases. Embeddy takes some
   bundles from Karaf enterprise framework that is started with own boot
   procedure and able to attach utility libraries before the OSGi class
   loader — so, Embeddy has to do the same.

   Seamless logging on all the leves of the application starting from
   boot till the latest bundle is also a challenge. We have to share
   from the begging the same instances of logger objects, thus to keep
   all static content of Log4J classes within the same class loaded.
   This is the class loaded created during the boot. All logging
   libraries: Log4J, bridges for Java Util, Commons, and SL4J —
   all are collected here. Note that Log4J is OSGi compatible,
   but we have to ignore this and to copy the manifested exports
   into `loggy` bundle.

   To be able to load classes from boot libraries you need to
   list the packages in `osgi.properties` file — the details
   are in [Configuring Embeddy](config.md).

2) To nest JAR library into a bundle as `webapp` does this for
   C3P0 connection pool, or `springer` does for Spring Framework,
   and include them in the list of manifest `Bundle-ClassPath` entry.

Folder `bundles` contains all the bundles of the OSGi application.
These bundles are extracted into the storage directory of OSGi
during the boot procedure. The exact steps of the process are
listed in [Embeddy Boot Sequence](boot.md) document.

Folder `explode` is to contain static configuration files for bundles
being a part of enterprise frameworks that rely on some type of Unix
`etc` configuration directory. For now, Embeddy contains files for
Karaf shell that is available via embedded SSH server. Ignore or remove
them if Karaf is not required in your build.

Nested folders `net/java/osgi/embeddy` contains classes of `boot`
module, including `Main` class being the program entry point.

`META-INF` directory is the key point to configure Embeddy and
the nested bundles. Continue with [Configuring Embeddy](config.md)
document that defines it in the details.
