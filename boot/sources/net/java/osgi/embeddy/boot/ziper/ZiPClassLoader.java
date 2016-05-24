package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Collections;
import java.util.Deque;
import java.util.Enumeration;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;


/**
 * Composite class loader uses several {@link ZiPFileLoader}s.
 * When providing resources, it refers the parent loader only
 * after asking all the nested. Classes are loaded as always.
 *
 * @author anton.baukin@gmail.com.
 */
public class ZiPClassLoader extends ClassLoader
{
	public ZiPClassLoader(ClassLoader parent)
	{
		super(parent);

		this.loaders = new ConcurrentLinkedDeque<>();
		this.cache   = new ConcurrentHashMap<>(997);
	}


	/* ZiP Class Loaders */

	/**
	 * Connects archive to this loader.
	 */
	public void connect(ZiPFileLoader ld)
	{
		loaders.addLast(ld);
	}

	/**
	 * Makes archive that contains the class named
	 * to be the first to scan for the resources.
	 *
	 * OSGi framework class from that archive will
	 * always get it's own MANIFEST.MF resource.
	 */
	public void privilegeArchive(String className)
	{
		String file = classFile(className);

		for(ZiPFileLoader ld : loaders)
			if(ld.isFile(file))
			{
				loaders.remove(ld);
				loaders.addFirst(ld);
				return;
			}
	}


	/* Class Loader */

	public URL              getResource(String resource)
	{
		String name = resource;
		if(name.startsWith("/"))
			name = name.substring(1);

		//~: iterator over the nested loaders
		for(ZiPFileLoader ld : loaders)
		{
			URL res = ld.getResource(name);
			if(res != null)
				return res;
		}

		return super.getResource(resource);
	}

	public InputStream      getResourceAsStream(String resource)
	{
		String name = resource;
		if(name.startsWith("/"))
			name = name.substring(1);

		//~: iterator over the nested loaders
		for(ZiPFileLoader ld : loaders)
		{
			InputStream res = ld.getResourceAsStream(name);
			if(res != null)
				return res;
		}

		//~: ask the parent loader
		return super.getResourceAsStream(resource);
	}

	public Enumeration<URL> getResources(String resource)
	  throws IOException
	{
		String name = resource;
		if(name.startsWith("/"))
			name = name.substring(1);

		//~: iterator over the nested loaders
		Set<URL> res = new LinkedHashSet<>(1);
		for(ZiPFileLoader ld : loaders)
			//?: {resource is a directory}
			if(ld.isDirectory(name))
				//ld.listDirectory(name, true, res);
				res.add(ld.getResource(name));
			//~: lookup a file
			else
				res.add(ld.getResource(name));

		//~: ask the parent loader
		Enumeration<URL> prs = super.getResources(resource);
		while(prs.hasMoreElements())
			res.add(prs.nextElement());

		res.remove(null);
		return Collections.enumeration(res);
	}

	static String           classFile(String name)
	{
		return name.replace('.', '/') + ".class";
	}


	/* protected: class loading */

	protected Class<?> loadClass(String name, boolean resolve)
	  throws ClassNotFoundException
	{
		//?: {lookup-ed in the cache}
		Class<?> c = cache.get(name);
		if(c != null) return c;

		//~: invoke the parent loader
		c = super.loadClass(name, resolve);
		if(c != null) cache.put(name, c);

		return c;
	}

	protected Class<?> findClass(String name)
	  throws ClassNotFoundException
	{
		String file  = classFile(name);
		byte[] bytes = null;

		for(ZiPFileLoader ld : loaders)
			if((bytes = ld.readFile(file)) != null)
				break;

		if(bytes != null)
			return defineClass(name, bytes, 0, bytes.length);

		throw new ClassNotFoundException(name);
	}


	/* protected: nested loaders */

	protected final Deque<ZiPFileLoader>  loaders;
	protected final Map<String, Class<?>> cache;
}