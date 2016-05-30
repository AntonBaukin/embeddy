package net.java.osgi.embeddy.boot;

/* Java */

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.jar.Attributes;
import java.util.jar.Manifest;
import java.util.zip.ZipFile;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.ziper.ZiPArchive;
import net.java.osgi.embeddy.boot.ziper.ZiPClassLoader;
import net.java.osgi.embeddy.boot.ziper.ZiPStorage;
import net.java.osgi.embeddy.boot.ziper.ZiPTmpStore;


/**
 * Strategy to launch OSGi framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class BootLegger implements BootSet
{
	/* Boot Legger */

	public BootLegger init()
	{
		//~: initial class loader
		EX.assertx(initialLoader == null);
		initialLoader = Thread.currentThread().getContextClassLoader();

		//~: load the manifest
		manifest = readManifest();
		preventJarLocking();

		//~: read the properties
		properties = new HashMap<>(17);
		loadMainProperties(properties);

		//~: find start jar
		startJar = findStartJar();

		return this;
	}

	public BootLegger prepare()
	{
		//~: create root jar scanner
		EX.assertx(bootLoader == null);
		bootLoader = new BootJaRLoader(startJar, this);

		//~: do load boot archives
		bootLoader.bootLoad();

		//~: register shutdown callback
		registerCloseOnExit();

		//~: install boot class loader
		setupBootClassLoader();

		//~: configure logging
		logger = setupLogging();
		logInitial();

		//~: find OSGi framework factory
		try
		{
			frameworkFactory = findFrameworkFactory();

			//~: denote privileged jar
			ClassLoader cl = bootLoader.getMainLoader();
			if(!(cl instanceof ZiPClassLoader))
				throw EX.ass("Not a ZiPClassLoader!");
			((ZiPClassLoader) cl).privilegeArchive(frameworkFactory.getName());
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		//~: init bundles handler
		try
		{
			Class<?> bcl = bootLoader.getMainLoader().loadClass(
			  "net.java.osgi.embeddy.boot.Bundler"
			);

			//~: create handler instance
			EX.assertx(this.bundler == null);
			this.bundler = (Closeable) bcl.getConstructor(BootSet.class).
			  newInstance(this);

			//~: initialize it
			bcl.getMethod("init").invoke(this.bundler);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		return this;
	}

	@SuppressWarnings("unchecked")
	public BootLegger launch()
	{
		EX.assertn(bundler);
		EX.assertx(framework == null);

		//~: create the framework & start it
		try
		{
			//~: create framework instance
			framework = frameworkFactory.getMethod("newFramework", Map.class).
			  invoke(frameworkFactory.newInstance(), properties);

			LU.info(logger, "starting OSGi framework implemented by [",
			  framework.getClass().getName(), "]");

			//~: do start
			framework.getClass().getMethod("start").invoke(framework);
			LU.info(logger, "OSGI framework is started!");

			//~: install the bundles
			bundler.getClass().getMethod("install", Object.class).
			  invoke(bundler, framework);

			//~: and start them (with the framework)
			bundler.getClass().getMethod("start").invoke(bundler);

			//~: wait for termination
			LU.info(logger, "waiting OSGI framework to stop...");
			EX.assertx(started.compareAndSet(false, true));
			framework.getClass().getMethod("waitForStop", long.class).
			  invoke(framework, 0L);
		}
		catch(Throwable e)
		{
			throw LU.error(logger, EX.wrap(e,
			  "Error occurred while executing OSGi framework!"));
		}
		finally
		{
			closeOnExit();
		}

		//WARNING: no logging is allowed here!

		return this;
	}

	protected Object framework;


	/* Boot Set */

	public ZiPStorage  createTempStorage()
	{
		return new ZiPTmpStore();
	}

	public String      getBootPath()
	{
		String p = getManifestAttr("Boot-Path");

		if(!p.startsWith("/")) p  = "/" + p;
		if(!p.endsWith("/"))   p += "/";

		return p;
	}

	public String      getBundlesPath()
	{
		String p = getManifestAttr("Bundles-Path");

		if(!p.startsWith("/")) p  = "/" + p;
		if(!p.endsWith("/"))   p += "/";

		return p;
	}

	public ClassLoader getInitialLoader()
	{
		return initialLoader;
	}

	protected ClassLoader initialLoader;

	public String      manifested(String name)
	{
		Attributes a = EX.assertn(manifest.getMainAttributes(),
		  "Boot MANIFEST.MF has no attributes!");

		return a.getValue(name);
	}

	public String      get(String name)
	{
		String v = EX.assertn(properties).get(name);
		return (v != null)?(v):(System.getProperty(name));
	}

	public void        set(String p, String v)
	{
		if(v == null)
		{
			EX.assertn(properties).remove(p);

			if(System.getProperty(p) != null)
				System.clearProperty(p);

			return;
		}

		//~: assign the property
		EX.assertn(properties).put(p, v);
		if(System.getProperty(p) != null)
			System.setProperty(p, v);

		//c: scan and substitute in else properties
		String x = String.format("${%s}", p);
		for(Map.Entry<String, String> e : properties.entrySet())
		{
			if(!e.getValue().contains(x))
				continue;

			e.setValue(e.getValue().replace(x, v));
			if(System.getProperty(e.getKey()) != null)
				System.setProperty(e.getKey(), e.getValue());
		}
	}

	public ZiPArchive  getRootArchive()
	{
		EX.assertn(bootLoader, "Boot JAR Loader is not created yet!");
		return EX.assertn(bootLoader.getRootArchive(),
		  "Boot JAR Loader is not prepared yet!"
		);
	}

	public ZipFile     getRootZip()
	{
		ZiPArchive za = getRootArchive();
		return EX.assertn(bootLoader.storage.access(za));
	}


	/* protected: initialization */

	protected URL         getOwnResource(String name)
	{
		ClassLoader  cl = this.getClass().getClassLoader();
		HashSet<URL> all, par;

		try
		{
			all = new HashSet<>(Collections.list(cl.getResources(name)));
			par = new HashSet<>(Collections.list(cl.getParent().getResources(name)));
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}

		all.removeAll(par);
		if(all.isEmpty())
			return null;

		EX.assertx(all.size() == 1, "Not unique resource [", name, "] found!");
		return all.iterator().next();
	}

	protected InputStream getOwnResourceStream(String name)
	{
		URL url = getOwnResource(name);

		if(url != null) try
		{
			return url.openStream();
		}
		catch(IOException e)
		{
			throw EX.wrap(e, "Error while opening resource [", url.toString(), "]!");
		}

		return null;
	}

	protected Manifest    readManifest()
	{
		InputStream s = EX.assertn(getOwnResourceStream(
		  "META-INF/MANIFEST.MF"), "No META-INF/MANIFEST.MF file exists!");

		try
		{
			Manifest m = new Manifest();
			m.read(s);
			s.close();

			return m;
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while reading MANIFEST.MF!");
		}
	}

	protected Manifest manifest;

	protected String      getManifestAttr(String name)
	{
		EX.assertn(manifest, "Application MANIFEST.MF is not read yet!");

		Attributes a = EX.assertn(manifest.getMainAttributes(),
		  "Boot MANIFEST.MF has no attributes!");

		return EX.asserts(a.getValue(name), "Boot MANIFEST.MF has no ",
		  "(or whitespace surrounded) attribute [", name, "]!");
	}

	protected  void       loadMainProperties(Map<String, String> props)
	{
		String      f = getManifestAttr("OSGi-Properties");
		InputStream i = EX.assertn(getOwnResourceStream(f),
		  "Boot [", f, "] file is not found!");

		try
		{
			Properties p = new Properties();
			p.load(new InputStreamReader(i, "UTF-8"));

			//HINT: each property started with 'system.'
			//  is put back to System (without the prefix)
			//  if there is no the one.

			for(String n : p.stringPropertyNames())
			{
				final String S = "system.";
				String       x = n;
				if(x.startsWith(S))
					x = n.substring(S.length());

				//?: {has system property}
				String v = System.getProperty(x);
				if(v != null)
					props.put(x, v);
				else
				{
					props.put(x, v = p.getProperty(n));

					if(x.length() != n.length())
						System.setProperty(x, this.get(x));
				}
			}

			i.close();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occured while reading boot [", f, "] file!");
		}
	}

	protected Map<String, String> properties;

	protected File        findStartJar()
	{
		String p = EX.assertn(Main.class.getResource(
		  Main.class.getSimpleName() + ".class")).toString();

		EX.assertx(p.startsWith("jar:file:"),
		  "Framework startup takes part not within a JAR file!",
		  " The path is: [", p , "]...");

		String c = "!/" + Main.class.getName().replace('.', '/') + ".class";
		EX.assertx(p.endsWith(c));

		p = p.substring("jar:".length());
		p = p.substring(0, p.length() - c.length());

		File f; try
		{
			f = new File(new java.net.URI(p));
			EX.assertx(f.exists() && f.isFile() && f.canRead(),
			  "Can't access startup JAR file [", f.getAbsolutePath(), "]!"
			);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		return f;
	}

	protected File startJar;


	/* protected: prepare */

	protected void        setupBootClassLoader()
	{
		Thread.currentThread().setContextClassLoader(
		  bootLoader.getMainLoader());
	}

	@SuppressWarnings("unchecked")
	protected Object      setupLogging()
	{
		String lps = getManifestAttr("Log-Config-Properties");
		String lp  = null;

		for(String p : lps.split("\\s*,\\s*"))
			if((lp = System.getProperty(p)) != null)
			{
				lp = lp.trim();
				if(lp.isEmpty()) lp = null;
				if(lp != null) break;
			}

		if(lp != null) //?: {user had defined explicit file}
			System.setProperty("log4j.configurationFile", lp);
		else
		{
			//~: use default configuration
			String def = getManifestAttr("Log-Config-Default");

			//~: search for log file definition
			String lfp = getManifestAttr("Log-File-Property");
			String lfl = System.getProperty(lfp);

			//?: {has it defined}
			if((lfl != null) && !lfl.isEmpty())
			{
				File f = new File(lfl);

				if(f.exists())
					EX.assertx(f.isFile() && f.canWrite(),
					  "Can't write to log file [", f.getAbsolutePath(), "]!"
					);
				else
				{
					File p = f.getAbsoluteFile().getParentFile();

					EX.assertx(p.exists() && p.isDirectory() && p.canWrite(),
					  "Can't access parent directory of log file [",
					  f.getAbsolutePath(), "]!"
					);
				}

				def = getManifestAttr("Log-Config-File");
			}

			//~: access the configuration
			URL cfg = EX.assertn(getOwnResource(def),
			  "No default Log4j configuration resource [", def, "] is found!"
			);

			System.setProperty("log4j.configurationFile", cfg.toString());
		}

		//~: setup class loader
		loggerStopper = LU.init(bootLoader.getMainLoader());

		return LU.logger(this.getClass());
	}

	protected void        logInitial()
	{
		LU.info(logger, "started from JAR file [",
		  startJar.getAbsolutePath(), "]"
		);
	}

	/**
	 * Invoked with the boot JAR class-loader to find
	 * OSGi framework and launch it.
	 */
	protected Class       findFrameworkFactory()
	  throws Exception
	{
		ClassLoader cl = bootLoader.getMainLoader();
		List<URL>   xr = Collections.list(cl.getResources(
		  "META-INF/services/org.osgi.framework.launch.FrameworkFactory"
		));

		//?: {not found any}
		EX.assertx(!xr.isEmpty(), "No OSGi Framework Factory ",
		  "service confiuration is found!");

		//?: {several implementations}
		EX.assertx(xr.size() == 1, "Several OSGi Framework Factory ",
		  "service confiurations are found!");

		String fc = IO.readCommented(IO.load(xr.get(0).openStream()));
		LU.info(logger, "using OSGi Framework Factory [", fc, ']');

		try
		{
			return cl.loadClass(fc.trim());
		}
		catch(Exception e)
		{
			throw EX.wrap(e, "Can't load OSGi Framework Factory class [", fc, "]!");
		}
	}

	protected void        preventJarLocking()
	{
		String os = EX.assertn(System.getProperty("os.name")).toLowerCase();
		if(!os.contains("windows")) return;

		try
		{
			URL u = getOwnResource("META-INF/MANIFEST.MF");
			URLConnection c = u.openConnection();

			//HINT: this default value is used further for all JAR files.
			c.setDefaultUseCaches(false);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}
	}

	protected BootJaRLoader bootLoader;
	protected Closeable     bundler;
	protected Class         frameworkFactory;

	/**
	 * Log4j logger is assigned to this field
	 * after the boot class loader is installed.
	 * (As Logger class is loaded by it.)
	 */
	protected Object        logger;
	protected Runnable      loggerStopper;


	/* protected: launch */

	protected final AtomicBoolean started =
	  new AtomicBoolean();

	protected final AtomicBoolean closed  =
	  new AtomicBoolean();

	/**
	 * TODO shutdown application of start error
	 */
	protected void closeOnExit()
	{
		//?: {has this method invoked}
		if(!closed.compareAndSet(false, true))
			return;

		//?: {framework is started}
		if(started.compareAndSet(true, false)) try
		{
			EX.assertn(bundler);
			bundler.getClass().getMethod("stop").invoke(bundler);
		}
		catch(Throwable e)
		{
			LU.error(logger, e, "Error while stopping OSGi framework!");
		}

		//~: close the structures
		try
		{
			//~: close the bundles handler
			bundler.close();
		}
		catch(Throwable e)
		{
			//~: hold this error
			LU.error(logger, e, "error occurred while closing OSGi bundles storage");
		}
		finally
		{
			//~: close the main class loader
			try
			{
				bootLoader.close();
				LU.info(logger, "closed boot JAR loader, now application exits!");
			}
			catch(Throwable e)
			{
				//~: hold this error
				LU.error(logger, e, "error occurred while closing boot JAR loader");
			}
		}

		//~: close the logger
		if(loggerStopper != null) try
		{
			loggerStopper.run();
		}
		finally
		{
			loggerStopper = null;
		}
	}

	protected void registerCloseOnExit()
	{
		Thread t = new Thread(this::closeOnExit);

		t.setName(getClass().getSimpleName() + "ShutdownHook");
		Runtime.getRuntime().addShutdownHook(t);
	}
}