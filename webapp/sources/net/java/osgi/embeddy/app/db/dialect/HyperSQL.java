package net.java.osgi.embeddy.app.db.dialect;

/* Java */

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.sql.Blob;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;

/* C3p0 */

import com.mchange.v2.c3p0.AbstractComboPooledDataSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.db.Lob;
import net.java.osgi.embeddy.springer.db.LobStd;


/**
 * Dialect of Hypersonic SQL embedded database.
 *
 * @author anton.baukin@gmail.com.
 */
public class HyperSQL extends DialectBase
{
	/* Database Initialization */

	public String     driver()
	{
		return "org.hsqldb.jdbc.JDBCDriver";
	}

	public void       start()
	{
		String s = EX.asserts(System.getProperty(
		 "org.osgi.framework.storage"));

		try //~: create database directory in the storage
		{
			File f = new File(s, "db");

			if(!f.exists())
				EX.assertx(f.mkdir());

			EX.assertx(f.exists() && f.isDirectory() && f.canWrite());

			this.dbfile = new File(f, "app").toURI();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while creating database ",
			  "directory [db] in OSGi storage [", s, "]!");
		}
	}

	public void       close()
	{
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
			throw EX.wrap(e, "Error while shutting down ",
			  "embedded HyperSQL database!");
		}
	}

	public String     getDbURL()
	{
		return "jdbc:hsqldb:" + EX.assertn(dbfile);
	}

	private URI dbfile;

	public Connection connect()
	{
		try
		{
			return DriverManager.getConnection(getDbURL(), "SA", "");
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while connecting HyperSQL database!");
		}
	}

	public void       init(Connection c)
	  throws SQLException
	{
		populate(c, "hsqldb.sql");
	}

	public void       init(AbstractComboPooledDataSource ds)
	{
		ds.setUser("SA");   //<-- default user
		ds.setPassword(""); //<-- empty password
	}

	public void       test(Connection c)
	  throws SQLException
	{
		try(Statement s = c.createStatement())
		{
			s.execute("select 1 from INFORMATION_SCHEMA.SYSTEM_USERS");
		}
	}


	/* Database Dialect */

	public Lob        createLob(InputStream i)
	{
		return new LobStd(i);
	}

	public long       readLob(Object b, OutputStream s)
	  throws SQLException, IOException
	{
		//?: {no content}
		if(b == null) return 0L;

		try(InputStream i = ((Blob)b).getBinaryStream())
		{
			byte x[] = new byte[512];
			long z   = 0L;

			for(int w;(w = i.read(x)) > 0;z += w)
				s.write(x, 0, w);

			return z;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
		finally
		{
			//!: free the blob
			((Blob)b).free();
		}
	}

	public Object     result(ResultSet rs, ResultSetMetaData m, int c)
	  throws SQLException
	{
		return rs.getObject(c);
	}
}