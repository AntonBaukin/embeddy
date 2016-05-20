package net.java.osgi.embeddy.boot;

/* Java */

import java.io.File;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLConnection;

/* OSGi */

import org.osgi.framework.Bundle;

/* embeddy: core */

import net.java.osgi.embeddy.EX;


/**
 * Implements framework-dependent utilities
 * to access various aspects of the bundles.
 *
 * @author anton.baukin@gmail.com.
 */
public class BundleAccess
{
	/**
	 * Returns absolute resource URL with file or jar schemas.
	 * Note that ordinary resource access for a bundle may
	 * return some version of a virtual URLs system.
	 */
	public static URL getBundleResource(Bundle bundle, URL url)
	{
		if(bundle.getClass().getName().startsWith(PACKAGE_KF))
			return getKFBundleResource(bundle, url);

		throw EX.state("Can't get resource of unknown Bundle ",
		  "implementation [", bundle.getClass().getName(), "]!");
	}


	/* protected: Knopflerfish Framework */

	protected static final String PACKAGE_KF =
	  "org.knopflerfish.framework.";

	/**
	 * This brutal force implementation violates private
	 * access to Knopflerfish internals. It is tested
	 * to work with file-based bundles storage.
	 */
	protected static URL getKFBundleResource(Bundle bundle, URL url)
	{
		String path = url.getPath();
		if(path.startsWith("/"))
			path = path.substring(1);
		EX.asserts(path);

		try
		{
			//~: open special connection
			URLConnection c = url.openConnection();

			//?: {has no archive accessor}
			if(getKFBundleArchive == null)
			{
				getKFBundleArchive = c.getClass().getDeclaredMethod("getBundleArchive");
				getKFBundleArchive.setAccessible(true);
			}

			//~: access BundleArchive class
			Object ba = getKFBundleArchive.invoke(c);

			if(getKFJarLocation == null)
			{
				getKFJarLocation = ba.getClass().getMethod("getJarLocation");
				getKFJarLocation.setAccessible(true);
			}

			//~: content root location (directory of zip archive)
			String root = EX.asserts((String) getKFJarLocation.invoke(ba));
			File   file = new File(root);
			EX.assertx(file.exists(), "Can't find Bundle root archive [", root, "]!");

			//?: {is a directory}
			if(file.isDirectory())
			{
				file = new File(file, path);
				EX.assertx(file.exists(), "Can't find Bundle resource [",
				  path, "] in root archive [", root, "]!");

				return file.toURI().toURL();
			}

			//~: assume it is within the jar
			return new URL(String.format("jar:%s!/%s",
			  file.toURI().toString(), path));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Can't access Knopflerfish-specific URL for path !");
		}
	}

	protected static Method getKFBundleArchive;
	protected static Method getKFJarLocation;
}