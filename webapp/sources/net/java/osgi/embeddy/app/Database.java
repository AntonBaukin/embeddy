package net.java.osgi.embeddy.app;

/* Java */

import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

import javax.sql.DataSource;

/* Spring Framework */

import com.mchange.v2.c3p0.ComboPooledDataSource;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/* C3p0 */

import com.mchange.v2.c3p0.PooledDataSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Inionitializes and starts in-process
 * HyperSQL database.
 *
 * @author anton.baukin@gmail.com.
 */
public final class Database
{
	public static final Database
	  INSTANCE = new Database();

	private Database()
	{}


	/* Database Access */

	public void       start()
	{
		String s = EX.asserts(System.getProperty(
		 "org.osgi.framework.storage"));

		//~: create database directory in the storage
		try
		{
			File f = new File(s, "db");

			if(!f.exists())
				EX.assertx(f.mkdir());

			EX.assertx(f.exists() && f.isDirectory() && f.canWrite());

			this.dbfile = f.toURI();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while creating database ",
			  "directory [db] in OSGi storage [", s, "]!");
		}

		//~: make the initial connection
		try(Connection c = connect())
		{
			initDatabase(c);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while opening initial ",
			  "connection to embedded HyperSQL database!");
		}

		//~: create the data source
		this.dataSource = createDataSource();
	}

	public void       close()
	{
		RuntimeException error = null;

		try
		{
			//~: close the data source
			if(dataSource instanceof PooledDataSource)
				((PooledDataSource)dataSource).close();
		}
		catch(Throwable e)
		{
			error = EX.wrap(e, "Error while closing ",
			  "pooled Data Source!");
		}
		finally
		{
			dataSource = null;

			//~: shutdown the database
			try(Connection c = connect())
			{
				try(Statement s = c.createStatement())
				{
					s.execute("shutdown");
				}
			}
			catch(Throwable e)
			{
				error =  EX.wrap(e, "Error while shutting down ",
				  "embedded HyperSQL database!");
			}
		}

		if(error != null)
			throw error;
	}

	public Connection connect()
	{
		EX.assertn(dbfile);

		if(dbcClass == null) try
		{
			dbcClass = Class.forName("org.hsqldb.jdbc.JDBCDriver");
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while loading HyperSQL database driver!");
		}

		try
		{
			return DriverManager.getConnection(getDbURL(), "SA", "");
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while connecting HyperSQL database!");
		}
	}

	public DataSource getDataSource()
	{
		return dataSource;
	}

	public String getDbURL()
	{
		return "jdbc:hsqldb:" + dbfile;
	}

	private DataSource dataSource;

	private Class<?> dbcClass;

	private URI dbfile;


	/* private: initialization */

	private void       initDatabase(Connection c)
	  throws SQLException
	{
		DefaultResourceLoader rl = new DefaultResourceLoader(
		  this.getClass().getClassLoader());

		ResourceDatabasePopulator dp =
		  new ResourceDatabasePopulator();

		//~: add single SQL file for HyperSQL
		dp.addScript(rl.getResource("classpath:" +
		  this.getClass().getPackage().getName().replace('.', '/') +
		  "/hsqldb.sql"
		));

		dp.populate(c);
	}

	private DataSource createDataSource()
	{
		try
		{
			Properties ps = new Properties();

			URL pu = this.getClass().getClassLoader().
			  getResource("/META-INF/c3p0.xml");

			//~: load the properties
			if(pu == null) throw EX.ass();
			try(InputStream is = pu.openStream())
			{
				ps.loadFromXML(is);
			}

			//~: data source (private)
			ComboPooledDataSource ds =
			  new ComboPooledDataSource();

			//~: assign the proeprties
			ds.setProperties(ps);

			//~: the driver
			ds.setDriverClass(dbcClass.getName());

			//~: user + password
			ds.setUser("SA");
			ds.setPassword("");

			//~: database url
			ds.setJdbcUrl(getDbURL());

			//~: test the source
			testDataSource(ds);

			return ds;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while creating C3P0 Data Source!");
		}
	}

	private void       testDataSource(DataSource ds)
	  throws SQLException
	{
		try(Connection c = ds.getConnection())
		{
			try(Statement s = c.createStatement())
			{
				s.execute("select 1 from INFORMATION_SCHEMA.SYSTEM_USERS");
			}
		}
	}
}