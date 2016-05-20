package net.java.osgi.embeddy.boot;

/* Java */

import java.util.zip.ZipFile;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.ziper.ZiPArchive;
import net.java.osgi.embeddy.boot.ziper.ZiPStorage;


/**
 * Coordinating strategy of the boot stage.
 *
 * @author anton.baukin@gmail.com.
 */
public interface BootSet
{
	/* Boot Set */

	public String      getBootPath();

	public String      getBundlesPath();

	public ClassLoader getInitialLoader();

	/**
	 * Returns property from application Manifest file.
	 */
	public String      manifested(String name);

	/**
	 * Returns OSGi configuration parameter.
	 */
	public String      get(String name);

	/**
	 * Updates OSGi configuration parameter.
	 */
	public void        set(String name, String property);

	public ZiPArchive  getRootArchive();

	public ZipFile     getRootZip();

	public ZiPStorage  createTempStorage();
}