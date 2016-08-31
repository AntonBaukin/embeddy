package net.java.osgi.embeddy.springer.db;

/* Java */

import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.LoadDefault;


/**
 * Large binary data wrapper.
 * Implemented by a Dialect.
 *
 * @author anton.baukin@gmail.com.
 */
@LoadDefault
public interface Lob extends AutoCloseable
{
	/* Large Object Wrapper */

	/**
	 * Assigns parameter to the statement.
	 */
	public void set(PreparedStatement s, int c)
	  throws SQLException, IOException;
}