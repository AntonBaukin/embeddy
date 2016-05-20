package com.tverts.embeddy.web.statics;

/* Java */

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.Properties;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicBoolean;

/* Java Servlet */

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/* OSGi */

import org.osgi.framework.BundleContext;
import org.osgi.framework.Constants;
import org.osgi.framework.ServiceReference;
import org.osgi.framework.ServiceRegistration;
import org.osgi.service.cm.ConfigurationException;
import org.osgi.service.cm.ManagedService;
import org.osgi.service.http.HttpContext;
import org.osgi.service.http.HttpService;
import org.osgi.service.log.LogService;
import org.osgi.util.tracker.ServiceTracker;


/**
 * Service that works with HTTP Service.
 *
 * @author anton.baukin@gmail.com.
 */
public class StaticContentService implements ManagedService, HttpContext
{
	public StaticContentService(BundleContext context)
	{
		this.context    = context;
		this.bundleName = EX.asserts(context.getBundle().getSymbolicName());
		EX.assertx(!this.bundleName.endsWith("."));
	}

	public final BundleContext context;
	public final String        bundleName;


	/* Static Web Router */

	public void assignConfig(Map<String, String> defaults)
	{
		try
		{
			Dictionary<String, Object> d =
			  new Hashtable<String, Object>(defaults.size());
			for(Map.Entry<String, String> e : defaults.entrySet())
				d.put(e.getKey(), e.getValue());

			//~: update & restart
			updated(d);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while assigning the configuration!");
		}
	}

	protected final Map<String, String> config   =
	  new HashMap<String, String>(3);

	protected final Map<String, String> defaults =
	  new HashMap<String, String>(3);

	@SuppressWarnings("unchecked")
	public void register()
	{
		//~: copy the configuration
		Dictionary<String, Object> d = new Hashtable<String, Object>();
		d.put(Constants.SERVICE_PID, bundleName);
		for(Map.Entry<String, String> e : this.config.entrySet())
			d.put(e.getKey(), e.getValue());

		//~: load mime types
		loadMime();

		//~: register this managed service
		EX.assertx(registration == null);
		registration = context.registerService(
		  ManagedService.class, this, d);

		//~: track log service
		logTracker = new ServiceTracker(context, LogService.class, null)
		{
			public Object addingService(ServiceReference reference)
			{
				if(logService == null)
					logService = (LogService) context.getService(reference);
				return super.addingService(reference);
			}

			public void   removedService(ServiceReference reference, Object service)
			{
				if(service == logService)
					logService = null;
				super.removedService(reference, service);
			}
		};

		//~: track HTTP service
		httpTracker = new ServiceTracker(context, HttpService.class, null)
		{
			public Object addingService(ServiceReference reference)
			{
				if(httpService == null)
				{
					httpService = (HttpService) context.getService(reference);
					start();
				}

				return super.addingService(reference);
			}

			public void   removedService(ServiceReference reference, Object service)
			{
				if(service == httpService) try
				{
					stop();
				}
				finally
				{
					httpService = null;
				}

				super.removedService(reference, service);
			}
		};

		logTracker.open();
		httpTracker.open();

		info("activating the static content router [", bundleName,
		  "] with following defaults: ", this.defaults);
	}

	public void unregister()
	{
		info("deactivating the static content router [", bundleName, "]...");

		try
		{
			stop();
		}
		finally
		{
			if(logTracker != null) try
			{
				logTracker.close();
				logService = null;
			}
			finally
			{
				logTracker = null;
			}

			if(httpTracker != null) try
			{
				httpTracker.close();
			}
			finally
			{
				logTracker = null;
			}

			//~: remove the configuration file
			if(configFileTemp != null) try
			{
				if(configFileTemp.exists())
					if(!configFileTemp.delete())
						configFileTemp.deleteOnExit();
			}
			catch(Throwable e)
			{
				//~: ignore this error
			}
		}
	}

	protected ServiceRegistration  registration;
	protected ServiceTracker       logTracker;
	protected volatile LogService  logService;
	protected ServiceTracker       httpTracker;
	protected volatile HttpService httpService;


	/* Managed Service */

	@SuppressWarnings("unchecked")
	public void updated(Dictionary properties)
	  throws ConfigurationException
	{
		//~: inspect the preferences
		Enumeration<String> ks;
		if(properties != null)
		{
			String prefix = bundleName + '.';

			ks = properties.keys();
			while(ks.hasMoreElements())
			{
				String k = ks.nextElement();

				if(!k.startsWith(prefix))
					throw new ConfigurationException(k, EX.cat(
					  "Configuration property [", k,
					  "] not starts with bundle prefix [", prefix, "]!"
					));
			}
		}

		info("updating the static content router ",
		  "with following properties: ", properties);

		synchronized(this.config)
		{
			//~: stop the service
			this.stop();

			//~: clear & assign
			this.config.clear();

			//?: {has configuration provided}
			if(properties != null)
			{
				ks = properties.keys();
				while(ks.hasMoreElements())
				{
					String k = ks.nextElement();
					Object v = properties.get(k);

					if(!(v instanceof String))
						throw new ConfigurationException(k,
						  "Property has no string value!"
						);

					this.config.put(k, (String)v);
				}
			}
			//~: assign the defaults
			else
				this.config.putAll(this.defaults);

			//?: {assign the defaults}
			if(this.defaults.isEmpty())
				this.defaults.putAll(this.config);

			//~: start back
			this.start();
		}
	}


	/* HTTP Context */

	public boolean handleSecurity(HttpServletRequest req, HttpServletResponse res)
	{
		if(!localOnly)
			return true;

		String adr = req.getRemoteAddr();
		return
		  "127.0.0.1".equals(adr)                || //<-- IPv4, a
		  "::1".equals(adr)                      || //<-- IPv6, a
		  "0:0:0:0:0:0:0:1".equals(adr)          || //<-- IPv6, b
		  adr.matches("127(.\\d\\d?\\d?){3,3}");    //<-- IPv4, b
	}

	public URL     getResource(String name)
	{
		//?: {not our name}
		if(!name.startsWith(contentRoot)) return null;
		name = name.substring(contentRoot.length());
		if(!name.startsWith("/")) return null;

		//?: {configuration file}
		if(name.equals(configFile)) try
		{
			return (configFileTemp == null)?(null):(configFileTemp.toURI().toURL());
		}
		catch(Throwable e)
		{
			return null;
		}

		return context.getBundle().getResource(contentRoot + name);
	}

	public String  getMimeType(String name)
	{
		if(name != null)
		{
			//~: take the resource extension
			int i = name.lastIndexOf('.');
			if(i != -1) name = name.substring(i + 1);

			//~: lookup it
			String mt = this.mime.get(name.toLowerCase());
			if(mt != null)
				return mt;
		}

		return "application/octet-stream";
	}

	protected String  contextPath;
	protected String  contentRoot;
	protected String  configFile;
	protected File    configFileTemp;
	protected boolean localOnly = true;

	protected final Map<String, String> mime =
	  new HashMap<String, String>(17);


	/* protected: service */

	protected void   stop()
	{
		//?: {not started}
		if(!started.compareAndSet(true, false))
			return;

		EX.assertn(httpService);
		httpService.unregister(contextPath);

		info("stopping static content router [", bundleName,
		  "] for context path [", contextPath, "]..."
		);
	}

	protected void   start()
	{
		//?: {has no http service yet}
		if(httpService == null) return;

		//?: {is already started}
		if(!started.compareAndSet(false, true))
			return;

		//~: update the configuration
		try
		{
			updateConfig();
		}
		catch(Throwable e)
		{
			started.set(false);
			throw EX.wrap(e, "Error while reading the configuration!");
		}

		//~: register this HTTP context
		try
		{
			httpService.registerResources(contextPath, contentRoot, this);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error when registering static resources!");
		}

		info("started static content router [", bundleName,
		  "] for context path [", contextPath, "]");
	}

	protected final AtomicBoolean started =
	  new AtomicBoolean();

	protected void   updateConfig()
	{
		String  contextPath = config("context-path");
		String  contentRoot = config("content-root");
		String  configFile  = config("config-file");
		boolean localOnly   = "true".equals(config("localhost"));

		//~: context path
		if(!contextPath.startsWith("/"))
			contextPath = "/" + contextPath;
		if(!"/".equals(contextPath) && contextPath.endsWith("/"))
			contextPath = contextPath.substring(0, contextPath.length() - 1);

		//~: content root
		if(!contentRoot.startsWith("/"))
			contentRoot  = "/" + contentRoot;
		if(contentRoot.endsWith("/"))
			contentRoot = contentRoot.substring(0, contentRoot.length() - 1);

		//~: config file
		if(!configFile.startsWith("/"))
			configFile = "/" + configFile;
		EX.assertx(!configFile.endsWith("/"));

		//~: check the content directory
		EX.assertn(context.getBundle().getResource(contentRoot),
		  "Not found bundle directory resource [", contentRoot, "]!"
		);

		//~: assign the results
		this.contextPath = contextPath;
		this.contentRoot = contentRoot;
		this.configFile  = configFile;
		this.localOnly   = localOnly;

		//~: write config file
		try
		{
			writeConfigFile();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error when writing temporary configuration file!");
		}
	}

	protected String config(String name)
	{
		name = bundleName + '.' + name;
		return EX.asserts(this.config.get(name),
		  "Configuration property [", name,
		  "] is not found, or has side whitespaces!"
		);
	}

	protected void   loadMime()
	{
		try
		{
			URL u = EX.assertn(context.getBundle().
			  getResource("/META-INF/mime.properties"),
			  "No [mime.properties] resource file is found!"
			);

			Properties  p = new Properties();
			InputStream i = u.openStream(); try
			{
				p.load(i);
			}
			finally
			{
				i.close();
			}

			for(String n : p.stringPropertyNames())
				this.mime.put(EX.asserts(n.toLowerCase()),
				  EX.asserts(p.getProperty(n), "Illegal MIME type [", n, "]!"));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while loading MIME-types!");
		}
	}

	protected void   writeConfigFile()
	  throws IOException
	{
		//~: create temporary file
		if(configFileTemp == null)
			configFileTemp = File.createTempFile(
			  configFile.replace("/", ""), "json");

		if(!configFileTemp.exists())
			EX.assertx(configFileTemp.createNewFile(),
			  "Can't create temporary configuration file [",
			  configFileTemp.getAbsolutePath(), "]!");

		EX.assertx(configFileTemp.canWrite(),
		  "Can't write to temporary configuration file [",
		   configFileTemp.getAbsolutePath(), "]!");

		//~: build configuration properties
		Map<String, String> ps = new TreeMap<String, String>();
		buildConfigProperties(ps);

		//~: write them
		writeConfigProperties(ps);
	}

	protected void   buildConfigProperties(Map<String, String> m)
	{
		String p = bundleName + ".config.";

		for(Map.Entry<String, String> e : this.config.entrySet())
			if(e.getKey().startsWith(p))
				m.put(e.getKey().substring(p.length()), e.getValue());
	}

	protected void   writeConfigProperties(Map<String, String> m)
	  throws IOException
	{
		//~: write the json
		StringBuilder b = new StringBuilder(1024);
		b.append("{\n");

		boolean first = true;
		for(Map.Entry<String, String> e : m.entrySet())
		{
			b.append((first)?("\t\""):(",\n\t\""));
			first = false;

			jss(b, e.getKey());
			b.append("\": \"");
			jss(b, e.getValue());
			b.append("\"");
		}
		b.append("\n}");

		//~: write the bytes
		byte[]       bs = b.toString().getBytes("UTF-8");
		OutputStream os = new FileOutputStream(configFileTemp);
		try
		{
			os.write(bs);
		}
		finally
		{
			os.close();
		}
	}

	protected void   info(Object... msg)
	{
		if((logService == null) | (registration == null))
			return;

		logService.log(registration.getReference(),
		  LogService.LOG_INFO, EX.cat(msg));
	}

	/**
	 * Escapes string to place into Java Script source text.
	 * Note that XML entities are not encoded here, and you
	 * must protected XML text properly with CDATA sections.
	 */
	protected static void jss(StringBuilder b, String s)
	{
		if((s == null) || s.isEmpty())
			return;

		int l = s.length();
		b.ensureCapacity(b.length() + l);

		for(int i = 0;(i < l);i++)
		{
			char c = s.charAt(i);

			switch(c)
			{
				case '\"':
					b.append('\\').append('"');
					break;

				case '\\':
					b.append('\\').append('\\');
					break;

				case '/':
					b.append('\\').append('/');
					break;

				case '\t':
					b.append('\\').append('t');
					break;

				case '\n':
					b.append('\\').append('n');
					break;

				case '\r':
					b.append('\\').append('r');
					break;

				case '\b':
					b.append('\\').append('b');
					break;

				case '\f':
					b.append('\\').append('f');
					break;

				case '\0':
					b.append('\\').append('0');
					break;

				default  :
					b.append(c);
			}
		}
	}
}