package net.java.osgi.embeddy.app;

/* Java */

import javax.sql.DataSource;

/* Spring Framework */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

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
	public DataSource dataSource()
	{
		ClassLoader cl = AppConfig.class.
		  getClassLoader().getParent();

		try
		{
			Class<?> c = cl.loadClass(
			  "net.java.osgi.embeddy.app.Database");

			Object db = c.getField("INSTANCE").get(null);

			return (DataSource) EX.assertn(db.getClass().
			  getMethod("getDataSource").invoke(db));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	@Bean
	public PlatformTransactionManager transactionManager()
	{
		return new DataSourceTransactionManager(
		  EX.assertn(dataSource()));
	}
}