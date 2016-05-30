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