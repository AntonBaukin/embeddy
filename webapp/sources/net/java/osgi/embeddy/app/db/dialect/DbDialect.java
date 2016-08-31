package net.java.osgi.embeddy.app.db.dialect;

/* Java */

import java.sql.Connection;
import java.sql.SQLException;

/* C3p0 */

import com.mchange.v2.c3p0.AbstractComboPooledDataSource;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.boot.LoadDefault;
import net.java.osgi.embeddy.springer.db.Dialect;
import net.java.osgi.embeddy.springer.db.Lob;


/**
 * Abstracts database dialect.
 *
 * @author anton.baukin@gmail.com.
 */
@LoadDefault
public interface DbDialect extends Dialect
{
	/* Database Initialization */

	/**
	 * Returns class name of the driver.
	 */
	public String     driver();

	public void       start();

	public void       close();

	public String     getDbURL();

	/**
	 * Creates direct driver database connection.
	 */
	public Connection connect();

	/**
	 * Initializes the database with the given connection.
	 * Warning! This operation repeats on each start!
	 */
	public void       init(Connection c)
	  throws SQLException;

	/**
	 * Initializes the given data source before starting it.
	 */
	public void       init(AbstractComboPooledDataSource ds);

	/**
	 * Executes test on the provided connection.
	 */
	public void       test(Connection c)
	  throws SQLException;
}