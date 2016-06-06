package net.java.osgi.embeddy.springer.servlet;

/* Java */

import java.lang.annotation.Annotation;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.AutoAwire;


/**
 * Filter base that is {@link AutoAwire}
 * with dynamic {@link PickFilter}.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public abstract class PickedFilter implements Filter, AutoAwire
{
	/* Picked Filter */

	public PickFilter pickFilter()
	{
		return pickFilter;
	}

	protected PickFilter pickFilter;


	/* Autowire Aware */

	public void autowiredAnnotations(Object injector, Annotation[] ans)
	{
		this.callMe(injector, ans);

		for(Annotation a : ans)
			if(a instanceof PickFilter)
				this.pickFilter = (PickFilter) a;
	}
}