# Embeddy

Embeddy is an OSGi skeleton application that has special boot techique 
to allow to pack in single JAR file bundles with Spring 4, Log4J2,
Apache Felix and Jetty, parts of Apache Aries, Karaf, Blueprint optional bundles,
and any bundles specific for your application.


## Single JAR Application

The project is named so as it packs the OSGi application in regular
Java SE JAR file having the main class written in
MANIFEST.MF. When you run this jar (named as embeddy-x.y.z.jar),
it finds all the OSGi bundles packed in it, extracts them
to temporary directory, or the user-defined one.


## Table of Contents

[Running Embeddy](docs/run.md)

[Root JAR Layout](docs/layout.md)

[Configuring OSGi Bundles](docs/config-osgi.md)

[Embeddy Core Libraries](docs/libs.md)

[Embeddy Boot Sequence](docs/boot.md)

[Class Loading in Embeddy](docs/class-loading.md)

[Spring Framework with Springer Bundle](docs/springer.md)

[Nashorn Java Scripting with JsX](docs/jsx.md)


## About the Project
