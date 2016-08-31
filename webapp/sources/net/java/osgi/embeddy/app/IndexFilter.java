package net.java.osgi.embeddy.app;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.servlet.Filter;
import net.java.osgi.embeddy.springer.servlet.FilterTask;
import net.java.osgi.embeddy.springer.servlet.PickFilter;

/* application: secure*/

import net.java.osgi.embeddy.app.secure.AuthPoint;


/**
 * Filter that simply redirects
 * to the index page.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @PickFilter(order = 10)
public class IndexFilter implements Filter
{
	public void    openFilter(FilterTask task)
	{
		String p = task.getRequest().getRequestURI();

		if(p.isEmpty() || "/".equals(p)) try
		{
			sendRedirect(task);
			task.doBreak();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	@Transactional
	protected void sendRedirect(FilterTask task)
	  throws Throwable
	{
		String p = null;

		//?: {is a valid user} go to index
		if(authPoint.isAuthedUser(task, true))
			p = authPoint.getIndexPage(task);

		//?: {invoke with the default page}
		if(p == null)
			p = "/static/login/index.html";

		//~: do redirect
		task.getResponse().sendRedirect(p);
	}

	@Autowired
	protected AuthPoint authPoint;
}