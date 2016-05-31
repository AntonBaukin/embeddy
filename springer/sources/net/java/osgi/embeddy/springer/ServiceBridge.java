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

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.AutoAwire;
import net.java.osgi.embeddy.springer.boot.SpringerClassLoader;
import net.java.osgi.embeddy.springer.support.Acceptor;


/**
 * Prototype bean to access OSGi service.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class ServiceBridge<S> implements AutoAwire
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


	/* Service Bridge */

	/**
	 * Synchronously invokes the closure if service is set.
	 * Returns true in the case the call done.
	 */
	public boolean invoke(Acceptor<S> x)
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
	 * Installs synchronously On- and Off-callbacks.
	 * If OSGi service is already bound, immediately
	 * executes On-callback.
	 */
	public void    watch(Runnable on, Runnable off)
	{
		synchronized(this)
		{
			this.on  = on;
			this.off = off;

			tryOn();
		}
	}

	protected Runnable on;
	protected Runnable off;

	/**
	 * Synchronously checks whether the service
	 * is bound, and if is, executes the closure.
	 */
	public void    doer(Runnable set)
	{
		synchronized(this)
		{
			if(this.service != null)
				set.run();
		}
	}

	/**
	 * If-else extension of {@link #doer(Runnable)}.
	 */
	public void    doer(Runnable set, Runnable unset)
	{
		synchronized(this)
		{
			if(this.service == null)
				unset.run();
			else
				set.run();
		}
	}


	/* protected: OSGi listener */

	protected static Object LOG =
	  LU.logger(ServiceBridge.class);

	@PostConstruct
	@SuppressWarnings("unchecked")
	protected void create()
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

		LU.debug(LOG, "created Service Bridge for [", serviceClass, "]");
	}

	protected ServiceTracker tracker;

	@PreDestroy
	protected void destroy()
	{
		synchronized(this)
		{
			if(this.tracker != null) try
			{
				this.tracker.close();
			}
			finally
			{
				this.tracker = null;
			}
		}
	}

	@SuppressWarnings("unchecked")
	protected void bindService(ServiceReference sr)
	{
		BundleContext ctx = EX.assertn(boot.adapt(BundleContext.class));

		synchronized(this)
		{
			if(this.service != null)
			{
				LU.warn("repeated attempt to bind OSGi service [",
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
			this.tryOn();
		}
	}

	protected S service;

	protected void unbindService(S service)
	{
		synchronized(this)
		{
			if(this.service == null)
			{
				LU.warn("repeated attempt to un-bind OSGi service [",
				  serviceClass.getName(), "] that is not bound!");

				return;
			}

			if(this.service != service)
			{
				LU.warn("repeated attempt to un-bind OSGi service [",
				  serviceClass.getName(), "] that is bound with else instance!");

				return;
			}

			//~: put the bridge of
			try
			{
				this.tryOff();
			}
			finally
			{
				this.service = null;
			}
		}
	}

	/**
	 * Hint: invoked in the synchronization context.
	 */
	protected void tryOn()
	{
		if((this.on != null) && (this.service != null))
			this.on.run();
	}

	/**
	 * Hint: invoked in the synchronization context.
	 */
	protected void tryOff()
	{
		if((this.off != null) && (this.service != null))
			this.off.run();
	}

	/**
	 * TODO register off method
	 */
	protected void setSwitch(Object target, ServiceSwitch s)
	{
		//?: {has no target}
		EX.assertn(target, "@ServiceSwitch injecting bean is undefined! ",
		  "Is it properly declares @Autowire annotation?");

		//~: method name
		String name = EX.assertn(s.value());
		if(name.isEmpty())
		{
			StringBuilder b = new StringBuilder(32).
			  append(EX.assertn(serviceClass.getSimpleName()));

			b.setCharAt(0, Character.toUpperCase(b.charAt(0)));
			b.insert(0, "on");
			name = b.toString();
		}

		//~: get the method
		Method m = null; try
		{
			m = target.getClass().getMethod(name);
		}
		catch(NoSuchMethodException e)
		{
			Class<?> c = target.getClass();
			while(c.getSuperclass() != null) try
			{
				m = c.getDeclaredMethod(name);
				break;
			}
			catch(NoSuchMethodException e2)
			{
				c = c.getSuperclass();
			}

			if(m == null) throw EX.ass("No @ServiceSwitch method [", name,
			  "] is found in the injecting class [", target.getClass().getName(), "]!");

			//!: it is protected
			m.setAccessible(true);
		}

		this.switchTarget = target;
		this.switchMethod = m;

		synchronized(this)
		{
			if(this.service != null)
				trySwitch();
		}
	}

	protected Object switchTarget;
	protected Method switchMethod;

	protected void trySwitch()
	{
		if(switchMethod != null) try
		{
			switchMethod.invoke(switchTarget);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while executing ",
			  "@ServiceSwitch method [", switchMethod,
			  "] for service target class [",
			  switchTarget.getClass().getName(), "]!");
		}
	}
}