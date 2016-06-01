package net.java.osgi.embeddy.springer.boot;

/* Spring Framework */

import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;


/**
 * Variant of {@link SpringerApplicationContext}
 * for OSGi applications having HTTP Service.
 *
 * @author anton.baukin@gmail.com.
 */
public class   SpringerWebApplicationContext
       extends AnnotationConfigWebApplicationContext
{
	public SpringerWebApplicationContext(BeanFactoryBuilder builder)
	{
		this.factoryBuilder = builder;
	}

	protected final BeanFactoryBuilder factoryBuilder;


	/* protected: RefreshableApplicationContext */

	protected DefaultListableBeanFactory createBeanFactory()
	{
		return (DefaultListableBeanFactory) factoryBuilder.
		  buildFactory(getInternalParentBeanFactory());
	}
}