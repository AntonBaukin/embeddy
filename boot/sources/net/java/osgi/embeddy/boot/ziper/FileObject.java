package net.java.osgi.embeddy.boot.ziper;

/**
 * A file or directory in a simplified
 * Virtual File System.
 *
 * @author anton.baukin@gmail.com.
 */
public interface FileObject
{
	/* File Object */

	public String    getName();

	public Directory getParent();
}