package net.java.osgi.embeddy.springer.db;

/* Java */

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.LoadDefault;


/**
 * Database dialect abstraction bridge.
 *
 * @author anton.baukin@gmail.com.
 */
@LoadDefault
public interface Dialect
{
	/* Database Dialect */

	public String getName();

	public Lob    createLob(InputStream i);

	/**
	 * Writes the bytes from the result column value
	 * (given as general object) to the stream.
	 */
	public long   readLob(Object b, OutputStream s)
	  throws SQLException, IOException;

	/**
	 * Returns the best typed object
	 * of the result column value.
	 */
	public Object result(ResultSet rs, ResultSetMetaData m, int c)
	  throws SQLException;
}
