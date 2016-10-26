package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;

/* Java Annotations */

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/* OSGi */

import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.util.tracker.ServiceTracker;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.AutoAwire;
import net.java.osgi.embeddy.springer.boot.SpringerClassLoader;
import net.java.osgi.embeddy.springer.support.Acceptor;
import net.java.osgi.embeddy.springer.support.BeanTracker;
import net.java.osgi.embeddy.springer.support.OU;


/**
 * Prototype bean to access OSGi service.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class ServiceBridge<S> implements AutoAwire, AutoCloseable
{
	public ServiceBridge()
	{
		ClassLoader cl = Thread.currentThread().getContextClassLoader();
		if(!(cl instanceof SpringerClassLoader))
			throw EX.ass("Class ServiceBridge instance must be created ",
			  "in context of a Springer Class Loader!");

		this.boot = EX.assertn(((SpringerClassLoader)cl).getSpringBoot());
	}

	public final SpringerBoot boot;


	/* Autowire Aware */

	@SuppressWarnings("unchecked")
	public void autowiredTypes(Class<?>[] types)
	{
		EX.assertx(types.length == 1);
		this.serviceClass = (Class<S>) types[0];
	}

	protected Class<S> serviceClass;

	public void autowiredAnnotations(Object injector, Annotation[] ans)
	{
		this.callMe(injector, ans);

		for(Annotation a : ans)
			if(a instanceof ServiceSwitch)
				this.setSwitch(injector, (ServiceSwitch) a);
	}


	/* Auto Closeable */

	@PreDestroy
	public void close()
	{
		synchronized(this)
		{
			//?: {service is bound}
			try
			{
				//?: {service is bound}
				if(service != null)
					this.trySwitch(false);
			}
			finally
			{
				this.service = null;

				//?: {service tracker is created} close it
				if(this.tracker != null) try
				{
					this.tracker.close();
				}
				finally
				{
					this.tracker = null;
				}
			}

			LU.debug(LOG, "closed Service Bridge for [", serviceClass, "]");
		}

		beanTracker.remove(this);
	}

	@Autowired
	protected BeanTracker beanTracker;


	/* Service Bridge */

	public Class<S> getServiceClass()
	{
		return serviceClass;
	}

	/**
	 * Synchronously invokes the closure if service is set.
	 * Returns true in the case the call done.
	 */
	public boolean  invoke(Acceptor<S> x)
	{
		synchronized(this)
		{
			if(service == null)
				return false;

			x.accept(service);
			return true;
		}
	}

	/**
	 * If-else extension of {@link #invoke(Acceptor)}.
	 */
	public void     invoke(Acceptor<S> set, Runnable unset)
	{
		synchronized(this)
		{
			if(this.service == null)
				unset.run();
			else
				set.accept(service);
		}
	}


	/* protected: OSGi listener */

	protected static Object LOG =
	  LU.logger(ServiceBridge.class);

	@PostConstruct
	@SuppressWarnings("unchecked")
	protected void   create()
	{
		BundleContext ctx = EX.assertn(boot.adapt(BundleContext.class));
		EX.assertx(this.tracker == null);

		//?: {has no service class}
		EX.assertn(serviceClass, "OSGi ServiceBridge has no Service Class ",
		  "assigned! Use @Autowire annotation with Service Class generic type.");

		try
		{
			this.tracker = new ServiceTracker(ctx, serviceClass, null)
			{
				@SuppressWarnings("unchecked")
				public Object addingService(ServiceReference reference)
				{
					bindService(reference);
					return super.addingService(reference);
				}

				@SuppressWarnings("unchecked")
				public void   removedService(ServiceReference reference, Object service)
				{
					unbindService((S)service);
					super.removedService(reference, service);
				}
			};

			//!: open the tracker
			this.tracker.open();
		}
		catch(Throwable e)
		{
			this.tracker = null;
			throw EX.wrap(e, "error while creating OSGi service [",
			  serviceClass.getName(), "] tracker!");
		}

		//~: track destruction of this bean
		beanTracker.add(this);

		LU.debug(LOG, "created Service Bridge for [", serviceClass, "]");
	}

	protected ServiceTracker tracker;

	@SuppressWarnings("unchecked")
	protected void   bindService(ServiceReference sr)
	{
		BundleContext ctx = EX.assertn(boot.adapt(BundleContext.class));

		synchronized(this)
		{
			if(this.service != null)
			{
				LU.warn(LOG, "repeated attempt to bind OSGi service [",
				  serviceClass.getName(), "]!");
				return;
			}

			//~: access the service
			Object service = EX.assertn(ctx.getService(sr),
			  "OSGi service [", serviceClass.getName(), "] is undefined!");

			//?: {not that class}
			if(!serviceClass.isAssignableFrom(service.getClass()))
				throw EX.state("OSGi service [", serviceClass.getName(),
				  "] instance has not compatible class [",
				  service.getClass().getName(), "]!");

			this.service = (S)service;

			//~: put the bridge on
			this.trySwitch(true);
		}
	}

	protected S service;

	protected void   unbindService(S service)
	{
		synchronized(this)
		{
			//?: {nothing to do}
			if(this.service == null)
				return; //<-- no warning

			if(this.service != service)
			{
				LU.warn(LOG, "repeated attempt to un-bind OSGi service [",
				  serviceClass.getName(), "] that is bound with else instance!");

				return;
			}

			//~: put the bridge of
			try
			{
				this.trySwitch(false);
			}
			finally
			{
				this.service = null;
			}
		}
	}

	protected void   setSwitch(Object target, ServiceSwitch s)
	{
		//?: {has no target}
		EX.assertn(target, "@ServiceSwitch injecting bean is undefined! ",
		  "Is it properly declares @Autowire annotation?");

		this.switchObj = target;
		this.switchOn  = switchMethod(target, s.on(),  true);
		this.switchOff = switchMethod(target, s.off(), false);

		synchronized(this)
		{
			if(this.service != null)
				trySwitch(true);
		}
	}

	protected Method switchMethod(Object target, String n, boolean on)
	{
		//?: {the name is default}
		if((n == null) || n.isEmpty())
		{
			StringBuilder b = new StringBuilder(32).
			  append(EX.assertn(serviceClass.getSimpleName()));

			b.setCharAt(0, Character.toUpperCase(b.charAt(0)));
			b.insert(0, on?("on"):("off"));

			//Hint: default method is not required
			return OU.method(target.getClass(), b.toString());
		}

		//?: {named method is not found}
		return EX.assertn(OU.method(target.getClass(), n),
		  "@ServiceSwitch named method ", n,
		  "() is not found in injecting class [",
		  target.getClass().getSimpleName(), "]!");
	}

	protected Object switchObj;
	protected Method switchOn;
	protected Method switchOff;

	protected void trySwitch(boolean on)
	{
		Method m = on?(switchOn):(switchOff);

		if(m != null) try
		{
			m.invoke(switchObj);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while executing @ServiceSwitch method [",
			  m, "] for service target class [", LU.sig(switchObj), "]!");
		}
	}
}