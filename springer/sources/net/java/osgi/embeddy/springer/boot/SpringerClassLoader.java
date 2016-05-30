package net.java.osgi.embeddy.springer.boot;

/* Java */

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.instrument.ClassFileTransformer;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.ServiceLoader;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleReference;

/* embeddy: boot system */

import net.java.osgi.embeddy.boot.BundleAccess;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SpringerBoot;


/**
 * Wraps Bundle Class Loader to provide AspectJ
 * Weaving abilities required by Spring Framework.
 *
 * This class loader always resolves the classes
 * of Spring as of it's own.
 *
 *
 * @author anton.baukin@gmail.com.
 */
public class      SpringerClassLoader
       extends    ClassLoader
       implements BundleReference, AutoCloseable
{
	/**
	 * Creates class loader to load Spring Framework
	 * classes via {@code thisLoader} being Bundle Class
	 * Loader of this (Springer) bundle; and via target
	 * application (bundle) class loader {@code thatLoader}.
	 *
	 * Argument {@code thatLoader} is used as parent loader.
	 */
	public SpringerClassLoader(
	  SpringerBoot boot, ClassLoader thatLoader,
	  ClassLoader thisLoader, String... packages)
	{
		super(EX.assertn(thatLoader));

		this.springBoot  = EX.assertn(boot);
		this.thisLoader  = EX.assertn(thisLoader);
		this.transformer = new WeavingTransformer(this);
		this.packages    = buildPackages(packages);
	}

	public final SpringerBoot springBoot;


	/* Bundle Reference */

	/**
	 * Refers target OSGi Bundle (using {@code thatLoader}
	 * is being the parent class loader). Hint: target bundle
	 * is the bundle using Springer one.
	 */
	public Bundle getBundle()
	{
		return ((BundleReference) getParent()).getBundle();
	}


	/* Auto Closeable */

	public void close()
	{
		synchronized(locks)
		{
			locks.clear();
			cache.clear();
		}
	}


	/* Spring Class Loader */

	/**
	 * Some Springer classes require to be loaded
	 * by this Class Loader to access their Boot.
	 */
	public SpringerBoot getSpringBoot()
	{
		return springBoot;
	}


	/* Class Loader */

	public Class<?>         loadClass(String name)
	  throws ClassNotFoundException
	{
		return this.loadClass(name, null);
	}

	/**
	 * Spring class path scanner does support only URLs
	 * pointing file system directories, or archives.
	 * OSGI returns bundle URL, and scanner confuses.
	 */
	public Enumeration<URL> getResources(String name)
	  throws IOException
	{
		//~: collect the resources
		Enumeration<URL> i = super.getResources(name);
		Set<URL>         s = new LinkedHashSet<>();
		while(i.hasMoreElements())
			s.add(i.nextElement());

		//~: rewrite them
		List<URL> r = new ArrayList<>(s.size());
		for(URL u : s)
			r.add(rewriteResourceURL(u));

		return Collections.enumeration(r);
	}

	public BundleAccess     getBundleAccess()
	{
		if(bundleAccess != null)
			return bundleAccess;

		//~: search for the service
		Iterator<BundleAccess> i = ServiceLoader.
		  load(BundleAccess.class, thisLoader.getParent()).
		  iterator();

		//?: {provider is not found}
		EX.assertx(i.hasNext(), "BundleAccess service has no providers!");
		bundleAccess = EX.assertn(i.next());

		return bundleAccess;
	}

	private volatile BundleAccess bundleAccess;


	/* protected: class loading */

	protected Class<?> loadClass(String name, boolean resolve)
	  throws ClassNotFoundException
	{
		return this.loadClass(name, Boolean.valueOf(resolve));
	}

	protected final ClassLoader thisLoader;

	protected URL      findResource(String name)
	{
		URL res = thisLoader.getResource(name);
		return (res == null)?(null):(rewriteResourceURL(res));
	}

	protected Enumeration<URL>
	                   findResources(String name)
	  throws IOException
	{
		return thisLoader.getResources(name);
	}

	/**
	 * Replaces bundle resources to directories to
	 * file path or archive ones. This allows class
	 * path scanning implemented in Spring.
	 */
	protected URL      rewriteResourceURL(URL url)
	{
		//?: {not a path resource}
		if(!url.getPath().endsWith("/"))
			return url;

		//?: {not a bundle resource}
		if(!"bundle".equals(url.getProtocol()))
			return url;

		try
		{
			Bundle bundle = getBundleByURL(url);

			return EX.assertn(
			  getBundleAccess().getBundleResource(bundle, url),
			  "Failed to fetch resource [", url, "] in bundle [",
			  bundle.getSymbolicName(), "]!"
			);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Can't rewrite bundle resource URL [", url, "]!");
		}
	}

	/**
	 * URL path is the resource path, host is bundle
	 * revision (bundle-id.revision).
	 */
	protected Bundle   getBundleByURL(URL url)
	{
		Bundle bundle = getBundle();
		String host   = url.getHost();
		String bid    = "";

		//~: take the leading digits
		EX.asserts(host);
		for(int i = 0;(i < host.length());i++)
			if(Character.isDigit(host.charAt(i)))
				bid += host.charAt(i);
			else
				break;

		//~: parse to bindle id
		EX.asserts(bid, "Can't define bundle id from URL: [", url, "]!");
		long id = Long.parseLong(bid);

		//?: {else bundle}
		if(id != bundle.getBundleId())
			bundle = EX.assertn(getBundle().getBundleContext().
			  getBundle(id), "Can't find bundle by ID [", id, "]!");

		return bundle;
	}

	/**
	 * Note that Spring packages them-self are never weaved.
	 */
	protected boolean  isWeavedPackage(String className)
	{
		for(String p : this.packages)
			if(className.startsWith(p))
				return true;

		return false;
	}

	protected final String[] packages;

	protected boolean  isSpringPackage(String className)
	{
		for(String p : SPRING_PACKAGES)
			if(className.startsWith(p))
				return true;

		return false;
	}

	protected final String[] SPRING_PACKAGES = new String[]
	{
	  "org.springframework.",
	  "org.aopalliance.",
	  "org.aspectj.",
	  "org.objectweb.asm.",
	  "aj.org.objectweb."
	};

	/**
	 * Loads classes from Spring packages.
	 */
	protected Class<?> loadSpringClass(String name)
	  throws ClassNotFoundException
	{
		return thisLoader.loadClass(name);
	}

	/**
	 * This method resolves always classes of the packages of
	 * interest, and applies the flag as-is to the parent call.
	 */
	protected Class<?> loadClass(String name, Boolean resolve)
	  throws ClassNotFoundException
	{
		//?: {spring package}
		if(isSpringPackage(name))
			return loadSpringClass(name);

		//?: {not a package of interest} delegate
		if(!isWeavedPackage(name))
			return super.loadClass(name, Boolean.TRUE.equals(resolve));

		//~: lookup in the cache
		Class<?> cached = cache.get(name);
		if(cached != null) return cached;

		//~: access loading lock
		Object lock; synchronized(locks)
		{
			lock = locks.get(name);
			if(lock == null)
				locks.put(name, lock = new Object());
		}

		synchronized(lock)
		{
			//~: load the bytes
			byte[] b = loadClassBytes(getParent(), name);

			try
			{
				//~: transform the bytes
				b = transformer.transformIfNecessary(name, b);

				//~: define the class
				Class<?> c = defineClass(name, b, 0, b.length);

				//?: {resolve class}
				if(!Boolean.FALSE.equals(resolve))
					resolveClass(c);

				cache.put(name, c);
				return c;
			}
			catch(Throwable x)
			{
				throw EX.wrap(x, "Error while defining weaved class [", name, "] bytes!");
			}
		}
	}

	protected final Map<String, Class<?>> cache =
	  new ConcurrentHashMap<>(101);

	protected final Map<String, Object>   locks =
	  new HashMap<>(101);

	protected URL      findClassResource(ClassLoader cl, String name)
	{
		//~: get the class resource
		String p = name.replace('.', '/') + ".class";
		return cl.getResource(p);
	}

	protected byte[]   loadClassBytes(ClassLoader cl, String name)
	  throws ClassNotFoundException
	{
		//~: get the class resource
		URL r = findClassResource(cl, name);
		if(r == null) //?: {not found it}
			throw new ClassNotFoundException(name);

		//~: load the bytes
		Throwable   e = null;
		InputStream i = null;
		try
		{
			//~: read the class bytes
			ByteArrayOutputStream o = new ByteArrayOutputStream(2048);
			int s; byte[] b = new byte[512];

			i = r.openStream();
			while((s = i.read(b)) > 0)
				o.write(b, 0, s);
			o.close();

			return o.toByteArray();
		}
		catch(Throwable x)
		{
			e = x;
		}
		finally
		{
			if(i != null) try
			{
				i.close();
			}
			catch(Throwable x)
			{
				if(e == null) e = x;
			}
		}

		throw EX.wrap(e, "Error while loading class [", name, "] bytes!");
	}

	protected String[] buildPackages(String... packages)
	{
		TreeSet<String> lst = new TreeSet<>();
		for(String p : packages)
		{
			if(!p.endsWith(".")) p += '.';
			lst.add(EX.asserts(p));
		}

		EX.asserte(lst, "There are no packages provided!");
		return lst.toArray(new String[lst.size()]);
	}


	/* Transforming Class Loader */

	/**
	 * Delegate for LoadTimeWeaver's {@code addTransformer} method.
	 * Typically called through ReflectiveLoadTimeWeaver.
	 */
	public void        addTransformer(ClassFileTransformer transformer)
	{
		this.transformer.addTransformer(transformer);
	}

	protected final WeavingTransformer transformer;

	/**
	 * Delegate for LoadTimeWeaver's {@code getThrowawayClassLoader}
	 * method. Typically called through ReflectiveLoadTimeWeaver.
	 *
	 * Hint: the loader returned has {@code thatLoader}, is being
	 * {@code this.getParent()} loader, to be it's parent. This
	 * is valid as Spring classes (loaded by {@code thisLoader})
	 * are never weaved.
	 */
	public ClassLoader getThrowawayClassLoader()
	{
		return new ClassLoader(this.getParent()) {};
	}
}