package net.java.osgi.embeddy.app.secure;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/*  embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.servlet.Filter;
import net.java.osgi.embeddy.springer.servlet.FilterTask;
import net.java.osgi.embeddy.springer.servlet.PickFilter;


/**
 * Filter that checks the user web session
 * points actual authentication session.
 * For unknown clients allows only
 * '/login/' pages.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @PickFilter(order = 20)
public class SecFilter implements Filter
{
	/* Filter */

	public void openFilter(FilterTask task)
	{
		//?: {is not a secure resource}
		if(isUnsecure(task))
			return;

		//?: {is a valid user}
		if(isUser(task))
			return;

		try
		{
			//?: {do redirect resource}
			if(isRedirectResource(task))
				task.getResponse().sendRedirect(getRedirectPage(task));
			//!: send unauthorized
			else
				task.getResponse().sendError(401);
			task.doBreak();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}


	/* protected: authentication */

	protected boolean isUnsecure(FilterTask task)
	{
		String p = task.getRequest().getRequestURI();
		return p.contains("/login/");
	}

	protected boolean isRedirectResource(FilterTask task)
	{
		return !isStrictResource(task);
	}

	protected boolean isStrictResource(FilterTask task)
	{
		String uri = task.getRequest().getRequestURI();

		//?: {is not static | system}
		return !uri.contains("/static/") || uri.contains("/system/");
	}

	protected String  getRedirectPage(FilterTask task)
	{
		return "/static/login/index.html";
	}

	protected boolean isUser(FilterTask task)
	{
		//?: {looser security check for static}
		if(!isStrictResource(task))
			return authPoint.isAuthedUser(task, false);

		//~: check with db access
		return isUserTx(task);
	}

	@Transactional
	protected boolean isUserTx(FilterTask task)
	{
		return authPoint.isAuthedUser(task, true);
	}

	@Autowired
	protected AuthPoint authPoint;
}