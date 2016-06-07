package net.java.osgi.embeddy.app;

/* Java */

import javax.sql.DataSource;

/* Spring Framework */

import net.java.osgi.embeddy.springer.support.SetLoader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Configuration of the application.
 *
 * @author anton.baukin@gmail.com.
 */
@Configuration
public class AppConfig
{
	/**
	 * Warning! This class is loaded with Springer
	 * class loader that resolves all the classes
	 * in the packages of interest (as this one).
	 *
	 * We can't access directly class variable
	 * {@link Database#INSTANCE}!
	 */
	@Bean
	public DataSource getDataSource()
	{
		ClassLoader cl = AppConfig.class.
		  getClassLoader().getParent();

		try
		{
			Class<?> c = cl.loadClass(
			  "net.java.osgi.embeddy.app.Database");

			Object db = c.getField("INSTANCE").get(null);

			return (DataSource) db.getClass().
			  getMethod("getDataSource").invoke(db);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}
}