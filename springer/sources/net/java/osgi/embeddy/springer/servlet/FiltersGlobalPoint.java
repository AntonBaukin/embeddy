package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.util.ArrayList;
import java.util.Map;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;


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
		ArrayList<Filter>   fs = new ArrayList<>();
		Map<String, Object> bs = context.
		  getBeansWithAnnotation(PickFilter.class);

		for(Map.Entry<String, Object> e : bs.entrySet())
		{
			//?: {not a filter}
			EX.assertx(e.getValue() instanceof Filter,
			  "Bean [", e.getKey(), "] is not a Filter!");

			fs.add((Filter) e.getValue());
		}

		if(fs.isEmpty()) LU.warn(LU.logger(this),
		  "No web filters marked with @PickFilter were found!");

		return fs.toArray(new Filter[fs.size()]);
	}

	@Autowired
	protected ApplicationContext context;
}