package net.java.osgi.embeddy.webapp;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.servlet.FiltersGlobalPoint;
import net.java.osgi.embeddy.springer.servlet.FiltersServlet;
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
	public FiltersGlobalPoint filters;

	/**
	 * Global servlet is responsible for handling
	 * all the requests via the filter chains.
	 */
	@Autowired @CallMe("setGlobalServlet")
	public ServletBridge servlet;

	private void setGlobalServlet(ServletBridge sb)
	{
		sb.setPath("/");
		sb.setServlet(new FiltersServlet(filters));
	}
}