package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.ZipFile;

/* embeddy: zip file system */


/**
 * Container that stores ZIP archives
 * in the file system.
 *
 * @author anton.baukin@gmail.com.
 */
public interface ZiPStorage extends Closeable
{
	/* ZiP Storage */

	/**
	 * Directly drives archive having file.
	 * Note that that file always stays intact.
	 */
	public void         permanent(ZiPArchive za)
	  throws IOException;

	/**
	 * Returns stream to write archive bytes into
	 * a temporary file somewhere in the file system.
	 *
	 * Note that files are removed on the storage close.
	 * If target archive has no file assigned, assigns
	 * temporary file to that field.
	 */
	public OutputStream temporary(ZiPArchive za)
	  throws IOException;

	/**
	 * Returns ZIP File object.
	 *
	 * Note that it is closed on the storage
	 * close and may not be closed elsewhere!
	 */
	public ZipFile      access(ZiPArchive za);

	public File         file(ZiPArchive za);
}