package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.EX;
import net.java.osgi.embeddy.boot.ziper.ZiPScanner.ZiPFile;
import net.java.osgi.embeddy.boot.ziper.ZiPScanner.ZiPVisitor;


/**
 * ZIP archive record.
 *
 * @author anton.baukin@gmail.com.
 */
public class ZiPArchive
{
	/**
	 * File of the root ZIP archive.
	 * Defined only for root archive entry.
	 */
	public final File file;

	/**
	 * The level of archives nesting.
	 * Root one has index 0.
	 */
	public final int level;

	/**
	 * Reference of this nested
	 * archive in the parent one.
	 */
	public final ZiPFile ref;

	/**
	 * Files of this archive.
	 */
	public final NamesCache files;

	/**
	 * Files of the nested archives.
	 */
	public final List<ZiPArchive> nested;


	public ZiPArchive(ZiPVisitor v, File file)
	{
		this.file   = file;
		this.level  = 0;
		this.ref    = null;
		this.nested = new ArrayList<ZiPArchive>(4);
		this.files  = v.createNamesCache(this);
	}

	public ZiPArchive(ZiPVisitor v, ZiPFile ref)
	{
		this.file   = null;
		this.level  = ref.archive.level + 1;
		this.ref    = EX.assertn(ref);
		this.nested = new ArrayList<ZiPArchive>(0);
		this.files  = v.createNamesCache(this);
	}


	/* Object */

	public String toString()
	{
		if(file != null)
			return String.format("ZiPArchive [%s]", file.getAbsolutePath());

		if(ref != null)
			return String.format("%s -> [%s]",
			  ref.archive.toString(), FilePlains.path(ref.file));

		return "ZiPArchive [???]";
	}
}
