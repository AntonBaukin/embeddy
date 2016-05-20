package net.java.osgi.embeddy.loggy;

/* Java */

import java.lang.reflect.Proxy;

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.framework.BundleListener;
import org.osgi.framework.ServiceEvent;
import org.osgi.framework.ServiceListener;
import org.osgi.framework.ServiceReference;
import org.osgi.framework.ServiceRegistration;
import org.osgi.service.log.LogService;

/* Logging for Java */

import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LoggerContext;
import org.apache.logging.log4j.core.config.Configuration;


/**
 * Implements OSGi Log Service targeting
 * events to Log4j2 framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class      LoggyService
       implements LogService,
                  BundleActivator,
                  BundleListener,
                  ServiceListener
{
	/* Log Service */

	public void log(int level, String message)
	{
		new LoggyBridge(config).
		  setLevel(level).
		  setMessage(message).
		  init().
		  log();
	}

	public void log(int level, String message, Throwable exception)
	{
		new LoggyBridge(config).
		  setLevel(level).
		  setMessage(message).
		  setError(exception).
		  init().
		  log();
	}

	public void log(ServiceReference sr, int level, String message)
	{
		new LoggyBridge(config).
		  setLevel(level).
		  setMessage(message).
		  setService(sr).
		  init().
		  log();
	}

	public void log(ServiceReference sr, int level, String message, Throwable exception)
	{
		new LoggyBridge(config).
		  setLevel(level).
		  setMessage(message).
		  setService(sr).
		  setError(exception).
		  init().
		  log();
	}


	/* Bundle Activator */

	public void start(BundleContext context)
	  throws Exception
	{
		//~: access Log4j configuration
		this.config = ((LoggerContext) LogManager.getContext()).
		  getConfiguration();

		//~: get the logger
		logger = LogManager.getLogger(this.getClass());

		//~: install the service
		serviceRegistration = context.registerService(
		  LogService.class, this, null);

		//~: add listeners
		context.addBundleListener(this);
		context.addServiceListener(this);
	}

	public void stop(BundleContext context)
	  throws Exception
	{
		//~: remove listeners
		context.removeBundleListener(this);
		context.removeServiceListener(this);

		//~: remove the service
		if(serviceRegistration != null) try
		{
			serviceRegistration.unregister();
		}
		finally
		{
			serviceRegistration = null;

			//~: un-link the configuration
			this.config = null;
			this.logger = null;
		}
	}

	protected volatile Configuration config;
	protected ServiceRegistration    serviceRegistration;
	protected Logger                 logger;


	/* Bundle Listener */

	public void bundleChanged(BundleEvent event)
	{
		String sn = event.getBundle().getSymbolicName();
		String et = null;

		//~: find event name
		switch(event.getType())
		{
			case BundleEvent.INSTALLED:
				et = "INSTALLED";
				break;

			case BundleEvent.RESOLVED:
				et = "RESOLVED";
				break;

			case BundleEvent.LAZY_ACTIVATION:
				et = "LAZY ACTIVATED";
				break;

			case BundleEvent.STARTING:
				et = "STARTING";
				break;

			case BundleEvent.STARTED:
				et = "STARTED";
				break;

			case BundleEvent.STOPPING:
				et = "STOPPING";
				break;

			case BundleEvent.STOPPED:
				et = "STOPPED";
				break;

			case BundleEvent.UPDATED:
				et = "UPDATED";
				break;

			case BundleEvent.UNRESOLVED:
				et = "UNRESOLVED";
				break;

			case BundleEvent.UNINSTALLED:
				et = "UNINSTALLED";
				break;
		}

		if(et != null)
			logger.info("bundle [{}] is [{}]", sn, et);
	}


	/* Service Listener */

	public void serviceChanged(ServiceEvent event)
	{
		Bundle b = event.getServiceReference().getBundle();
		String n = null;
		String m = null;

		//~: find event name
		switch(event.getType())
		{
			case ServiceEvent.REGISTERED:
				m = "REGISTERED";
				break;

			case ServiceEvent.UNREGISTERING:
				m = "UNREGISTERING";
				break;

			case ServiceEvent.MODIFIED:
				m = "MODIFIED";
				break;
		}

		//~: find service class
		Object s = b.getBundleContext().getService(
		  event.getServiceReference());

		if(s != null)
		{
			n = s.getClass().getSimpleName();

			if(Proxy.isProxyClass(s.getClass()))
			{
				Class[] ifs = s.getClass().getInterfaces();
				if(ifs.length != 0)
					n = ifs[0].getSimpleName();
			}
		}

		if((n != null) & (m != null))
			logger.info("service [{}] is [{}] in bundle [{}]", n, m,
			  b.getSymbolicName());
	}
}