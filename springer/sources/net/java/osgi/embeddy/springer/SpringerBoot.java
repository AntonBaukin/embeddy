package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.reflect.Method;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/* OSGi */

import net.java.osgi.embeddy.springer.boot.BeanFactoryBuilder;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.wiring.BundleWiring;

/* SAX */

import org.xml.sax.InputSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.SpringerClassLoader;
import net.java.osgi.embeddy.springer.support.IS;


/**
 * Creates class loader with class weaving functionality
 * able to boot Spring Framework based on Spring Generic
 * Application Context activation with XML and Annotated
 * beans definitions.
 *
 * Using this mechanism of Spring startup lies a restriction
 * on accessing singletons via static fields and functions.
 * {@link SpringerClassLoader} merges two class loaders: of
 * Springer bundle (this class bundle), and of the using
 * application (bundle). This allows not to import Spring
 * packages in the using bundles.
 *
 * {@code SpringClassLoader} has parent loader of the using
 * bundle. Each Spring bean class is discovered and loaded
 * by that child class loader. So, if you put static fields
 * in your Spring components and try to access them from
 * your regular bundle classes, you'll get differ class!
 * But accessing regular classes from Spring one goes well
 * as that regular classes are loaded with Spring' parent.
 *
 * As the result, always access Spring beans from your regular
 * classes via provided {@link #bean(Class, Object[])}, or
 * {@link #bean(String, Object[])}, or your wrapper around them!
 *
 * Besides annotated classes, this boot strategy supports XML
 * definitions. If class path of the using application contains
 * {@code /META-INF/applicationContext.xml} resource, it's loaded
 * before any annotated bean definition.
 *
 * If Springer bundle is loaded with HTTP bundles, the boot
 * creates web application context with the same abilities.
 *
 * Warning! This implementation access Spring objects
 * via reflection as it loads that classes with
 * Springer Class Loader.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public class SpringerBoot implements BundleActivator
{
	/**
	 * Creates strategy instance for the target Java
	 * packages specified. Note that Springer packages
	 * are also added to the list implicitly.
	 */
	public SpringerBoot(String packageOne, String... packagesElse)
	{
		//~: build the packages
		this.packages = new String[1 + packagesElse.length];
		System.arraycopy(packagesElse, 0, this.packages, 1, packagesElse.length);
		this.packages[0] = packageOne;
		for(String p : this.packages)
			EX.asserts(p, "Package is empty [", p, "]!");

		//~: adapters support
		ReentrantReadWriteLock rwlock = new ReentrantReadWriteLock();
		this.adaptersRead  = rwlock.readLock();
		this.adaptersWrite = rwlock.writeLock();
		this.adapters = new HashMap(3);
	}

	public final String[] packages;


	/* Spring Boot (access) */

	public Object bean(String name, Object... args)
	{
		EX.asserts(name);

		try
		{
			return getBeanName.invoke(applicationContext, name, args);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error accessing Spring Bean named [", name, "]!");
		}
	}

	@SuppressWarnings("unchecked")
	public <O> O  bean(Class<O> cls, Object... args)
	{
		EX.assertn(cls);

		try
		{
			return (O) getBeanType.invoke(applicationContext, cls, args);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error accessing Spring Bean typed [", cls.getName(), "]!");
		}
	}

	protected Method getBeanName;
	protected Method getBeanType;


	/* Spring Boot (activation) */

	public void start(BundleContext context)
	  throws Exception
	{
		//?: {already started}
		if(!started.compareAndSet(false, true))
			throw EX.state("Spring Framework is already started!");

		this.bundleContext = context;

		try
		{
			//~: create the class loader
			classLoader = EX.assertn(createClassLoader());

			//~: create the application context
			createApplicationContext();
		}
		catch(Throwable e)
		{
			bundleContext = null;
			started.set(false);

			throw EX.wrap(e, "Error while starting Spring Framework!");
		}
	}

	protected final AtomicBoolean started =
	  new AtomicBoolean();

	protected BundleContext bundleContext;

	public void stop(BundleContext context)
	  throws Exception
	{
		//?: {not started | already stopped}
		if(!started.compareAndSet(true, false))
			throw EX.state("Spring Framework is not started!");

		try
		{
			removeAdapters();

			//~: destroy the spring context
			try
			{
				if(applicationContext != null)
					destroyApplicationContext(applicationContext);
			}
			finally
			{
				applicationContext = null;

				//~: close the class loader
				if(classLoader != null) try
				{
					closeClassLoader(classLoader);
				}
				finally
				{
					this.classLoader = null;
				}
			}
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while stopping Spring Framework!");
		}
		finally
		{
			this.bundleContext = null;
			this.getBeanName = this.getBeanType = null;
		}
	}


	/* Spring Boot (adapter) */

	@SuppressWarnings("unchecked")
	public <A> A    adapt(Class<A> i)
	{
		adaptersRead.lock(); try
		{
			return (A) adapters.get(i.getName());
		}
		finally
		{
			adaptersRead.unlock();
		}
	}

	/**
	 * Installs the given adapter, or removes
	 * existing, if {@code null}. Present
	 * adapter is always overwritten.
	 *
	 * If interface class and the instance
	 * are both {@code null}, all the adapters
	 * are removed.
	 */
	@SuppressWarnings("unchecked")
	public <A> void adapt(Class<A> i, A instance)
	{
		if(instance != null)
			EX.assertx(i.isAssignableFrom(instance.getClass()),
			  "Adapter is not a [", i.getName(), "] instance!");

		adaptersWrite.lock(); try
		{
			if(instance != null)
				adapters.put(i.getName(), instance);
			else if(i == null)
				removeAdapters();
			else
				adapters.remove(i.getName());
		}
		finally
		{
			adaptersWrite.unlock();
		}
	}

	@SuppressWarnings("unchecked")
	public <A> void adapt(Class<A> i, Adapt<A> factory)
	{
		adaptersWrite.lock(); try
		{
			if(adapters.containsKey(i.getName()))
				return;

			Object instance = EX.assertn(factory.createAdapter(),
			  "Adapter factory returned undefined instance!");

			if(!i.isAssignableFrom(instance.getClass()))
				EX.assertx(i.isAssignableFrom(instance.getClass()),
				  "Adapter factory returned not a [", i.getName(), "] instance!");

			adapters.put(i.getName(), instance);
		}
		finally
		{
			adaptersWrite.unlock();
		}
	}

	/**
	 * Factory to create an Adapter on the demand.
	 */
	public static interface Adapt<A>
	{
		public A createAdapter();
	}

	protected final Lock adaptersRead;
	protected final Lock adaptersWrite;
	protected final Map  adapters;


	/* protected: booting and support */

	protected static String THIS_BUNDLE =
	  SpringerBoot.class.getPackage().getName();

	protected Bundle      searchThisBundle()
	{
		for(Bundle b : bundleContext.getBundles())
			if(b.getSymbolicName().equals(THIS_BUNDLE))
				return b;

		throw EX.state("Springer bundle [", THIS_BUNDLE, "] is not found!");
	}

	protected ClassLoader createClassLoader()
	{
		//~: class loader of the target bundle
		ClassLoader thatLoader = bundleContext.getBundle().
		  adapt(BundleWiring.class).getClassLoader();

		//~: search for this bundle
		Bundle      thisBundle = searchThisBundle();
		ClassLoader thisLoader = thisBundle.adapt(
		  BundleWiring.class
		).getClassLoader();

		return new SpringerClassLoader(this, thatLoader, thisLoader, packages);
	}

	protected ClassLoader classLoader;

	protected void        closeClassLoader(ClassLoader cl)
	{
		if(cl instanceof AutoCloseable) try
		{
			((AutoCloseable)cl).close();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while closing the class loader!");
		}
	}

	/**
	 * Creates Spring Application Context
	 * instance and activates it.
	 */
	protected void        createApplicationContext()
	{
		//~: temporary rewrite the thread class loader
		ClassLoader loader = Thread.currentThread().getContextClassLoader();
		Thread.currentThread().setContextClassLoader(classLoader);

		try
		{
			//~: create an instance
			Object ctx = this.applicationContext =
			  newApplicationContext();

			//~: bean access method
			getBeanName = ctx.getClass().getMethod("getBean",
			  String.class, Object[].class);

			getBeanType = ctx.getClass().getMethod("getBean",
			  Class.class, Object[].class);

			//~: configure it
			configureApplicationContext();

			//~: and activate it
			activateApplicationContext();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error activating Spring Application Context!");
		}
		finally
		{
			//~: return back thread loader
			Thread.currentThread().setContextClassLoader(loader);
		}
	}

	protected Object applicationContext;

	protected Object      newApplicationContext()
	  throws Throwable
	{
		//~: target context class
		Class<?> ctxCls = classLoader.loadClass(
		  IS.web()?(CONTEXT_CLS_WEB):(CONTEXT_CLS));

		//~: our bean factory
		Class<?> facCls = classLoader.loadClass(
		  "org.springframework.beans.factory.BeanFactory");

		//~: our bean factory
		Class<?> sbfCls = classLoader.loadClass(
		  "net.java.osgi.embeddy.springer.boot.SpringerBeanFactory");

		//~: create instance with XML loading
		return ctxCls.getConstructor(BeanFactoryBuilder.class).
		  newInstance(new BeanFactoryBuilder()
		{
			public Object buildFactory(Object parent)
			{
				try
				{
					Object f = sbfCls.getConstructor(facCls).newInstance(parent);

					//~: load beans from xml
					loadXMLConfiguration(f);

					return f;
				}
				catch(Throwable e)
				{
					throw EX.wrap(e);
				}
			}
		});
	}


	public final String CONTEXT_CLS = 
	  "net.java.osgi.embeddy.springer.boot.SpringerApplicationContext";

	public final String CONTEXT_CLS_WEB =
	  "net.java.osgi.embeddy.springer.boot.SpringerWebApplicationContext";

	protected void        configureApplicationContext()
	  throws Throwable
	{
		//~: scan the packages provided
		scanAnnotatedClasses();
	}

	protected void        activateApplicationContext()
	  throws Throwable
	{
		installAdapters();

		//~: refresh the context
		this.applicationContext.getClass().getMethod("refresh").
		  invoke(this.applicationContext);
	}

	protected static final String XML_CONFIG =
	  "/META-INF/applicationContext.xml";

	protected URL         getXMLConfiguration()
	{
		return classLoader.getResource(XML_CONFIG);
	}

	protected void        loadXMLConfiguration(Object beanFactory)
	  throws Throwable
	{
		//~: access the configuration file
		URL xml = getXMLConfiguration();
		if(xml == null) return;

		Class<?> bdr = classLoader.loadClass(
		  "org.springframework.beans.factory.support.BeanDefinitionRegistry");

		Class<?> xdr = classLoader.loadClass(
		  "org.springframework.beans.factory.xml.XmlBeanDefinitionReader");

		//~: create xml reader
		Object      rdr = xdr.getConstructor(bdr).newInstance(beanFactory);
		InputSource src = new InputSource(xml.openStream());

		//~: require schema validation mode
		rdr.getClass().getMethod("setValidationModeName", String.class).
		  invoke(rdr, "VALIDATION_XSD");

		//~: read the configuration
		rdr.getClass().getMethod("loadBeanDefinitions", InputSource.class).
		  invoke(rdr, src);
	}

	protected void        scanAnnotatedClasses()
	  throws Throwable
	{
		this.applicationContext.getClass().getMethod("scan", String[].class).
		  invoke(this.applicationContext, (Object)scanPackages());
	}

	protected String[]    scanPackages()
	{
		String[] ps = new String[packages.length + 1];

		System.arraycopy(packages, 0, ps, 1, packages.length);
		ps[0] = this.getClass().getPackage().getName();

		return ps;
	}

	protected void        destroyApplicationContext(Object ctx)
	  throws Throwable
	{
		ctx.getClass().getMethod("close").invoke(ctx);
	}

	protected static final String AC_CLS =
	  "org.springframework.context.ApplicationContext";

	@SuppressWarnings("unchecked")
	protected void        installAdapters()
	  throws Throwable
	{
		//~: bundle
		this.adapt(Bundle.class, this.bundleContext.getBundle());

		//~: bundle context
		this.adapt(BundleContext.class, this.bundleContext);

		//~: spring Application Context
		Class ac = this.classLoader.loadClass(AC_CLS);
		this.adapt(ac, this.applicationContext);
	}

	@SuppressWarnings("unchecked")
	protected void        removeAdapters()
	{
		adaptersWrite.lock(); try
		{
			adapters.clear();
		}
		finally
		{
			adaptersWrite.unlock();
		}
	}
}