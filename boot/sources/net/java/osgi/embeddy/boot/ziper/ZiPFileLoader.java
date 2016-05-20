package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/* embeddy */

import net.java.osgi.embeddy.boot.EX;


/**
 * Class loader using {@link ZiPArchive}.
 * Note that this implementation has no parent
 * class loader and never refers up else ones.
 *
 * @author anton.baukin@gmail.com.
 */
public class ZiPFileLoader
{
	public ZiPFileLoader(ZiPArchive archive, ZiPStorage storage)
	{
		this.archive = EX.assertn(archive);
		this.zip     = EX.assertn(storage.access(archive),
		  archive, " is not in the storage!"
		);

		try
		{
			this.file = EX.assertn(storage.file(archive)).toURI().toString();
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	public final ZiPArchive archive;


	/* ZiP File Loader */

	public boolean     isFile(String file)
	{
		return (archive.files.lookup(file) instanceof FileItem);
	}

	public boolean     isDirectory(String file)
	{
		return (archive.files.lookup(file) instanceof Directory);
	}

	public byte[]      readFile(String file)
	{
		if(file.startsWith("/"))
			file = file.substring(1);

		ZipEntry    z = zip.getEntry(file);
		InputStream i = null;
		Exception   e = null;

		if(z == null) return null;
		EX.assertx(!z.isDirectory(), "Can't load file [", file,
		  "] in archive [", archive, "] as it's a directory!");

		try
		{
			int    s = (int) z.getSize(); if(s <= 0) s = 8192;
			byte[] b = new byte[256];

			ByteArrayOutputStream o = new ByteArrayOutputStream(s);
			i = EX.assertn(zip.getInputStream(z));

			while((s = i.read(b)) > 0)
				o.write(b, 0, s);

			o.close();
			return o.toByteArray();
		}
		catch(Exception x)
		{
			e = x;
		}
		finally
		{
			if(i != null) try
			{
				i.close();
			}
			catch(IOException x)
			{
				if(e == null) e = x;
			}
		}

		throw EX.wrap(e);
	}

	public URL         getResource(String file)
	{
		FileObject f = archive.files.lookup(file);

		//HINT: directories are also reported as a resources

		//?: {not found it}
		if(f == null)
			return null;

		if(file.startsWith("/"))
			file = file.substring(1);

		try
		{
			return new URL(String.format("jar:%s!/%s", this.file, file));
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	public URL         getResource(FileItem f)
	{
		String file = FilePlains.path(f);

		if(file.startsWith("/"))
			file = file.substring(1);

		try
		{
			return new URL(String.format("jar:%s!/%s", this.file, file));
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	public void        listDirectory(String file, boolean recursive, Collection<URL> res)
	{
		FileObject      d = archive.files.lookup(file);
		List<Directory> s = new ArrayList<Directory>(4);

		if(!(d instanceof Directory))
			throw EX.ass(archive, " file [", file, "] is not a directory!");
		s.add((Directory) d);

		while(!s.isEmpty())
		{
			d = s.remove(s.size() - 1);

			for(FileObject x : ((Directory)d).getNested())
				if(x instanceof FileItem)
					res.add(getResource((FileItem) x));
				else if(recursive)
					s.add((Directory) x);
		}
	}

	public InputStream getResourceAsStream(String name)
	{
		if(name.startsWith("/"))
			name = name.substring(1);

		ZipEntry z = zip.getEntry(name);
		if(z == null) return null;
		EX.assertx(!z.isDirectory(), "Can't stream file [", file,
		  "] in archive [", archive, "] as it's a directory!");

		try
		{
			return zip.getInputStream(z);
		}
		catch(Exception e)
		{
			throw EX.wrap(e, "Can't access resource [", name,
			  "] in archive [", archive, "]!");
		}
	}


	/* protected: ZiP File */

	protected final ZipFile zip;
	protected final String  file;
}