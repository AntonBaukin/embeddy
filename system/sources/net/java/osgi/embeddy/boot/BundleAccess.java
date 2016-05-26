package net.java.osgi.embeddy.boot;

/* Java */

import java.net.URL;

/* OSGi */

import org.osgi.framework.Bundle;


/**
 * Implements framework dependent utilities
 * to access various aspects of the bundles.
 * Exact version of class is defined with
 * net.java.osgi.embeddy.boot.BundleAccess
 * Java service.
 *
 * @author anton.baukin@gmail.com.
 */
public interface BundleAccess
{
	/* Bundle Access */

	/**
	 * Returns absolute resource URL with file or JAR schemas.
	 * Note that ordinary resource access for a bundle may
	 * return some version of a virtual URLs system, such
	 * as starting with 'bundle://' schema.
	 */
	public URL getBundleResource(Bundle bundle, URL url);
}