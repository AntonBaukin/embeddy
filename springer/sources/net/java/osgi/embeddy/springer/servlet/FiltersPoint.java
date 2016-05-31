package net.java.osgi.embeddy.springer.servlet;

/**
 * Strategy to access filters.
 *
 * @author anton.baukin@gmail.com.
 */
public interface FiltersPoint
{
	/* Filters Point */

	public Filter[] getFilters(FilterStage stage);
}