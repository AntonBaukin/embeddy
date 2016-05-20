package net.java.osgi.embeddy.boot;

/* Java */

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.ziper.Directory;
import net.java.osgi.embeddy.boot.ziper.FileItem;
import net.java.osgi.embeddy.boot.ziper.FileObject;
import net.java.osgi.embeddy.boot.ziper.FilePlains;
import net.java.osgi.embeddy.boot.ziper.FilePlains.EachFile;
import net.java.osgi.embeddy.boot.ziper.FilePlains.PlainNamesCache;
import net.java.osgi.embeddy.boot.ziper.NamesCache;
import net.java.osgi.embeddy.boot.ziper.ZiPFileLoader;
import net.java.osgi.embeddy.boot.ziper.ZiPClassLoader;
import net.java.osgi.embeddy.boot.ziper.ZiPScanner;
import net.java.osgi.embeddy.boot.ziper.ZiPArchive;
import net.java.osgi.embeddy.boot.ziper.ZiPScanner.ZiPVisitor;
import net.java.osgi.embeddy.boot.ziper.ZiPStorage;


/**
 * Scans boot JAR file including the nested archives.
 *
 * @author anton.baukin@gmail.com.
 */
public class BootJaRLoader implements Closeable
{
	public BootJaRLoader(File file, BootSet boot)
	{
		this.file    = EX.assertn(file);
		this.boot    = EX.assertn(boot);
		this.storage = EX.assertn(boot.createTempStorage());
	}

	public final File       file;
	public final BootSet    boot;
	public final ZiPStorage storage;


	/* Boot JAR Loader */

	public void        bootLoad()
	{
		//~: read the root archive
		readRoot();

		//~: map the archives
		mapBootArchives();

		//~: create the main loader
		createMainLoader();
	}

	public ClassLoader getMainLoader()
	{
		return mainLoader;
	}

	public ZiPArchive  getRootArchive()
	{
		return root;
	}


	/* Closeable */

	public void close()
	{
		try
		{
			storage.close();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while closing boot class loader!");
		}
	}


	/* protected: boot stages */

	protected ZiPArchive  root;
	protected ClassLoader mainLoader;

	protected void readRoot()
	{
		EX.assertx(root == null);

		//~: load the archive
		try
		{
			//~: scan this ZIP file
			ZiPScanner s = new ZiPScanner(file, createVisitor());
			this.root = s.scan();

			//~: store the root
			storage.permanent(this.root);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error had occured while loading ",
			  "contents of JAR: [", file.getAbsolutePath(), "]!");
		}
	}

	protected void mapBootArchives()
	{
		//~: find the boot jar files
		Set<FileItem> jars = new LinkedHashSet<FileItem>(11);
		findBootJars(jars);

		//~: map them by the archives
		archives = new LinkedHashMap<FileItem, ZiPArchive>(jars.size());
		for(FileItem jar : jars)
			archives.put(jar, null);

		mapBootJars(archives);
	}

	protected Map<FileItem, ZiPArchive> archives;

	protected void findBootJars(final Set<FileItem> jars)
	{
		//~: get boot path
		final String bp = EX.asserts(boot.getBootPath());
		FileObject   bd = EX.assertn(root.files.lookup(bp),
		  "Boot path [", bp, "] not found in top JAR file!");

		//?: {it must be directory}
		if(!(bd instanceof Directory))
			throw EX.ass("Boot path [", bp, "] is not a directory!");

		//~: collect the nested jar files
		FilePlains.each((Directory) bd, new EachFile()
		{
			public boolean takeFile(FileItem f)
			{
				EX.assertx(f.getName().toLowerCase().endsWith(".jar"),
				  "Boot path [", bp, "] has not a JAR file [", f.getName(), "]!");

				jars.add(f);
				return true;
			}
		});
	}

	protected void mapBootJars(Map<FileItem, ZiPArchive> zam)
	{
		//~: map all nested archives
		HashMap<FileItem, ZiPArchive> nm =
		  new HashMap<FileItem, ZiPArchive>(root.nested.size());
		for(ZiPArchive za : root.nested)
			nm.put(za.ref.file, za);

		//~: do map
		for(Map.Entry<FileItem, ZiPArchive> e : zam.entrySet())
		{
			ZiPArchive za = EX.assertn(nm.get(e.getKey()),
			  "No nested JAR Archive found for file [", e.getKey().getName(), "]!");

			e.setValue(za);
		}
	}

	protected void createMainLoader()
	{
		ZiPClassLoader res; this.mainLoader = res =
		  new ZiPClassLoader(EX.assertn(boot.getInitialLoader()));

		//~: connect file loaders
		for(ZiPArchive za : archives.values())
			res.connect(new ZiPFileLoader(za, storage));
	}


	/* protected: Boot ZiP Visitor */

	protected class BootVisitor implements ZiPVisitor
	{
		public NamesCache   createNamesCache(ZiPArchive archive)
		{
			return new PlainNamesCache();
		}

		public boolean      isAcrhive(ZiPArchive target)
		{
			return target.ref.getName().toLowerCase().endsWith(".jar");
		}

		public boolean      isThatAcrhive(ZiPArchive target)
		{
			if((target.level != 1) || !isAcrhive(target))
				return false;

			String path = FilePlains.path(target.ref);
			return path.startsWith(boot.getBootPath());
		}

		public boolean      isScanDown(ZiPArchive target)
		{
			return isThatAcrhive(target);
		}

		public OutputStream copyArchive(ZiPArchive target)
		  throws IOException
		{
			return !isThatAcrhive(target)?(null):(storage.temporary(target));
		}
	}

	protected BootVisitor  createVisitor()
	{
		return new BootVisitor();
	}
}