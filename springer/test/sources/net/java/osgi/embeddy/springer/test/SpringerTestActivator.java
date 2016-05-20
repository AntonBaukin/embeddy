package net.java.osgi.embeddy.springer.test;

/* OSGi */

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

/* Embeddy Springer */

import net.java.osgi.embeddy.springer.SpringerBoot;


/**
 * Loads the test module and starts scan for Spring Beans.
 *
 * @author anton.baukin@gmail.com.
 */
public class SpringerTestActivator implements BundleActivator
{
	/* Bundle Activator */

	public void start(BundleContext context)
	  throws Exception
	{
		loader.start(context);
	}

	public void stop(BundleContext context)
	  throws Exception
	{
		loader.stop(context);
	}

	protected final SpringerBoot loader =
	  new SpringerBoot(SpringerTestActivator.class.getPackage().getName());
}