package net.java.osgi.embeddy.app;

/* Spring Framework */

import net.java.osgi.embeddy.springer.servlet.ProxyFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.servlet.DispatchFilter;
import net.java.osgi.embeddy.springer.servlet.FiltersGlobalPoint;
import net.java.osgi.embeddy.springer.servlet.FiltersServlet;
import net.java.osgi.embeddy.springer.servlet.PickFilter;
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
	@Autowired @PickFilter(order = 90)
	public ProxyFilter jsFilter;

	@Autowired @PickFilter(order = 100)
	@CallMe("setSpringDispatcher")
	public DispatchFilter springDispatcher;

	private void setSpringDispatcher(DispatchFilter df)
	{
		df.setContextFile(this.getClass().
		  getResource("/META-INF/dispatcherContext.xml"));
	}

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
}