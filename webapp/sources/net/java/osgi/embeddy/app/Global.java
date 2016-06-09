package net.java.osgi.embeddy.app;

/* Java Annotations */

import javax.annotation.PostConstruct;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.db.TxBean;
import net.java.osgi.embeddy.springer.jsx.JsX;
import net.java.osgi.embeddy.springer.servlet.DispatchFilter;
import net.java.osgi.embeddy.springer.servlet.FiltersGlobalPoint;
import net.java.osgi.embeddy.springer.servlet.FiltersServlet;
import net.java.osgi.embeddy.springer.servlet.PickFilter;
import net.java.osgi.embeddy.springer.servlet.ProxyFilter;
import net.java.osgi.embeddy.springer.servlet.ServletBridge;
import net.java.osgi.embeddy.springer.support.CallMe;


/**
 * Global definitions of the application.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class Global
{
	@Autowired
	public ApplicationContext context;

	/**
	 * Placeholder for filter that
	 * wraps the filters chain into
	 * transactional scopes.
	 */
	@Autowired @PickFilter(order = 50)
	public ProxyFilter txFilter;

	/**
	 * Placeholder for filter that serves
	 * requests to JsX engine.
	 */
	@Autowired @PickFilter(order = 90)
	public ProxyFilter jsFilter;

	/**
	 * Wrapper for Spring Dispatcher servlet.
	 */
	@Autowired @PickFilter(order = 100)
	@CallMe("setSpringDispatcher")
	public DispatchFilter springDispatcher;

	private void setSpringDispatcher(DispatchFilter df)
	{
		df.setContextFile(this.getClass().
		  getResource("/META-INF/dispatcherContext.xml"));
	}

	/**
	 * Collection of all filters.
	 */
	@Autowired
	public FiltersGlobalPoint filters;

	/**
	 * Global servlet is responsible for handling
	 * all the requests via the filter chains.
	 */
	@Autowired @CallMe("setGlobalServlet")
	public ServletBridge servletBridge;

	private void setGlobalServlet(ServletBridge sb)
	{
		sb.setPath("/");
		sb.setServlet(new FiltersServlet(filters));
	}

	/**
	 * Scripting engine for the utilities.
	 */
	@Autowired
	public JsX jsX;

	@PostConstruct
	protected void setJsX()
	{
		jsX.setLoader(getClass().getClassLoader());

		//~: set scripting roots
		jsX.setRoots(
		  "net.java.osgi.embeddy.springer.jsx " +
		  "net.java.osgi.embeddy.app"
		);

		//~: initialize the database
		context.getBean(TxBean.class).invoke(() ->
		  jsX.apply("/db/init.js", "init"));
	}
}