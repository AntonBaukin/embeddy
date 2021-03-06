package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.support.BeanTracker;

/**
 * Collects all filters registered as
 * Spring beans via @PickFilter.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class FiltersGlobalPoint extends FiltersPointBase
{
	/* protected: filters discovery */

	protected Filter[] collectFilters()
	{
		HashSet<Filter> fs = new HashSet<>();

		//~: collect singleton filters
		fs.addAll(context.getBeansOfType(
			 Filter.class, false, true).values());

		//~: collect prototype beans
		beanTracker.iterate(o ->
		{
			if(o instanceof Filter)
				fs.add((Filter) o);
			return false;
		});

		//~: remove not of that
		for(Iterator<Filter> i = fs.iterator();(i.hasNext());)
		{
			Filter f = i.next();

			//~: check instance-level
			PickFilter pf = f.pickFilter();

			//?: {check the class-level}
			if(pf == null)
				pf = f.getClass().
				  getAnnotation(PickFilter.class);

			//?: {not annotated}
			if(pf == null)
				i.remove();
		}

		if(fs.isEmpty()) LU.warn(LU.logger(this),
		  "No web filters marked with @PickFilter were found!");

		return fs.toArray(new Filter[fs.size()]);
	}

	@Autowired
	protected ApplicationContext context;

	@Autowired
	protected BeanTracker beanTracker;
}