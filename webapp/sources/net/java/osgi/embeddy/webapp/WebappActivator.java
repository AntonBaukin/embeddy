package net.java.osgi.embeddy.webapp;

/* OSGi */

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.SpringerBoot;


/**
 * Registers servlet to provide static web content.
 *
 * @author anton.baukin@gmail.com.
 */
public class WebappActivator implements BundleActivator
{
	/* Bundle Activator */

	public void start(BundleContext context)
	  throws Exception
	{
		//~: start spring bridge
		loader.start(context);
	}

	public void stop(BundleContext context)
	  throws Exception
	{
		//~: stop spring bridge
		loader.stop(context);
	}

	public final SpringerBoot loader =
	  new SpringerBoot(WebappActivator.class.getPackage().getName());
}