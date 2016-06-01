package net.java.osgi.embeddy.springer;

/* Java */

import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.wiring.BundleWiring;

/* Spring Framework */

import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.xml.XmlBeanDefinitionReader;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.AnnotationConfigRegistry;

/* SAX */

import org.xml.sax.InputSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.SpringerClassLoader;
import net.java.osgi.embeddy.springer.boot.BeanFactoryBuilder;
import net.java.osgi.embeddy.springer.boot.SpringerApplicationContext;
import net.java.osgi.embeddy.springer.boot.SpringerBeanFactory;
import net.java.osgi.embeddy.springer.boot.SpringerWebApplicationContext;
import net.java.osgi.embeddy.springer.support.IS;


/**
 * Creates class loader with class weaving functionality
 * able to boot Spring Framework based on Spring Generic
 * Application Context activation with XML and Annotated
 * beans definitions.
 *
 * If Springer bundle is loaded with HTTP bundles, the boot
 * creates web application context with the same abilities.
 *
 * Using this mechanism of Spring startup lies a restriction
 * on accessing singletons via static fields and functions.
 * {@link SpringerClassLoader} merges two class loaders: of
 * Springer bundle (this class' bundle), and of the using
 * application' bundle. This also allows not to import Spring
 * packages in the using bundles.
 *
 * {@code SpringClassLoader} has parent loader of the using
 * bundle. Each Spring bean class is discovered and loaded
 * by that child class loader. So, if you put static fields
 * in your Spring components and try to access them from
 * your regular bundle classes, you'll get differ instances!
 * But accessing regular classes from Spring one goes well
 * as that regular classes are loaded with Spring' parent.
 *
 * Besides annotated classes, this boot strategy supports XML
 * definitions. If class path of the using application contains
 * {@code /META-INF/context.xml} resource, it's loaded
 * before any annotated bean definition.
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

	public ApplicationContext context()
	{
		return context;
	}

	protected ApplicationContext context;


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
			this.bundleContext = null;
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
				if(context != null)
					destroyApplicationContext(this.context);
			}
			finally
			{
				this.context = null;

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
		  BundleWiring.class).getClassLoader();

		return new SpringerClassLoader(
		  this, thatLoader, thisLoader, packages);
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
			newApplicationContext();

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

	protected void        newApplicationContext()
	  throws Throwable
	{
		BeanFactoryBuilder bfb = p -> {

			SpringerBeanFactory bf = new SpringerBeanFactory(p);

			//~: load beans from xml
			loadXMLConfiguration(bf);

			return bf;
		};

		context = IS.web()
		  ?(new SpringerWebApplicationContext(bfb))
		  :(new SpringerApplicationContext(bfb));
	}

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
		((ConfigurableApplicationContext)context).refresh();
	}

	protected static final String XML_CONFIG =
	  "/META-INF/applicationContext.xml";

	protected URL         getXMLConfiguration()
	{
		return classLoader.getResource(XML_CONFIG);
	}

	protected void        loadXMLConfiguration(BeanDefinitionRegistry beanFactory)
	{
		//~: access the configuration file
		URL xml = getXMLConfiguration();
		if(xml == null) return;

		XmlBeanDefinitionReader reader =
		  new XmlBeanDefinitionReader(beanFactory);

		//~: do the validations
		reader.setValidationModeName("VALIDATION_XSD");

		//~: load the definitions
		try(InputStream is = xml.openStream())
		{
			reader.loadBeanDefinitions(new InputSource(is));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error file loading Spring ",
			  "application context resource [", xml, "]!");
		}
	}

	protected void        scanAnnotatedClasses()
	  throws Throwable
	{
		if(context instanceof AnnotationConfigRegistry)
			((AnnotationConfigRegistry)context).scan(scanPackages());
	}

	protected String[]    scanPackages()
	{
		String[] ps = new String[packages.length + 1];

		System.arraycopy(packages, 0, ps, 1, packages.length);
		ps[0] = this.getClass().getPackage().getName();

		return ps;
	}

	protected void        destroyApplicationContext(ApplicationContext ctx)
	  throws Throwable
	{
		if(ctx instanceof AutoCloseable)
			((AutoCloseable) ctx).close();
	}

	@SuppressWarnings("unchecked")
	protected void        installAdapters()
	  throws Throwable
	{
		//~: bundle
		this.adapt(Bundle.class, this.bundleContext.getBundle());

		//~: bundle context
		this.adapt(BundleContext.class, this.bundleContext);

		//~: spring Application Context
		this.adapt(ApplicationContext.class, context);
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