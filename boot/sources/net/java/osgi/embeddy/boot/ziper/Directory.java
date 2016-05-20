package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.util.List;


/**
 * Directory of files and other directories
 * within a simplified Virtual File System.
 *
 * @author anton.baukin@gmail.com.
 */
public interface Directory extends FileObject
{
	/* Directory */

	public List<FileObject> getNested();
}