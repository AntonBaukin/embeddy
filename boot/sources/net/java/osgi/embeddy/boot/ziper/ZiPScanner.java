package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/* embeddy */

import net.java.osgi.embeddy.boot.EX;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.ziper.FilePlains.DirRecord;
import net.java.osgi.embeddy.boot.ziper.FilePlains.FileRecord;
import net.java.osgi.embeddy.boot.ziper.NamesCache.DirectoryHandler;


/**
 * Implementation of ZIP archive files scanning
 * to collect files and directories referring
 * files in that archives. Nested archives
 * are also supported.
 *
 * @author anton.baukin@gmail.com.
 */
public class ZiPScanner
{
	/* ZiP Scanner */

	/**
	 * Callback strategy to scan hierarchy of archives.
	 */
	public static interface ZiPVisitor
	{
		/* ZiP Visitor */

		public NamesCache   createNamesCache(ZiPArchive archive);

		/**
		 * Answers whether scan down the given nested file.
		 * The call must also check (by the name) that
		 * this file is an ZIP archive.
		 */
		public boolean      isScanDown(ZiPArchive target);

		/**
		 * Allows to create a copy of archive. The stream
		 * is closed at the end. Return null not to make a copy.
		 *
		 * Note that target file must be checked againts it
		 * is an archive as in {@link #isScanDown(ZiPArchive)}.
		 */
		public OutputStream copyArchive(ZiPArchive archive)
		  throws IOException;
	}


	public ZiPScanner(File zip, ZiPVisitor visitor)
	{
		this.root    = new ZiPArchive(visitor, zip);
		this.visitor = visitor;
	}

	public ZiPArchive scan()
	  throws IOException
	{
		//~: create the handler
		EX.assertx(this.dhandler == null);
		this.dhandler = createHandler();

		//~: open the stream
		ZipInputStream stream =
		  new ZipInputStream(new BufferedInputStream(
		    new FileInputStream(root.file), 8192));

		try
		{
			scan(root, stream);
		}
		finally
		{
			stream.close();
		}

		return root;
	}


	/* protected: scan procedure */

	protected void scan(ZiPArchive za, ZipInputStream zs)
	  throws IOException
	{
		ZipEntry ze;

		while((ze = zs.getNextEntry()) != null) try
		{
			//?: {this is a directory}
			if(ze.isDirectory())
			{
				this.dhandler.archive = za;
				za.files.mkdirs(this.dhandler, ze.getName());
				continue;
			}

			//~: make intermediate directories & create the file
			this.dhandler.archive = za;
			FileItem f = za.files.touch(this.dhandler, ze.getName());

			//~: possible nested archive
			ZiPArchive na = new ZiPArchive(visitor, new ZiPFile(za, f));

			//~: request to make a copy
			InputStream  zips = zs;
			OutputStream copy = visitor.copyArchive(na);
			if(copy != null)
				zips = new TeeInputStream(zs, copy);

			//?: {go into that archive}
			if(visitor.isScanDown(na))
			{
				//~: link nested archive
				za.nested.add(na);

				//~: open sub-stream & scan it recursively
				ZipInputStream sub =
				  new ZipInputStream(new NotCloseInput(zips));

				try
				{
					scan(na, sub);
				}
				finally
				{
					sub.close();
				}
			}

			//~: drain all the remaining bytes
			if(copy != null)
			{
				if(buffer == null)
					buffer = new byte[512];

				//~: skip the content bytes (via tee)
				try
				{
					while(zips.read(buffer) > 0) ;
				}
				finally
				{
					copy.close();
				}
			}
		}
		finally
		{
			zs.closeEntry();
		}
	}

	protected final ZiPArchive root;
	protected final ZiPVisitor visitor;
	protected Handler          dhandler;
	protected byte[]           buffer;


	/* protected: directory handler and file objects */

	protected class Handler implements DirectoryHandler
	{
		public Directory addDirectory(Directory parent, String name)
		{
			EX.assertn(archive);
			ZiPDirectory d = new ZiPDirectory(archive, name, parent);

			if(parent != null)
			{
				EX.assertx(parent instanceof ZiPDirectory);
				parent.getNested().add(d);
			}

			return d;
		}

		public FileItem  addFileItem(Directory parent, String name)
		{
			EX.assertn(archive);
			ZiPFile f = new ZiPFile(archive, name, parent);

			if(parent != null)
			{
				EX.assertx(parent instanceof ZiPDirectory);
				parent.getNested().add(f);
			}

			return f;
		}

		public ZiPArchive archive;
	}

	protected Handler createHandler()
	{
		return new Handler();
	}

	public static class ZiPDirectory extends DirRecord
	{
		public final ZiPArchive archive;

		public ZiPDirectory(ZiPArchive archive, String name, Directory parent)
		{
			super(name, parent);
			this.archive = archive;
		}
	}

	public static class ZiPFile implements FileItem
	{
		public final ZiPArchive archive;
		public final FileItem   file;

		public ZiPFile(ZiPArchive archive, FileItem file)
		{
			this.archive = archive;
			this.file = file;
		}

		public ZiPFile(ZiPArchive archive, String name, Directory parent)
		{
			this.archive = archive;
			this.file    = new FileRecord(name, parent);
		}


		/* File Object */

		public String getName()
		{
			return file.getName();
		}

		public Directory getParent()
		{
			return file.getParent();
		}
	}


	/* protected: support */

	protected static class NotCloseInput extends FilterInputStream
	{
		public NotCloseInput(InputStream in)
		{
			super(in);
		}

		public void close()
		  throws IOException
		{}
	}
}