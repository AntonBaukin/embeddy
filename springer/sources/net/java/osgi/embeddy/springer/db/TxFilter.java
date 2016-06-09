package net.java.osgi.embeddy.springer.db;

/* Spring Framework */

import net.java.osgi.embeddy.springer.servlet.FilterTask;
import net.java.osgi.embeddy.springer.servlet.PickedFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: servlet */

import net.java.osgi.embeddy.springer.EX;


/**
 * Filter that opens transactional scopes
 * for certain incoming requests.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class TxFilter extends PickedFilter
{
	/* Filter */

	public void openFilter(FilterTask task)
	{
		EX.assertn(task);

		if(!isTxRequest(task))
			return;

		//~: nest the cycle in the tx-scopes
		context.getBean(TxBean.class).
		  invoke(task::continueCycle);
	}

	public void setContexts(String... contexts)
	{
		this.contexts = contexts;
	}

	protected String[] contexts = new String[0];


	/* protected: filtering */

	@Autowired
	protected ApplicationContext context;

	protected boolean isTxRequest(FilterTask task)
	{
		final String path =
		  task.getRequest().getRequestURI();

		for(String ctx : contexts)
			if(path.startsWith(ctx))
				return true;

		return false;
	}
}