package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.lang.annotation.Annotation;
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
import net.java.osgi.embeddy.springer.boot.AutoAwire;
import net.java.osgi.embeddy.springer.support.BeanTracker;


/**
 * Bridge to Spring {@link DispatcherServlet}.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class DispatchFilter implements Filter, AutoAwire
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

	public void closeFilter(FilterTask task)
	{}

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

	@Autowired
	protected ApplicationContext applicationContext;

	public PickFilter pickFilter()
	{
		return pickFilter;
	}

	protected PickFilter pickFilter;

	@Autowired
	protected BeanTracker beanTracker;


	/* protected: initialization */

	@PostConstruct
	protected void register()
	{
		beanTracker.add(this);
	}


	/* Autowire Aware */

	public void autowiredAnnotations(Object injector, Annotation[] ans)
	{
		this.callMe(injector, ans);

		for(Annotation a : ans)
			if(a instanceof PickFilter)
				this.pickFilter = (PickFilter) a;
	}

	/* protected: servlet handling */

	protected void    createServlet(ServletContext context)
	  throws Throwable
	{
		//~: create the servlet
		final DispatcherServlet s = new DispatcherServlet(
		  (WebApplicationContext) applicationContext);

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

	protected String        getServletName()
	{
		return getClass().getSimpleName();
	}

	protected void          setServletParams(Map<String, String> m)
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