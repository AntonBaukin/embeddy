**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**

## Running Embeddy

Running `ant` in the root directory of the project creates `embeddy-x.y.z.jar`
file. There are several ways to start the application with Java 1.8 SE.

1) `java -jar embeddy-x.y.z.jar`
2) `java -Dlog.file=embeddy -jar embeddy-x.y.z.jar`
3) `java -Dstorage=dir -jar embeddy-x.y.z.jar`
4) `ant run`
5) `ant -Dsuspend=true run`

The simplest way, (1) makes Embeddy to extract OSGi bundles into a temporary
directory and to log to the console.

If you need the log files, execute (2) variant. By default, Embeddy creates
three log files with the prefix given: `embeddy.info.log`, `embeddy.debuf.log`,
and `embeddy.debug.json`.

To use the same installation path fot the OSGi bundles on each following run,
execute (3) variant. It may be combined with the loggin from (2).

Options (4) and (5) are for the debugging. The storage path is '.run' under
the project root, the log files are written there. JVM has remote debugging
argument on TCP port 5000. With (5) is starts suspended and waits for debugger.

In all console runs in the default build and settings Embeddy displays Karaf
console where you may enter the commands and exit the application with
`system:shutdown` command. (Invoke `help` command.) To turn off the console
set `system. karaf. startLocalConsole = false` in `osgi.properties`.

Embeddy also starts own SSH server that handles the Karaf environment. Option
`system. karaf. startRemoteShell = false` in `osgi.properties` turns it off.
Settings of the server are configured in OSGi properties file
`explode/ etc/ org/ apache/ karaf/ shell.config`.