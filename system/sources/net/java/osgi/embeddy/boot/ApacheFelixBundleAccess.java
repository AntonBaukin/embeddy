package net.java.osgi.embeddy.boot;

/* Java */

import java.net.URL;
import java.util.List;

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.wiring.BundleRevision;
import org.osgi.framework.wiring.BundleRevisions;

/* Apache Felix Framework */

import org.apache.felix.framework.BundleRevisionImpl;
import org.apache.felix.framework.cache.Content;

/* embeddy: core */

import net.java.osgi.embeddy.EX;


/**
 * Bundle utilities specific for
 * Apache Felix OSGi framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class ApacheFelixBundleAccess implements BundleAccess
{
	/* Bundle Access */

	public URL getBundleResource(Bundle bundle, URL url)
	{
		List<BundleRevision> rs = bundle.adapt(
		  BundleRevisions.class).getRevisions();

		//?: {illegal number of revisions}
		EX.assertx(rs.size() == 1, "Bundle [",
		  "Bundle [", bundle.getSymbolicName(),
		  "] has no revisions, or more than one!"
		);

		//?: {not Apache Felix bundle}
		if(!(rs.get(0) instanceof BundleRevisionImpl))
			throw EX.ass("Bundle [", bundle.getSymbolicName(),
			  "] is not an Apache Felix bundle!");

		//~: content of the bundle
		Content c = EX.assertn(
		  ((BundleRevisionImpl)rs.get(0)).getContent(),
		  "Bundle [", bundle.getSymbolicName(), "] has no Content!"
		);

		//~: resource path
		String  p = url.getPath();
		if(p.startsWith("/"))
			p = p.substring(1);

		//~: request resource by the path
		return c.getEntryAsURL(p);
	}
}