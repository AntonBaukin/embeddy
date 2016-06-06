package net.java.osgi.embeddy.springer.servlet;

/* Java Annotations */

import javax.annotation.PostConstruct;

/* Java Servlet */

import javax.annotation.PreDestroy;
import javax.servlet.ServletContext;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.support.BeanTracker;


/**
 * Picked Filter that wraps else filter that
 * is dynamically assigned and revoked. Is a
 * placeholder in the global filters chain.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("prototype")
public class ProxyFilter extends PickedFilter
{
	public void openFilter(FilterTask task)
	{
		final Filter f = this.filter;
		if(f != null)
			f.openFilter(task);
	}

	public void closeFilter(FilterTask task)
	{
		final Filter f = this.filter;
		if(f != null)
			f.closeFilter(task);
	}

	public void setServletContext(ServletContext ctx)
	{
		final Filter f = this.filter;
		if(f != null)
			f.setServletContext(ctx);
	}


	/* protected: initialization */

	@Autowired
	protected BeanTracker beanTracker;

	@PostConstruct
	protected void register()
	{
		beanTracker.add(this);
	}

	@PreDestroy
	protected void close()
	{
		beanTracker.remove(this);
	}


	/* Filter Proxy */

	public void setFilter(Filter filter)
	{
		this.filter = filter;
	}

	protected volatile Filter filter;
}