package net.java.osgi.embeddy.app;

/* Spring Framework */

import net.java.osgi.embeddy.springer.servlet.PickFilter;
import org.springframework.stereotype.Component;

/*  embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.servlet.Filter;
import net.java.osgi.embeddy.springer.servlet.FilterTask;


/**
 * Filter that simply redirects
 * to the index page.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @PickFilter(order = 10)
public class IndexFilter implements Filter
{
	public void openFilter(FilterTask task)
	{
		String p = task.getRequest().getRequestURI();

		if(p.isEmpty() || "/".equals(p)) try
		{
			task.getResponse().sendRedirect("/static/index.html");
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}
}