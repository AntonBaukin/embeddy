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

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleReference;

/* Spring Framework */

import org.springframework.asm.ClassReader;
import org.springframework.core.type.classreading.AnnotationMetadataReadingVisitor;

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
		cache.clear();
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

	final String[] WEAVED_PACKAGES = new String[]
	{
	  "net.java.osgi.embeddy.springer.db.",
	};

	/**
	 * Note that Spring packages them-self are never weaved.
	 * Weaved packages are processed in a special manner.
	 * The bytes of the class are loaded with Springer
	 * class loader and then transformed. Note that this
	 * technique allows not to import Spring classes
	 * in bundles activateing Springer Boot!
	 */
	protected boolean  isWeavedPackage(String className)
	{
		for(String p : this.packages)
			if(className.startsWith(p))
				return true;

		for(String p : WEAVED_PACKAGES)
			if(className.startsWith(p))
				return true;

		return false;
	}

	protected final String[] packages;

	protected boolean  isOwnPackage(String className)
	{
		for(String p : OWN_PACKAGES)
			if(className.startsWith(p))
				return true;

		return false;
	}

	final String[] OWN_PACKAGES = new String[]
	{
	  "net.java.osgi.embeddy.springer.boot.",
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
		if(isOwnPackage(name))
			return loadSpringClass(name);

		//?: {not a package of interest} delegate
		if(!isWeavedPackage(name))
			return super.loadClass(name, !Boolean.FALSE.equals(resolve));

		Class<?> c;

		//~: lookup in the cache
		synchronized(cache)
		{
			c = cache.get(name);
		}

		//?: {found it in the cache}
		if(c != null) return c;

		//~: load and weave the class
		byte[] cb = weaveClass(name);

		if(cb == null) //?: {found it not}
			throw new ClassNotFoundException(name);

		//?: {use parent loader instead}
		if(useParentLoader(name, cb))
		{
			c = getParent().loadClass(name);
			resolve = false;
		}
		//~: define own class
		else try
		{
			c = defineClass(name, cb, 0, cb.length);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while defining weaved ",
			  "class [", name, "] bytes!");
		}

		//~: put in the cache
		synchronized(cache)
		{
			//~: lookup again
			Class<?> cc = cache.get(name);

			//?: {found faster copy} return it
			if(cc != null) return cc;

			//?: {resolve class}
			if(!Boolean.FALSE.equals(resolve))
				resolveClass(c);

			cache.put(name, c);
		}

		return c;
	}

	protected final Map<String, Class<?>>
	  cache = new HashMap<>(101);

	protected byte[]   weaveClass(String name)
	{
		//~: load the bytes
		byte[] b = loadClassBytes(getParent(), name);

		//?: {not found it}
		if(b == null) return null;

		try
		{
			//~: transform the bytes
			return transformer.transformIfNecessary(name, b);
		}
		catch(Throwable x)
		{
			throw EX.wrap(x, "Error while weaving ",
			  "class [", name, "] bytes!");
		}
	}

	/**
	 * Inspects class bytes without defining a class.
	 */
	protected boolean  useParentLoader(String name, byte[] cb)
	{
		try
		{
			//~: class reader instance
			ClassReader cr = new ClassReader(cb);

			//~: class processing visitor
			AnnotationMetadataReadingVisitor v =
			  new AnnotationMetadataReadingVisitor(this);

			//~: visit the class definition
			cr.accept(v, ClassReader.SKIP_DEBUG);

			return useParentLoader(v);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while reading weaved class [", name, "] bytes!");
		}
	}

	protected boolean  useParentLoader(AnnotationMetadataReadingVisitor m)
	{
		return m.getAnnotationTypes().contains(LoadDefault.class.getName());
	}

	protected URL      findClassResource(ClassLoader cl, String name)
	{
		//~: get the class resource
		String p = name.replace('.', '/') + ".class";
		return cl.getResource(p);
	}

	protected byte[]   loadClassBytes(ClassLoader cl, String name)
	{
		//~: get the class resource
		URL r = findClassResource(cl, name);

		//?: {not found it}
		if(r == null) return null;

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