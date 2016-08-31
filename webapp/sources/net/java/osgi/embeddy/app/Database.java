package net.java.osgi.embeddy.app;

/* Java */


import java.io.InputStream;
import java.net.URL;
import java.sql.Connection;
import java.util.Properties;
import javax.sql.DataSource;

/* Spring Framework */

import com.mchange.v2.c3p0.ComboPooledDataSource;

/* C3p0 */

import com.mchange.v2.c3p0.PooledDataSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.LU;
import net.java.osgi.embeddy.springer.boot.LoadDefault;

/* application */

import net.java.osgi.embeddy.app.db.dialect.DbDialect;
import net.java.osgi.embeddy.app.db.dialect.PostgreSQL;
import net.java.osgi.embeddy.app.db.dialect.HyperSQL;


/**
 * Initializes and starts in-process HyperSQL
 * database or connects to external Postgres
 * SQL database server.
 *
 * @author anton.baukin@gmail.com.
 */
@LoadDefault
public final class Database
{
	public static final Database
	  INSTANCE = new Database();

	private Database()
	{}


	/* Database Access */

	public DbDialect  dialect()
	{
		return this.dialect;
	}

	private DbDialect dialect;

	public void       start()
	{
		//~: select the dialect
		dialect = selectDialect();
		LU.info(LOG, "selected database dialect: ",
		  dialect.getClass().getSimpleName());

		try //~: probe for thr driver class
		{
			LU.debug(LOG, "native driver class: ", dialect.driver());
			Class.forName(dialect.driver());
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while loading database driver [",
			  dialect.driver(), "]!");
		}

		//~: start the database
		dialect.start();

		//~: make the initial connection
		try(Connection c = dialect.connect())
		{
			dialect.init(c);
			LU.info(LOG, "have initialized the database!");
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while opening initial ",
			  "connection and creating database schema!");
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
				((PooledDataSource) dataSource).close();
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
			try
			{
				dialect.close();
			}
			catch(Throwable e)
			{
				error = EX.wrap(e, "Error while shutting down the database!");
			}
		}

		if(error != null)
			throw error;
	}

	public DataSource getDataSource()
	{
		return dataSource;
	}


	/* protected: connectivity */

	protected DbDialect  selectDialect()
	{
		//?: {postgres}
		PostgreSQL pg = new PostgreSQL();
		if(pg.getDbURL() != null)
			return pg;

		//~: fallback to the embedded database
		return new HyperSQL();
	}

	protected DataSource createDataSource()
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
			ds.setDriverClass(dialect.driver());

			//~: database url
			ds.setJdbcUrl(dialect.getDbURL());
			LU.info(LOG, "using database URL: ", dialect.getDbURL());

			//~: callback to the dialect
			dialect.init(ds);

			//~: test the source
			LU.debug(LOG, "testing the database connection...");
			try(Connection c = ds.getConnection())
			{
				dialect.test(c);
			}

			return ds;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while creating C3P0 Data Source!");
		}
	}

	private DataSource dataSource;

	protected Object LOG = LU.logger(this.getClass());
}