package net.java.osgi.embeddy.web.statics;

/* Java */

import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/* OSGi */

import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;

/* Apache Commons */

import org.apache.commons.lang3.text.StrLookup;
import org.apache.commons.lang3.text.StrSubstitutor;


/**
 * Registers servlet to provide static web content.
 *
 * @author anton.baukin@gmail.com.
 */
public class StaticWebActivator implements BundleActivator
{
	/* Bundle Activator */

	public void start(BundleContext context)
	  throws Exception
	{
		EX.assertx(contentService == null);

		//~: read default configuration
		Map<String, String> defaults =
		  readDefaults(context);

		//~: create the service
		try
		{
			contentService = new StaticContentService(context);
			contentService.assignConfig(defaults);
			contentService.register();
		}
		catch(Throwable e)
		{
			contentService = null;
			throw EX.wrap(e);
		}
	}

	public void stop(BundleContext context)
	  throws Exception
	{
		if(contentService != null) try
		{
			contentService.unregister();
		}
		finally
		{
			contentService = null;
		}
	}

	protected volatile StaticContentService contentService;


	/* protected: configuration */

	protected Map<String, String> readDefaults(BundleContext context)
	{
		StrSubstitutor sub = new StrSubstitutor(bundleVars(context));
		sub.setEnableSubstitutionInVariables(true);

		try
		{
			URL pr = EX.assertn(context.getBundle().
			  getResource("/META-INF/setup.properties"),
			  "Default properties resource is not found!"
			);

			//~: load default properties
			Properties  ps = new Properties();
			InputStream is = pr.openStream(); try
			{
				ps.load(is);
			}
			finally
			{
				is.close();
			}

			Map<String, String> r = new HashMap<String, String>(ps.size());
			for(String n : ps.stringPropertyNames())
			{
				String x = EX.asserts(sub.replace(n),
				  "Incorrect property name substitution for [", n, "]!");

				String v = ps.getProperty(n);
				if(v == null) v = "";
				v = sub.replace(v);

				r.put(x, v);
			}

			return r;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "error occurred while reading default properties!");
		}
	}

	protected StrLookup<String>   bundleVars(final BundleContext context)
	{
		//~: bundle symbolic name
		final String sn = EX.asserts(
		  context.getBundle().getSymbolicName());

		//~: suffix of the symbolic name
		int           i = sn.lastIndexOf('.');
		final String su = (i == -1)?(sn):
		  EX.asserts(sn.substring(i + 1));

		return new StrLookup<String>()
		{
			public String lookup(String key)
			{
				if("symbolic-name".equals(key))
					return sn;

				if("symbolic-suffix".equals(key))
					return su;

				return context.getProperty(key);
			}
		};
	}
}