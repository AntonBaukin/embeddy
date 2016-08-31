package net.java.osgi.embeddy.app;

/* Java */

import javax.sql.DataSource;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;

/* application */

import net.java.osgi.embeddy.app.db.DbFiles;
import net.java.osgi.embeddy.app.db.FilesStore;
import net.java.osgi.embeddy.app.db.LocalFiles;


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
		return Database.INSTANCE.getDataSource();
	}

	@Bean
	public PlatformTransactionManager transactionManager()
	{
		return new DataSourceTransactionManager(
		  EX.assertn(dataSource()));
	}

	@Bean
	public FilesStore filesStore()
	{
		FilesStore fs;

		//?: {use file system storage}
		if(System.getProperty("files.storage") != null)
		{
			fs = context.getBean(LocalFiles.class);

			//!: start the storage
			((LocalFiles) fs).init(
			  System.getProperty("files.storage"));
		}
		//!: store in the database
		else
			fs = context.getBean(DbFiles.class);

		return fs;
	}

	@Autowired
	public ApplicationContext context;
}