package net.java.osgi.embeddy.springer.boot;

/* Spring Framework */

import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;


/**
 * Special version of Spring Application Context
 * to provide enhancements to Spring internals.
 *
 * @author anton.baukin@gmail.com.
 */
public class   SpringerApplicationContext
       extends AnnotationConfigApplicationContext
{
	public SpringerApplicationContext(BeanFactoryBuilder builder)
	{
		super((DefaultListableBeanFactory) builder.buildFactory());
	}
}