package net.java.osgi.embeddy.springer.boot;

/* Spring Framework */

import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;


/**
 * Strategy to create and initialize
 * Spring Bean Factory.
 *
 * @author anton.baukin@gmail.com.
 */
public interface BeanFactoryBuilder
{
	/* Bean Factory Builder */

	public DefaultListableBeanFactory buildFactory(BeanFactory parent);
}
