package net.java.osgi.embeddy.app.db;

/* Java */

import java.io.File;
import java.util.Map;

/* application */

import net.java.osgi.embeddy.app.secure.SecDigest;


/**
 * Component that abstracts method of storing
 * large files: in database BLOBs, or as regular
 * files in the file system.
 *
 * @author anton.baukin@gmail.com.
 */
public interface FilesStore
{
	/* Files Store */

	/**
	 * Saves the content of the file from the digest
	 * stream given. The stream is closed within, and
	 * SHA-1 control sum becomes available.
	 *
	 * File object contains fields stored in the
	 * database document of the file.
	 *
	 * Removes the content of the file from the storage
	 * leaving the file object in the database if the
	 * input stream is undefined.
	 */
	public void     save(Map<String, Object> fo, SecDigest.Stream di);

	/**
	 * Writes the content of the file to a file,
	 * or provides existing content.
	 */
	public FileDump dump(Map<String, Object> fo);

	/**
	 * Does clean of the obsolete files.
	 * Invoked on each start of the application.
	 *
	 * Note: at the moment of this call no clients
	 * are connected, and concurrent requests for
	 * the files are not possible. Component has
	 * exclusive access to the storage.
	 */
	public void     cleanup();


	/* File Dump */

	public static interface FileDump extends AutoCloseable
	{
		/**
		 * Creates temporary file (if files are not stored
		 * in the local file system) and dumps there the
		 * content, or provides existing (persistent) file.
		 * Temporary files are removed on close.
		 */
		public File file();
	}
}
