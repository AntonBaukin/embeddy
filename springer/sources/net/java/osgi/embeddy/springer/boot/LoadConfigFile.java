package net.java.osgi.embeddy.springer.boot;

/* Java */

import java.net.URL;
import java.util.function.Consumer;

/* SAX */

import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.xml.sax.InputSource;

/* Spring Framework */

import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.xml.XmlBeanDefinitionReader;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.support.SetLoader;


/**
 * Loads XML configuration file and exports
 * the configuration into Bean Factory.
 *
 * @author anton.baukin@gmail.com.
 */
public class LoadConfigFile implements Consumer<BeanDefinitionRegistry>
{
	public LoadConfigFile(URL file)
	{
		this.file = file;
	}

	public final URL file;


	/* Load */

	public void accept(BeanDefinitionRegistry beanFactory)
	{
		//?: {file is not given}
		if(file == null) return;

		XmlBeanDefinitionReader reader =
		  new XmlBeanDefinitionReader(beanFactory);

		//~: do the validations
		reader.setValidationModeName("VALIDATION_XSD");

		//~: load the definitions
		try
		{
			reader.loadBeanDefinitions(new InputSource(
			  file.toURI().toString()));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error file loading Spring ",
			  "application context resource [", file, "]!"
			);
		}
	}


	/* Statics */

	public static BeanFactoryBuilder builder(SpringerClassLoader scl, URL config)
	{
		return new BeanFactoryBuilder()
		{
			public DefaultListableBeanFactory buildFactory(BeanFactory p)
			{
				return new SetLoader(scl).run(() ->
				{
					SpringerBeanFactory bf = new SpringerBeanFactory(p);

					//~: load beans from xml
					new LoadConfigFile(config).accept(bf);

					return bf;
				});
			}

			public SpringerClassLoader getClassLoader()
			{
				return scl;
			}
		};
	}
}