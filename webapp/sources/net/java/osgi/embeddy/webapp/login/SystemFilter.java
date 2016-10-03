package net.java.osgi.embeddy.webapp.login;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/*  embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.servlet.Filter;
import net.java.osgi.embeddy.springer.servlet.FilterTask;
import net.java.osgi.embeddy.springer.servlet.PickFilter;
import net.java.osgi.embeddy.springer.servlet.PickedFilter;


/**
 * Filter that checks the access rights ('su' role)
 * for resources that have '/system/' path.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class SystemFilter extends PickedFilter
{
	/* Filter */

	public void openFilter(FilterTask task)
	{
		//?: {is not a system resource}
		if(!task.getRequest().getRequestURI().contains("/system/"))
			return;

		//sec: {user has 'su' role}
		if(!context.getBean(AuthBean.class).role("su")) try
		{
			task.getResponse().sendError(403);
			task.doBreak();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	@Autowired
	protected ApplicationContext context;
}