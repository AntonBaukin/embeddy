package net.java.osgi.embeddy.app;

/* OSGi */

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.SpringerBoot;


/**
 * Activate the application. Web-related part
 * is under 'webapp' package that has own
 * Spring context of the Dispatcher Filter.
 *
 * @author anton.baukin@gmail.com.
 */
public class WebappActivator implements BundleActivator
{
	/* Bundle Activator */

	public void start(BundleContext context)
	  throws Exception
	{
		//~: start the database
		Database.INSTANCE.start();

		//~: start spring bridge
		loader.start(context);
	}

	public void stop(BundleContext context)
	  throws Exception
	{
		try
		{
			//~: stop spring bridge
			loader.stop(context);
		}
		finally
		{
			//~: stops the database
			Database.INSTANCE.close();
		}
	}

	public final SpringerBoot loader = new SpringerBoot().
	  scanPackages("net.java.osgi.embeddy.app").
	  loadPackages("net.java.osgi.embeddy.webapp");
}