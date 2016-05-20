package net.java.osgi.embeddy.boot.ziper;

/* Java */

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/* embeddy */

import net.java.osgi.embeddy.boot.EX;


/**
 * Implementations and utilities related
 * to tiny elements of Virtual File System.
 *
 * @author anton.baukin@gmail.com.
 */
public class FilePlains
{
	/* Utilities */

	public static String path(FileObject f)
	{
		return path(null, f);
	}

	public static String path(String root, FileObject f)
	{
		StringBuilder s = new StringBuilder(64);

		EX.asserts(f.getName());
		s.append(f.getName());

		if(f instanceof FileItem)
			EX.assertx(f.getName().indexOf('/') == -1);

		while((f = f.getParent()) != null)
		{
			String n = EX.asserts(f.getName());
			EX.assertx(n.startsWith("/"));
			EX.assertx(n.endsWith("/"));

			if(s.charAt(0) == '/')
				n = n.substring(0, n.length() - 1);

			s.insert(0, n);
		}

		//?: {has root path}
		if((root != null) && !"/".equals(root))
		{
			EX.asserts(root);
			if(root.endsWith("/"))
				root = root.substring(0, root.length() - 1);
			s.append(root);
			if(!root.startsWith("/"))
				s.insert(0, '/'); //<-- the root '/'
		}

		return s.toString();
	}

	public static interface EachFile
	{
		/**
		 * Returns false to stop iteration.
		 */
		public boolean takeFile(FileItem f);
	}

	public static void   each(Directory d, EachFile v)
	{
		ArrayList<Directory> s = new ArrayList<Directory>(4);
		s.add(EX.assertn(d));

		while(!s.isEmpty())
		{
			d = s.remove(s.size() - 1);

			for(FileObject fo : d.getNested())
				if(fo instanceof Directory)
					s.add((Directory) fo);
				else if(!v.takeFile((FileItem) fo))
					return;
		}
	}


	/* Names Cache */

	public static class PlainNamesCache implements NamesCache
	{
		/* Names Cache */

		public FileObject lookup(String path)
		{
			EX.asserts(path);
			if(!path.startsWith("/")) path = "/" + path;

			//~: try it directly
			FileObject res = names.get(path);
			if(res != null) return res;

			//?: {has trailing '/'}
			if(path.endsWith("/"))
				path = path.substring(0, path.length() - 1);
			else
				path += '/'; //<-- as a directory

			return names.get(path);
		}

		public Directory  mkdirs(DirectoryHandler dh, String path)
		{
			EX.asserts(path);

			Directory d = (Directory) names.get("/");
			if(d == null) //?: {has no root created yet}
				names.put("/", d = dh.addDirectory(null, "/"));

			//~: normalized path
			String p = "/";
			for(int i = 0;(i < path.length());)
			{
				int j = path.indexOf('/', i);

				//?: {done creating}
				if(j == -1) break;

				//?: {empty name} skip
				if(i == j) { i = j + 1; continue; }

				//~: the name & the path
				String n = EX.asserts(path.substring(i, j));
				String x = p + n + '/';

				FileObject f = names.get(x);
				if(f != null)
					EX.assertx(f instanceof Directory);
				else
				{
					f = dh.addDirectory(d, "/" + n + '/');
					names.put(x, f);
				}

				//~: advance
				d = (Directory) f;
				p = x; i = j + 1;
			}

			return d;
		}

		public FileItem   touch(DirectoryHandler dh, String path)
		{
			//~: lookup
			EX.assertx(!path.endsWith("/"));
			FileObject f = lookup(path);
			if(f != null)
				return (FileItem) f;

			//~: make the directories
			Directory  d = mkdirs(dh, path);

			//~: find the file local name
			String n = EX.asserts(path);
			int    i = n.lastIndexOf('/');
			if(i != -1) n = n.substring(i + 1);
			EX.asserts(n);

			//~: create file & cache it
			f = dh.addFileItem(d, n);
			names.put(path(f), f);

			return (FileItem) f;
		}

		protected final Map<String, FileObject> names =
		  new ConcurrentHashMap<String, FileObject>(101);
	}


	/* Directory Record */

	public static class DirRecord implements Directory
	{
		public DirRecord(String name, Directory parent)
		{
			this.name = name;
			this.parent = parent;
		}


		/* File Object */

		public String getName()
		{
			return name;
		}

		private final String name;

		public Directory getParent()
		{
			return parent;
		}

		private final Directory parent;


		/* Directory */

		public List<FileObject> getNested()
		{
			return nested;
		}

		private final List<FileObject> nested =
		  new ArrayList<FileObject>(8);
	}


	/* File Record */

	public static class FileRecord implements FileItem
	{
		public FileRecord(String name, Directory parent)
		{
			this.name = name;
			this.parent = parent;
		}


		/* File Object */

		public String getName()
		{
			return name;
		}

		private final String name;

		public Directory getParent()
		{
			return parent;
		}

		private final Directory parent;
	}
}