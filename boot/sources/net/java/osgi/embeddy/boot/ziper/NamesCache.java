package net.java.osgi.embeddy.boot.ziper;

/**
 * Collection of full names of File Objects
 * of a simplified Virtual File System.
 *
 * @author anton.baukin@gmail.com.
 */
public interface NamesCache
{
	/* Names Cache */

	/**
	 * Returns file object by the path given.
	 * The file names separators are '/'.
	 * The root directory also starts with
	 * '/'. Each directory path may end with
	 * final '/', or may not.
	 */
	public FileObject lookup(String path);

	/**
	 * Creates itermediate directories for
	 * the given path using '/' as separator.
	 * If path doesn't end with '/', it is
	 * assumed as a file-path.
	 *
	 * Returns the innest directory of the path.
	 */
	public Directory  mkdirs(DirectoryHandler dh, String path);

	public FileItem   touch(DirectoryHandler dh, String path);


	/* Directory Handler */

	public static interface DirectoryHandler
	{
		public Directory addDirectory(Directory parent, String name);

		public FileItem  addFileItem(Directory dir, String name);
	}
}