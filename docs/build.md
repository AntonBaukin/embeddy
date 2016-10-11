## Building Embeddy

Embeddy is a skeleton OSGi application. Folder `webapp` contains the
demo application bundle. Exclude it from your project or rewrite.

Check how `webapp` bundle is organized. Note how it both adds required
OSGi bundles into the application root (PostgreSQL driver, HyperSQL DBMS),
and includes regular JAR libraries into own bundle.

To build Embeddy from the source code you require:
1. Apache Ant installed.
2. Apache Ivy added to Ant. To accomplish this download Ivy distribution
   archive having all the debendent libraries included and extract all
   JAR files into `ant/lib` directory.
3. Java JDK 1.8.


### The Default Build

Simply run `ant` in the root directory of the sources, and you'll get
the default build of Embeddy that includes:

1. Embeddy boot application (with the system library);
2. Apache Felix OSGi framework of version 5.4;
3. Embeddy Loggy bundle that makes overall logging to Log4J2 version 2.5;
4. Embeddy Springer bundle that provides Spring Framework version 4.2.6 to
   your bundles with annotations scanning and class load weaving supported;
5. Webapp bundle with sample web application;
6. Eclipse Jetty HTTP server version 9.3.8.

You also able to add Apacke Karaf Console version 4.0.5 with embedded
Apache SSH server version 0.14 to remotely login into the application.


### Apache Karaf Console

Apache Karaf Framework is complex enterprise application shipped as
multiple OSGi bundles. It depends on Apache Aries framework. Embeddy
includes only a tiny part of it: the console and the SSH server, plus
several bundles with general commands (to control the system, bundles,
and JAAS realms).

When you build Embeddy application with Apache Karaf Console you get
more than 20 additional libraries included in your project! If you
want to exclude them, build application as `ant -Dkaraf=false`
or set this property in the root Ant build file `build.xml`.

**Note** that in the demo project Karaf is turned off by default!
Build with `-Dkaraf=true` to put it back.

Ivy dependencies on Apache Karaf are located in `delegate/karaf.ivy` file.


### Eclipse Jetty HTTP Server

Jetty server included in Embeddy by default consists of about 15 bundles.
To exclude it from the build run Ant as `ant -Djetty=false` or set this
property in the root Ant build file `build.xml`.

Ivy dependencies on Jetty are located in `delegate/jetty.ivy` file.

**Warning.** If you exclude Jetty from the build, sample Webbap bundle
is also excluded as it may not be built without that libraries!


## Root Build File

Each module has one or two build files: `build.xml` for Ant, and `build.ivy`
file with the dependencies defined. The root `build.xml` file is located
under the project root. It allows:

1. To build individual modules: `build-boot`, `build-system`, `build-loggy`,
   `build-delegate`, `build-springer`, `build-webapp`. Or simply, `build-all`.
   This is rarely required at it's better to go to the folder of the desired
   module and invoke Ant there.

2. Do `clean` of all intermediate and final artifacts, except the Ivy cache,
   that is removed with `clean-all` task.

3. The default `package` task to build Embeddy JAR file.

4. To `run` Embeddy in debug mode (TCP port 5000) with OSGi storage in
   `.run` folder under the project root. Futher details are left for
   [Running Embeddy](run.md) document.

5. Rebuild the web application only with `webapp` task. It's very effective
   not only because it compiles only `webapp` module, but as it also replaces
   it in the target Embeddy archive and in `.run` folder used during the test
   runs and the development process. The latter allows to update static web
   resources and the server-side JavaScript files without restarting the
   application currently runnging. Further notes on how to develop Embeddy
   and to use the IDE are in [Demo Web Application Bundle](docs/webapp.md)
   document.


## Managing Dependencies With Apache Ivy

Apache Ivy plugged into Apache Ant makes Ant extreamly powerful build system.
Procedural control over the build process, going back to traditional Make,
combined with transitive dependencies management compatible with public
Maven repositories allows to do almost everything required. If not enough:
embedded scripting is welcomed!

Ivy itself is configured in `build/setup.ivy` file. Here it's told to use
local repostirory `build/.ivy-cache` and to download from two public Maven
ones: Maven Central, and iBiblio.

Ivy dependecies have the same pattern in all the files. The keynotes are
here not to address to Ivy documentation, because the final squeezing of
the usage is surprisingly simple.

As a sample we take `webapp/build.ivy` file. There are several
configurations listed: compile, sources, webapp, bundles. The first two
are the standard ones, third is specific for the module, and the fourth
is used across Embeddy. Configuration is actually a name of a scope
of artifacts.

Each dependency tag has `conf` attribute that looks like follows:

    sources; bundles -> compile, master

or:

    sources; webapp -> compile, master

Semicolons are to separate list items that are independent. The first rule
is simple `sources` means `sources -> sources`. If you check the Ivy file
for a library under `.ivy-cache`, you find that Ivy defines several standard
configurations such as: `sources`, `compile`, `master`. Then it lists the
artifacts of the library and refers each to at least one configuration.
With our rules we map our local configuration to one or more from the
library's file. If the mapping is 1-to-1, and their names are the same,
we may write the shortest variant: simple `sources`.

Note that `springer` module lists some libraries for the sources only.
This is a drawback of Ivy to Maven integration — sources are not
transitive.

Configuration `master` means the JAR file itself. We take it if require
to include the library in the archive. It differs from `compile` in the
means of further transitive dependencies. Referring `compile` we tell
that we want not the JAR file alone, but it's transitive dependencies
either. Note that in Embeddy they always come together, but a program
working in an application server requires to exclude the libraries
already provided by the server.

In Ant build file we able to fetch the artifacts from the configuration
named and place them in the folder of interest:

    <ivy:retrieve conf = 'webapp'
      resolveId = 'webapp' type = 'jar, bundle'
      pattern = '${libs-webapp}/[artifact]-[revision].[ext]'/>

We split the libraries by the modules they are used, but all OSGi
bundles are copied to the folder of `delegate` module. During the
package of Embeddy they are put under `bundles` path.