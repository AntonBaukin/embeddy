**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**

### What is Wrong with Spring Framework?

Class path scanner is Spring Framework works only with JAR files or classes
extracted into a folders of the file system. It have to access class files
(compiled bytecode) without loading them into the running JVM to find out
whether Spring's or JSR annotations are there, and to process that class
further if so.

As a starting point, Spring asks for a resource referring not a file, but a
package (of Java) the class path scanning was requested. The the class loader
must be able to handle this request to provide the list of the folders and
the files of the package. Then Spring checks the URL schema of each resource
to be of a JAR or a file. But OSGi bundle's class loaders return resource URL
to a virtual schema called 'bundle'. It looks like `bundle://12/...` where
the integer defines the bundle System ID.

To support Spring class path scanner, thus the annotations, we have to rewrite
URLs from bundle resources to global resources. This is done in framework
dependent manner. See `BundleAccess` interface in the system module and it's
implementation for Felix OSGi Framework.

Further details are in [Class Loading in Embeddy](class-loading.md) and
[Spring Framework 4 with Springer Bundle](springer.md) documents.


## Embeddy Springer Bundle

Spring Framework of version 3 had all it's JAR files as OSGi bundles. Modern Spring
has no support for OSGi. Springer bundle contains Spring core and AspectJ Weaving to
be used in all user-programmed bundles. This is a cool stuff, but still under
development and extending.

Springer bundle uses special class loader `SpringerClassLoader` that supports
transformation of classes and makes the Weaving to work. It also makes class
path scanning possible. (Note that it's not with the bundle class loaders!)


# Springer Module of Embeddy

Spring Framework of version 3 had all it's JAR files as OSGi bundles. Modern Spring
has no support for OSGi. Springer bundle contains Spring core and AspectJ Weaving to
be used in all user-programmed bundles. Springers exports all the packages of
the included Spring archives.


## Your Bundle and Springer

If you check sample Webapp bundle included in Embeddy, you'll find how it
connects to Springer. First, it imports Springer packages in the manifest.
Then, it uses an activator where it creates an instance of `SpringerBoot`
class giving it the list of root packages to scan the annotated beans.

The bundle meta directory also has 'applicationContext.xml' file. Here
we find `<context:load-time-weaver/>` tag that tells us that load-time
weaving is activated in the bundle. This allows to use `@Transactional`
annotations and all the stuff alike.

Bundle activator does `SpringerBoot.start()` during the activation,
and `stop()` in the stop.

Springer configures the beans from the XML files, seaches for the annotated
classes, thus providing the core functionality. But it also brings some
OSGi-related features that couple Spring, with it's statics, and OSGi,
with it's dynamics. The following sections of this document describe them.


## Service Bridge and @ServiceSwitch

Let's check the following sample Spring bean:

	import org.osgi.service.log.LogService;

	@Component
	public class Tester
	{
		public final Object LOG = LU.logger(Tester.class);

		@Autowired @ServiceSwitch
		protected ServiceBridge<LogService> logService;

		protected void onLogService()
		{
			LU.info(LOG, "OSGi LogService is now bound!");
		}
	}

We see that autowired field of class `ServiceBridge` having `LogService`
template argument is defined there. `ServiceBridge` is a prototype bean
implemented in Springer bundle.

The first thing to note here is that Springer bundle declares own Spring
beans that are found during the scan of `SpringerBoot` is being started.

Annotation `@ServiceSwitch` marks this definition that it refers OSGi service.
This annotation declares single string value of OSGi service name. But in this
sample it has the default value of empty string. Yes, Springer finds it out
from the name of the interface class `LogService` of the template argument!
This moves the declaration to a possible minimum.

As OSGi is a dynamic framework, services are added and removed on the fly.
Springer makes it possble a Spring declaration to know the context where
the bean is defined! `ServiceBridge` instance has access to `Tester` instance
and invokes on-method (with the short name of the service class) when the service
is connected. Add off-method to track it down.


## Springer Bean Factory

Springer creates own version of Spring Application Context that installs
`SpringerBeanFactory` to extend beans processing done by Spring. The techninques
exposed in the previous section are available due this factory.

The starting point here is `AutoAwire` interface. Implement it in your bean
class to tell the factory you need extended processing for the annotations
set for the field or method in an injecting instance of the class. Bean
`ServiceBridge` implements the interface and looks for `@ServiceSwitch`.


**This document is not complete: all the details on each Embeddy module would
be appended after the refactoring following the initial commit be completed.
Please, be in touch!**


## Springer Class Loader


## Beans Vs Static Fields

