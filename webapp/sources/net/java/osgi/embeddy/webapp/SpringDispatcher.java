package net.java.osgi.embeddy.webapp;

/* Spring Framework */

import net.java.osgi.embeddy.springer.servlet.PickFilter;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.servlet.DispatchFilter;


/**
 * Filter to user for Spring Dispatcher Servlet.
 *
 * TODO make Spring Dispatcher be Global field
 *
 * @author anton.baukin@gmail.com.
 */
@Component @PickFilter(order = 10)
public class SpringDispatcher extends DispatchFilter
{}