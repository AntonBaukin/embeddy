## Running Embeddy

When Apache Ant completes the build of Embeddy it produces JAR file named
`embeddy-x.y.z.jar` where `x.y.z` are digits of the version. This file
contains everything needed for the application to run, including the
configuration. To launch the file Java Virtual Machine version 1.8
(or later) is required to be installed in the system.


### The Simplest Way

On desktop systems it's enough to click on the JAR file. You see nothing
because the program creates no windows. But it works — check the list of
the system processes. To stop the program just terminate (kill) it.

**Note** that Embeddy handles the kill signal properly, and stops the OSGi
framework, then closes the log destinations.

If you type in the console `java -jar embeddy-x.y.z.jar` Embeddy runs
in the default mode with logs printed in the standard output.

If Karaf console is included in the build, it binds the standard input
and prints the user prompt messed with the debug log messages. Press
`Enter` key to see the initial prompt. Note that Karaf catches the kill
signal issued with `^C` and does nothing. Press `Tab` to see available
console commands — invoke `system:shutdown` to exit the program.

When Karaf is not included you see only the log messages, and `^C`
console signal works to exit the program.


### Logging Setup

Not to print the log messages to the console a log file may be defined
when launching Embeddy. Invoke it as:

    java -Dlog.file=mylog -jar embeddy-x.y.z.jar

**Note!** When typing Java VM `-D...` definitions and parameters place them
before `-jar ...` string, or they would be treated as the program arguments,
but not of the JVM itself. Embeddy takes no arguments.

Definition `-Dlog.file=mylog` actually sets not the file `mylog`, but three
files: `mylog.debug.json`, `mylog.debug.log`, `mylog.info.log`.

Module `loggy` extends Log4J2 library with own JSON formatter that has no
dependencies on any JSON library — it prints the text directly.

To configure the layout of logging you need to edit the Log4J2 configuration
XML files placed under `META-INF` directory of the JAR file. In the project
sources they are located in `boot/meta` folder.

There are two files: `log4j2-console.xml` and `log4j2-file.xml`. The first
is taken when `-Dlog.file` is absent. In the file `${sys:log.file}` pseudo
variable refers the JVM definition `log.file`.

You are free to define any layout of Log4J2 loggers and appenders. But be
aware to add the required libraries into `boot` folder of the archive.


### Permanent OSGi Storage

OSGi defines the term of the bundles storage. With some type of virtual file
system it could be anything, but the most of the implementations do use local
file system.

When application placed in Embeddy skeleton uses only remote data systems and
produces no embedded data, the OSGi storage may be a temporary folder of the
system. This is so for the previous two launch samples. When Embeddy starts
it extracts the system libraries from `boot` and the bundles from `bundles`
into a temporary folder that is removed on the shutdown. The only drawback
here is that the start takes more time required to write the files.

Demo application uses 1) remote PostgreSQL database; or 2) launches embedded
HyperSQL one. Then it fills the database with random test data. In (2) case
the database files are located in the storage in `db` folder. As on each
launch the temporary folder differs, the data differs so, — this colud be
handy during the development, but slower start still overtakes.

Embeddy allows to set up the target bundles storage folder and reuse it on
the following launches. At the first time it does the same work to extract
the bundles, then it checks that all the bundles do exist and have equal
version. If the version changes, Embeddy updates the bundle. The details are
left for [Embeddy Boot Sequence](boot.md) document.

To define permanent storage run with `-Dstorage` definition:

    java -Dstorage=folder -jar embeddy-x.y.z.jar


### OSGi Storage Layout

With Apache Felix OSGi kernel that Embeddy uses the OSGi storage looks so:

    bundle0
    ...
    db
    etc
    net.java.osgi.embeddy.webapp
    temp

Folder `db` exists only when embedded HyperSQL database is selected by the
demo application. Folder `temp` is set as default temporary for the JVM and
is empty. Folder `etc` is located in `explode` folder of the Embeddy JAR —
it is extracted as-is right into the storage during the first launch.

OSGi bundles are named as `bundleID` where `ID` is the identifier of
bundle in the OSGi. System bundle — OSGi framework itself — is always `0`.
Check that folder `bundle0` contains only `bundle.id` file with the number
of bundles installed.

Regular bundle has simple structure:

    bundle29
        bundle.info
        version0.0
            bundle.jar
            revision.location

Note that the original name of the bundle JAR file is replaced with dummy
`bundle.jar`. File `revision.location` stores the location of the bundle
referring into `bundles` folder of Embeddy JAR file.

When bundle contains nested libraries, such as `springer` having Spring
Framework inside, the JAR files of the libraries are extracted to speed
up the class loading. Bundle of `springer` looks so:

    bundle24
        bundle.info
        version0.0
            bundle.jar
            revision.location
            bundle.jar-embedded
                lib
                    aopalliance-1.0.jar
                    aspectjweaver-1.8.9.jar
                    ...

Embeddy bundles installation procedure supports special manifest entry:

    Bundle-Explode: true

It's not in the OSGi standard, and feature of Embeddy. With this entry set,
Embeddy fully extracts the bundle into the folder named as the bundle
symbolic name — `net.java.osgi.embeddy.webapp` for the demo application.

Exploding bundle archive is crucial for the development of web applications
having static files with HTML pages, CSS and scripts; and the server-side
Nashorn and JsX scripts — when OSGi application is running it locks the
bundle JAR file and forbids to replace it thus requiring the restart JVM
on each update of a file.

As the demo application is exploded, `ant webapp` build command is able
to update Embeddy running in the standard storage folder `.run` located
in the project sources folder.


### Signing in Embedded SSH Server

When Karaf console is included in the build, and SSH server is enabled
(by default), to log into the server use:

    ssh -p 2022 admin@localhost

Enter the default password `password` of the user `admin`. Document
[Configuring Embeddy](config.md) tells the configuration details.


### The Development Runs

During the development application is restarted multiple times in a short
period. The demo application is written mostly in JavaScript, both the
web side with Angular.js, jQuery, and ZeT; and the server-side with
Nashorn scripts and JsX pages. Updating those scripts requires only
`ant webapp`, but Java classes are very restrictive to be updated
within the running JVM via the debugger, — and the restart goes.

The root Apache Ant build file is equipped with `run` task:

    ant [ -Dsuspend=true ] [ -Ddetach=true ] run

Define suspend if you want the JVM to wait for the debugger. And define
detach if Ant should not wait the program and detach it from the output
and input streams: Embeddy continues to work in the backgound, Ant exits,
`^C` signal won't be caught, and Embeddy may be stopped only with kill
signal. The latter is not convenient for the development as Process ID
of started Embeddy always varies.

If Karaf console is plugged in, Ant messes the output of each line with
`[java]` prefix and removes the colors. And `^C` also does not work.
Connect via SSH client, or run Java directly with something like:

    java -Dlog.file=.run/run -Dstorage=.run
      -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5000
      -jar embeddy-0.1.1.jar

Clean of `ant clean` removes the standard run folder `.run` with all the
demo data (of embedded test database) within. Use `ant webapp` to update
only `webapp` bundle. Use `ant clean package` to rebuild everything, or
`rm -rf .run; ant` that is slightly faster. Note that bundles installed
in `.run` are not updated on simple rebuild as their versions are the same.
You have to remove `.run` folder, or all the bundles (to leave the data).


### TCP Ports Bound

`5000` port is opened by JVM run in the debug mode with the default
configuration.

`8080` port opened by Eclipse Jetty HTTP service. The port is set with
`org.osgi.service.http.port` OSGi configuration property in `osgi.properties`
file. HTTPS service if by default disabled.

`2022` port stands for embedded SSH server of Karaf. Opened if Kafar is
included in the build. The port is defined by `sshPort` property in
`etc/org/apache/karaf/shell.cofig` file of `explode` folder in the
archive or `delegate` module in the sources.