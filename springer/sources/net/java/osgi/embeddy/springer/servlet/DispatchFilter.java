package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.net.URL;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/* Java Annotations */

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/* Java Servlet */

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.boot.LoadConfigFile;
import net.java.osgi.embeddy.springer.boot.SpringerWebApplicationContext;
import net.java.osgi.embeddy.springer.support.BeanTracker;


/**
 * Bridge to Spring {@link DispatcherServlet}.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class DispatchFilter extends PickedFilter
{
	/* Filter */

	public void openFilter(FilterTask task)
	{
		final DispatcherServlet s;

		synchronized(this)
		{
			s = this.servlet;

			//?: {has no servlet set}
			if(s == null) return;
		}

		//?: {can't handle it}
		if(!canHandle(task))
			return;

		//~: invoke the servlet
		try
		{
			s.service(task.getRequest(), task.getResponse());
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		//?: {got response committed}
		if(task.getResponse().isCommitted())
			task.doBreak();
	}

	public void setServletContext(ServletContext context)
	{
		synchronized(this)
		{
			if(servlet != null)
				destroyServlet();

			if(context != null) try
			{
				createServlet(context);
			}
			catch(Throwable e)
			{
				throw EX.wrap(e, "Unable to create DispatchFilter!");
			}
		}
	}

	/* Configuration */

	@Autowired
	protected ApplicationContext applicationContext;

	@Autowired
	protected BeanTracker beanTracker;


	/* Configuration */

	/**
	 * Set optional parameter of path if you want this
	 * filter to handle only requests starting with this
	 * path value. Note that OSGi application  has no
	 * concept of context-path of servlet containers.
	 */
	public void setPath(String path)
	{
		this.path = path;
	}

	protected String path;

	/**
	 * Assigns URL to XML configuration file of the
	 * nested Web Application Context created for this
	 * servlet and the servlet context.
	 *
	 * Hint: we can't user the application context
	 * when there are configuration beans that require
	 * the servlet context to present.
	 */
	public void setContextFile(URL contextFile)
	{
		this.contextFile = contextFile;
	}

	protected URL contextFile;


	/* protected: initialization */

	@PostConstruct
	protected void register()
	{
		beanTracker.add(this);
	}


	/* protected: servlet handling */

	protected void    createServlet(ServletContext context)
	  throws Throwable
	{
		//~: create the servlet
		final DispatcherServlet s = new DispatcherServlet(
		  createSpringContext(context));

		//~: initialize it
		s.init(createConfig(context));

		//~: assign
		this.servlet = s;

		//~: track this prototype
		beanTracker.add(this);

		LU.debug(LOG, "created Spring ", LU.sig(s), " mapped @[",
		  (path == null)?("/*"):(path + "*"), "]");
	}

	protected volatile DispatcherServlet servlet;

	@PreDestroy
	protected void    destroyServlet()
	{
		synchronized(this)
		{
			if(servlet != null) try
			{
				servlet.destroy();
				LU.debug(LOG, "destructed Spring ", LU.sig(servlet));
			}
			finally
			{
				servlet = null;
			}
		}

		beanTracker.remove(this);
	}

	protected boolean canHandle(FilterTask task)
	{
		return (path == null) ||
		  task.getRequest().getRequestURI().startsWith(path);
	}

	protected final Object LOG = LU.logger(this);


	/* protected: servlet configuration */

	protected WebApplicationContext createSpringContext(ServletContext ctx)
	{
		SpringerWebApplicationContext pswac =
		  (SpringerWebApplicationContext) applicationContext;

		//?: {no file is set} user existing context
		if(contextFile == null) return pswac;

		SpringerWebApplicationContext swac =
		  new SpringerWebApplicationContext(LoadConfigFile.builder(
		    pswac.factoryBuilder.getClassLoader(), contextFile));

		//~: use the application context as the parent
		swac.setParent(applicationContext);

		//~: servlet context
		swac.setServletContext(ctx);

		return swac;
	}

	protected String getServletName()
	{
		return getClass().getSimpleName();
	}

	protected void setServletParams(Map<String, String> m)
	{}

	protected ServletConfig createConfig(ServletContext context)
	{
		//~: servlet parameters
		Map<String, String> m = new HashMap<>();
		setServletParams(m);

		//~: the configuration
		return new ServletConfig()
		{
			public String getServletName()
			{
				return DispatchFilter.this.getServletName();
			}

			public ServletContext getServletContext()
			{
				return context;
			}

			public String getInitParameter(String name)
			{
				return m.get(name);
			}

			public Enumeration<String> getInitParameterNames()
			{
				return Collections.enumeration(m.keySet());
			}
		};
	}
}