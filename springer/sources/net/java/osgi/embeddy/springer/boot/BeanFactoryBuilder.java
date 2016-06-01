package net.java.osgi.embeddy.springer.boot;

/**
 * Strategy to create and initialize
 * Spring Bean Factory.
 *
 * @author anton.baukin@gmail.com.
 */
public interface BeanFactoryBuilder
{
	/* Bean Factory Builder */

	public Object  buildFactory(Object parent);

	default Object buildFactory()
	{
		return this.buildFactory(null);
	}
}
