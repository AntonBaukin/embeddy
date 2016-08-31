package net.java.osgi.embeddy.app.db.dialect;

/* Java */

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/* C3p0 */

import com.mchange.v2.c3p0.AbstractComboPooledDataSource;

/* Spring Framework */

import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/* embeddy:springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Shared behaviour of dialects.
 *
 * @author anton.baukin@gmail.com.
 */
public abstract class DialectBase implements DbDialect
{
	/* Database Initialization */

	public String     getName()
	{
		return this.getClass().getSimpleName();
	}

	public void       start()
	{}

	public void       close()
	{}

	public Connection connect()
	{
		try
		{
			return DriverManager.getConnection(getDbURL());
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while connecting database by [",
			  getDbURL(), "]!");
		}
	}

	public void       init(AbstractComboPooledDataSource ds)
	{}

	public void       test(Connection c)
	  throws SQLException
	{
		try(Statement s = c.createStatement())
		{
			s.execute("select 1");
		}
	}


	/* protected: dialect helpers */

	/**
	 * Runs script resource located in the same
	 * package as the dialect class is.
	 */
	protected void populate(Connection c, String script)
	  throws SQLException
	{
		DefaultResourceLoader rl = new DefaultResourceLoader(
		  this.getClass().getClassLoader());

		ResourceDatabasePopulator dp =
		  new ResourceDatabasePopulator();

		//~: add single sql file
		dp.addScript(rl.getResource("classpath:" +
		  this.getClass().getPackage().getName().
		  replace('.', '/') + "/" + script
		));

		dp.populate(c);
	}
}