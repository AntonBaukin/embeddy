package net.java.osgi.embeddy.springer.servlet;

/* Java Servlet */

import java.util.concurrent.atomic.AtomicBoolean;

import javax.servlet.Servlet;

/* OSGi */

import org.osgi.service.http.HttpContext;
import org.osgi.service.http.HttpService;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.ServiceBridge;
import net.java.osgi.embeddy.springer.ServiceSwitch;
import net.java.osgi.embeddy.springer.boot.AutoAwire;


/**
 * Bridge to HTTP Service to register a Servlet.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class ServletBridge implements AutoAwire
{
	/* Servlet Bridge (configuration) */

	/**
	 * Defines the path to register the Servlet.
	 */
	public void setPath(String path)
	{
		this.path = path;
		onHttpService();
	}

	protected String path;

	/**
	 * Servlet instance to register.
	 */
	public void setServlet(Servlet servlet)
	{
		this.servlet = servlet;
		onHttpService();
	}

	protected volatile Servlet servlet;

	public void setContext(HttpContext context)
	{
		this.context = context;
		onHttpService();
	}

	protected volatile HttpContext context;


	/* protected: the bridge */

	@Autowired @ServiceSwitch
	protected ServiceBridge<HttpService> service;

	/**
	 * Registers the servlet in the HTTP Service. Note that
	 * due to asynchronous nature of OSGi, the service may
	 * be ready before all the parameters are set, or after,
	 * and here we must handle all the cases.
	 */
	protected void onHttpService()
	{
		//?: {the path is empty}
		if(this.path == null)
			return;

		//?: {servlet is not created}
		if(this.servlet == null)
			return;

		//~: register the servlet
		service.invoke(s ->
		{
			try
			{
				if(registered.compareAndSet(false, true)) //?: {not registered}
				{
					s.registerServlet(this.path, this.servlet, null, this.context);

					LU.debug(LU.logger(this), "registered servlet ",
					  LU.sig(this.servlet), " mapped @[", this.path, "*]");
				}
			}
			catch(Throwable e)
			{
				this.registered.set(false);

				throw EX.wrap(e, "Error occured while registering ",
				  "Servlet by the path [", this.path, "]!");
			}
		});
	}

	protected final AtomicBoolean registered = new AtomicBoolean();

	protected void offHttpService()
	{
		//?: {not registered}
		if(!this.registered.compareAndSet(true, false))
			return;

		//?: {the path is empty}
		EX.asserts(this.path);

		//~: do un-register
		service.invoke(s -> s.unregister(this.path));

		LU.debug(LU.logger(this), "un-registered servlet mapped @[",
		  this.path, "*], instance was: ", LU.sig(this.servlet));
	}
}