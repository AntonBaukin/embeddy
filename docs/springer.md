## Spring Framework 4 with Springer

Spring Framework of version 3 was the OSGi compatiple. All of the libraries
were the OSGi bundles with proper manifest files, exported and imported
dependencies. Modern Spring of version 4 is not to be used directly in the
OSGi applications.

It is not hard to include the libraries into a bundle, but the sharm of two
main features melts here: annotated beans and the related class path scanning;
bytecode transformations (the weaving) required for opacue aspect extentions.

Springer solves the tasks with special class loader `SpringerClassLoader`
and the related build strategy `SpringerBoot` that greately simplify the
final usage of Spring Framework making it as easy as in regular Java SE.
The details of the class loading in Embeddy are exposed in the details
in [Class Loading in Embeddy](class-loading.md) document.

Module `springer` also ships additional help with the tasks of a modern web
application. To be exact with them, demo application located in `webapp`
bundle is referred in this document.

Not to make separated OSGi module with all the dependencies twisted with
`springer`, JsX library for the server-side JavaScript based on Nashorn
engine is included here. As the result, `springer` becomes a sole module
that web application bundle requies. (Except the additional artifacts such
as HyperSQL database, or PostgreSQL driver). Read about JsX library in
[Nashorn Java Scripting with JsX](jsx.md) manual.


### Springer Boot

Demo web application bundle `webapp` is clear and straight with the OSGi
activation. Class `WebappActivator` does two things: starts the database
layer, and creates the basic context of Spring Framework.

The database layer is facaded by `Database` singletone. It is not a Spring
bean. It is marked with `@LoadDefault` annotation not to load it with the
class loader that loads classes for the bean definitions.

The activatior class defines own field of `SpringerBoot` strategy, starts
it after the database, but destroys before. The goal of the strategy is to
create the class loader, and to build Spring Context instance.

    public final SpringerBoot loader = new SpringerBoot().
      scanPackages("net.java.osgi.embeddy.app").
      loadPackages("net.java.osgi.embeddy.webapp");

The boot strategy takes two lists of the root packages. (In the demo it's only
one per list.) The packages to scan are implicitly included in the set of the
packages to load. All classes of the packages nested into the packages to load
are processed with the Springer class loader. Loading classes of else packages
it delegates to the bundle class loader of the requesting bundle, or the class
loader of `springer` bundle — in the case of Spring and the related libraries.
With this, listing the OSGi dependencies on Spring in the application bundle
becomes a redundancy.

**Note** that the application bundle is still required to import the dependent
packages with the classes that are uses outside the classes loaded with the
Springer class loader. Demo application has two of them: handy utility of
Spring JDBC to populate the database from SQL files.


### Singletones Visibility

Class loader built by the Springer boot strategy has parent class loader set
to the class loader of the requesting bundle, — in this case, of `webapp`. 
This allows the Spring beans to access any package of the bundle.

The demo application highlights the case when Java singletone object, declared
in a static field of a class, is located within a package given to Springer 
boot. `Database` object is started in the activator before the Spring boot. 
If a Spring bean tries to access it, if `Database` had no `@LoadDefault`
annotation, a bean sees else instance of the database — check `AppConfig` 
class. To solve this nasty matter, `@LoadDefault` annotation was supported 
in the Springer loader. Or simply move `Database` class outside any package 
given to Springer boot.

    @Configuration
    public class AppConfig
    {
      ...
      
      @Bean
      public DataSource dataSource()
      {
          return Database.INSTANCE.getDataSource();
      }
      
      ...
    }


Bundle classes outside of the Springer loader scope can not directly invoke
methods of the beans as the class object of the bean class was created by
the bundle class loader. Use the reflection, or extract the required methods
to an interface and place it in the bundle scope out of Spring's, or mark
it with `@LoadDefault` annotation.


### Spring Configuration File

The manifest directory of `webapp` module contains `applicationContext.xml`
file pretty standard for Spring. The name of this file is hard-coded into
`SpringerBoot` class. This file is a required starting point to build Spring
application context. To create several initial contexts from differect files
you need to extend `SpringerBoot` behaviour.

    <context:annotation-config/>
       
    <context:load-time-weaver/>
      
    <tx:annotation-driven mode = 'aspectj'/>    

There are only thee effective lines in the file: to support defining beans 
with the annotations, to use bytecode transformations of Java classes, and to
wrap transactional scopes with AspectJ library.

For some features you may require libraries not included into `springer` 
module, thus, to extend it's dependencies list of Apache Ivy file, and
to rebuild the module.
 
Note that there is no `<context:component-scan/>` tag. This is because Springer
boot strategy automatically starts the scan for the list of root packages given
to scan when creating the strategy. These packages are always added to the set
of the root packages to load with Springer loader as the beans found may be
loaded only with it.


### Dynamically Nested Web Context

Spring Framework supports the web development. It perfectly works with all
kinds of Java layouts for packaging: JAR, WEB, EAR. When application server
starts Java web layout, it builds servlet context, servlets, filters, data
sources, and other stuff and the related infrastructure. 

Application server never turns off any of it's s major subsystems without
stopping the applications. Namely, it may not stop the servlet container
leaving the servlet instances intact. The nature of the OSGi is opposite.
The HTTP service (implemented by embedded Jetty server) may be started
even after the web application, turned off, then on again. The web application
continues to work having the layers related to HTTP active or off.  

`SpringerBoot` in the web application activator creates the initial context
from the classes in `net.java.osgi.embeddy.app` package. Sibling package 
`webapp` is given to load the classes, but not to scan for the beans. This
is so because the beans located there depend on the servlet context that
is available only while the OSGi HTTP service's on. When the service becomes
ready web application creates the nested application context and gives it 
to the dispatching servlet of Spring Framework. When the HTTP service 
becomes unavailable, the nested context is destroyed, leaving the beans 
of the initial context (for example, accessing the database) intact.

This is not a general solution of how to couple multiple Spring contexts with
multiple OSGi services and to cooperate beans from that contexts. In the most
cases creating nested context per the OSGi service is not required. What's not
true for Srping dispatching servlet as the web context given to it greately
advances a general one: additional scopes and so one.

The details on how the nested web context is created are in the following 
sections of this document.


### Service Bridge and Switch

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
        
        protected void offLogService()
        {
            LU.info(LOG, "OSGi LogService gone off!");
        }
    }

There is no such a funny bean in the demo application. It logs about the
logging service to actually the same service. Still note that the logging
framework is created during Embeddy boot, and the logging service created 
in `loggy` bundle stands on the top of it. You may turn off the service 
with `loggy` bundle from embedded Karaf console. Then nothing happens with
the logs, and `offLogService()` prints well.

We see that autowired field of class `ServiceBridge` having `LogService`
template argument is defined there. `ServiceBridge` is a prototype bean
implemented in `springer` module.

Implementation of `ServiceBridge` assumes that the registration name of
the OSGi service equals to the full class name of the interface class that
defines the service. The interface class is given to the bridge bean as Java 
template argument.

Note that Spring Framework may not build prototype beans giving them template
arguments from the injecting fields with `@Autowired`! This true magic is still
possible because of special beans factory set to Spring in the boot strategy.
Check the following sections for the details.

The basic usage of Service Bridge is simple. When the OSGi service becomes
available the bridge invokes on-method of the declaring class. The name of
the method is the short name of the service class with the prefix `on`, or
`off` — that is optional, and called when the service becomes unavailable.
If the service is available at the time of creating bridge, on-method is
called directly at that time.

As the OSGi framework uses multiple threads and is not synchronous, Service 
Bridge may be notified on the service deactivation while the client code 
accessing the service instance is working with the bridge. This may cause 
unpleasant effects, so the bridge does not give the direct reference, but 
scopes it with synchronous `invoke()` call that takes a consuming closure 
(functional interface).

Annotation `@ServiceSwitch` is required to mark `ServiceBridge` fields. This's
the second feature of the beans factory — to pass the annotations of the field
declaring prototype bean to the instance of this bean (injected into field).


### Prototype Beans Tracking

Internally `ServiceBridge` creates standard `ServiceTracker` instance. The
tracker is not a pure in-memory object — it is registered in the OSGi framework
and must be removed upon the bridge destruction.

Springer module declares `BeanTracker` component bean that is intended to keep
references of all prototype beans registered. The tracker itself is removed
upon destruction of the application context. In the case of `webapp` module,
this is the nested web context created for the HTTP service. When the service
becomes down, the context is destroyed. The initial context of `webapp` module
is removed on `webapp` bundle deactivation.

**Note** that Spring singletone beans declared in `springer` module are not
shared across all the contexts created, including the initial one or the nested.

Upon the destruction the tracker invokes methods marked with `@PreDestroy`.
Prototype beans tracked are not required to implement special interfaces.


### Auto Awired Prototype Beans

`ServiceBridge` implements `AutoAwire` interface that denotes a prototype
bean that needs to know the bean instance it's injected into, or template
arguments, or the annotations on the injecting field.

Essentially, this works only with `@Autowired` declarations, not direct
requests for beans in an application context!

`AutoAwire` interface is filled with default implementations. It has two
entry points: to set up the template arguments types, and to list the
annotations of the declaring field and refer the declaring bean instance.
The default for templates does nothing, the one for the annotations setup
searches for `@CallMe` annotations.

    @Component
    public class Global
    {
        ...
           
        @Autowired @PickFilter(order = 100)
        @CallMe("setSpringDispatcher")
        public DispatchFilter springDispatcher;
           
        private void setSpringDispatcher(DispatchFilter df)
        {
          df.setContextFile(this.getClass().
            getResource("/META-INF/dispatcherContext.xml"));
        }
           
        ...
    }

Check `springDispatcher` field of `Global` class. It has `@CallMe` annotation
with the name of the method to invoke when the bean is created. Note that
the meaning of this call completely differs from on-method of a Service
Bridge injecting field: `@CallMe` methods are invoked after the injected
bean instance created (this is the time the application context is created —
for singletone beans such as `Global`), but on-method is invoked by the OSGi
framework events dispatching thread upon the service is ready (in general, if
the service is not ready while creating the bean instance).


### Springer Bean Factory

As it were mentioned, standard Spring is not able to provide for a prototype
bean any data on where the bean is injected (the hosting bean), and what is
the injecting declaration: what annotations, or what Java template arguments
(classes) is has. Still, this information is available at the runtime.

Let's consider the previous sample:

    @Autowired @ServiceSwitch
    protected ServiceBridge<LogService> logService;

`ServiceBridge` is a prototype bean. Each instance has to know the name 
of the OSGi interface it's tracking for. With the standard beans factory,
the bridge instance created is pure, we have to setup the service name 
(class) manually. As `ServiceBridge` is a Java template, we have to pass
the same class as the template argument, and later in the code — in a
`@PostConstruct` method — to set the same class object via the instance call.
It's clear that this redandancy is not elegant and exists only because Spring
beans factory creates prototype beans regardless of the injecting context.

Springer module has a subclass of `DefaultListableBeanFactory`. The boot
strategy `SpringerBoot` creates application context with special builder
that returns `SpringerBeanFactory` instance targeted to a specific XML
configuration document (hard-coded as `applicationContext.xml`).

The goal of `SpringerBeanFactory` is to track the requests for new beans
saving the requests to the stack. When the factory asks to resolve bean
dependency for a nested bean, it saves the context of the request for 
injection — `DependencyDescriptor` — to the pending stack entry (the top), 
and after the bean instance is created (but not `@PostConstruct` initialized) 
provides that context to the bean instance: template arguments, field 
annotations, and the hosting (injecting) bean. Target (prototype) bean has
to implement `AutoAwire` interface.


### Servlet Filters

In Java web development servlets are final points of HTTP requests processing,
and filters are a transitive (wrapping) ones. It's clear that filers are more
powerful than servlets as they able to handle the request completely or 
partially, or to transform the response, or to simply pass the request further.

In ExtJSF concept project (that do work as regular Java web application) own
variant of a filter was proposed, and it's copied in Embeddy project with some
minor modifications. While in ExtJSF own filters is a way to optimize filtering
by reducing the nested chaining calls, in Embeddy project it's a must-to-have
level! Because the OSGi HTTP service is pretty simple comparing to servlet
containers.

Interface `Filter` of `springer` module has two entry points of a request
processing: open bracket, and the close one. Filter takes `FilterTask`
structure instance that couples the HTTP request and the response, and
the filters chain. In the opening bracket filter may do something, or
nest the filters chain via `continueCycle()` of the task. There are
few of filters that do the nesting: `TxFilter` that wraps the request
in the transactional scopes. Compare this with Java filters: there you
always have to nest the chain, this expands the JVM stack. 
 
Class `FiltersServlet`, that is a Java servlet, is an entry point fo the
filters processing. It is created so:
 
    @Component
    public class Global
    {
        ...
           
        @Autowired
        public FiltersGlobalPoint filters;
           
        @Autowired @CallMe("setGlobalServlet")
        public ServletBridge servletBridge;
           
        private void setGlobalServlet(ServletBridge sb)
        {
            sb.setPath("/");
            sb.setServlet(new FiltersServlet(filters));
        }
           
        ...
    }

The first thing to note that `Global` bean is a part of initial application
context of `webapp` module. Here we register `ServletBridge` that tracks for
the OSGi HTTP service: when it becomes ready, `setGlobalServlet` method is
invoked. Here we tell the bridge the context path and the servlet instance. 
The bridge registers the servlet to the HTTP service by the path. 

Yet to this moment there is no relation with Spring MVC framework. Filters 
Servlet knows nothing about Spring as it works with the collection of `Filter`
instances. This collection is represented by `FiltersPoint` interface. In
`webapp` there is only one implementation: `FiltersGlobalPoint` singletone
bean from `springer`. This bean is injected to `Global`, and all the filters
are connected to this point via the proxies.


### Filter Proxies and Pick Order

`Global` bean of `webapp` demo module injects several prototype beans of
class `ProxyFilter`. Each proxy is a placeholder for actual filter instance
created when the nested web application context is ready. Proxies do form the 
list of global filters that `ServletBridge` takes in.

`Filter` interface returns `@PickFilter` instance that by default is `null`.
It's a strange thing — to return annotation instances from methods as only
the JVM creates them. This decision has a goal: to support wrapping filters
(such as proxies) that process the annotations from the filters they possess.

`@PickFilter` annotation may be set for a bean injecting field:

    @Component
    public class Global
    {
        ...
           
        @Autowired @PickFilter(order = 22)
        public ProxyFilter systemFilter;
           
        ...
    }

Or for a filter class:
 
    @Component @PickFilter(order = 20)
    public class SecFilter implements Filter
    {
        ...
    }

Implementation of the security check filter in `webapp` does not depend on
the nested web application context. (Assumed that this filter only checks 
the database that is available from the initial context.) This is why this
particular filter is a singletone bean of the initial context.
 
`FiltersGlobalPoint` is a tricky bean. It collects all the filters by taking
singletone beans implementing `Filter` interface and by scanning prototype
beans registered in the global tracker — only the filters that return 
`@PickFilter` or declare it in the implementing class are taken. This allows 
not to register the filters in any collection or XML configuration, but just 
to mark their classes or the proxy injecting fields!
 
`@PickFilter` tells the order of filters execution in the collection. It also
tells the servlet processing stage: request (the default), or include, forward,
error — the latters are rarely needed.


### Transactional Scopes

Class `TxBean` of `springer` module is an application point of `@Transactional`
annotation. It takes callable object to run in existing or new transaction.
`TxBean` is a prototype bean, but is has no own state except the flag whether
to start nested transaction or not.

Beans and JsX scripts of `webapp` module do not access `TxBean` filter directly
as they rely upon `TxFilter` wrapping incoming HTTP requests. The filter is 
defined in `Global` point:

    @Component
    public class Global
    {
        ...
           
        @Autowired
        public BeanTracker beanTracker;
           
        ...
           
        @Autowired @PickFilter(order = 50)
        @CallMe("setTxFilter")
        public TxFilter txFilter;
           
        private void setTxFilter(TxFilter txf)
        {
            beanTracker.add(txf);
            txf.setContexts(".jsx");
        }
           
        ...
    }

It's in the middle of the filters order. As transaction is a consuming resource,
unauthorized requests, or redirects, or any things to filter without accessing 
the database are better to do ahead. Note that the filter is registered in the
beans tracking as it's a prototype bean — to be picked by the global filters
chain as it was mentioned in the previous section.
 
By assigning `txf.setContexts(".jsx")` we tell the filter to open transactional 
scopes for each request to JsX JavaScript file having `.jsx` extension. When
string with `/`, it is a context path. Thus the filter skips requests for
static resources that go further to the dispatching servlet of Spring.


### Spring Dispatcher Servlet

In the demo application, `webapp` module, there are system level filters such
as redirect, user authorization check, login procedure. And there are of the 
applied level: JsX (JavaScript files for Nashorn) scripts and Spring Framework
Dispatcher Servlet connected via filter `DispatchFilter` that is the last
in the order.

Dispatcher Servlet requires a web compatible Spring application context that
is created when the OSGi HTTP service becomes ready and has the initial context
created during `webapp` activation set as the parent context. Let's consider
how this is organized.

First, `Global` bean of the intial application context creates proxy filter
for the dispatching one:

    @Component
    public class Global
    {
        ...
           
        @Autowired @PickFilter(order = 100)
        @CallMe("setSpringDispatcher")
        public DispatchFilter springDispatcher;
           
        private void setSpringDispatcher(DispatchFilter df)
        {
            df.setContextFile(this.getClass().getResource(
              "/META-INF/dispatcherContext.xml"));
        }
           
        ...
    }

The order of the filter is 100 — it's the last in the global order. Dispatch
Filter has a parameter of the resource of XML configuration file that defines
the beans of the nested application context:

    <context:annotation-config/>
      
    <context:component-scan base-package = 
      'net.java.osgi.embeddy.webapp'/>

The file contains two items: to configure via annotations, and to scan for 
the beans in `webapp` package of the module. Note that this package was 
added to the springer boot class path, but not to the list of initially
scanned packages — `app` package. This is true because we can't create
beans that stand on the HTTP service (also, transitively) before the 
service is ready. 

The internals of the dispatching filter are close to the boot strategy as
it's main goal is to build the application context, then the instance of
`DispatcherServlet` of Spring Framework. As `DispatchFilter` is a bean
(of the initial context), it injects own context and uses it as the parent
of the created context. This makes all the initial beans to be visible from
the nested context making the whole application seamless.

The following documents [Nashorn Java Scripting with JsX](jsx.md) and [Demo 
Web Application Bundle](webapp.md) cover the rest areas of how the demo 
application executes that are not relevant to Spring Framework and `springer`
module itself.