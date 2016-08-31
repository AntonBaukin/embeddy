package net.java.osgi.embeddy.app;

/* Java */

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

/* Spring Framework */

import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.db.Dialect;
import net.java.osgi.embeddy.springer.db.Lob;


/**
 * Bridge to the database dialect instance.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class DatabaseDialect implements Dialect
{
	/* Database Dialect */

	public String getName()
	{
		return Database.INSTANCE.dialect().getName();
	}

	public Lob    createLob(InputStream i)
	{
		return Database.INSTANCE.dialect().createLob(i);
	}

	public long   readLob(Object v, OutputStream s)
	  throws SQLException, IOException
	{
		return Database.INSTANCE.dialect().readLob(v, s);
	}

	public Object result(ResultSet rs, ResultSetMetaData m, int c)
	  throws SQLException
	{
		return Database.INSTANCE.dialect().result(rs, m, c);
	}
}