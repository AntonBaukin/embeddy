package net.java.osgi.embeddy.springer;

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
	public SpringerApplicationContext()
	{
		super(new SpringerBeanFactory());
	}

	public SpringerApplicationContext(DefaultListableBeanFactory f)
	{
		super(f);
	}
}