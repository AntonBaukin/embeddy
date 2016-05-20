package net.java.osgi.embeddy.boot;

/* Java */

import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/* OSGi */

import org.osgi.framework.Bundle;
import org.osgi.framework.FrameworkEvent;
import org.osgi.framework.FrameworkListener;
import org.osgi.framework.Version;
import org.osgi.framework.launch.Framework;
import org.osgi.framework.startlevel.BundleStartLevel;
import org.osgi.framework.startlevel.FrameworkStartLevel;

/* embeddy: zip file system */

import net.java.osgi.embeddy.boot.ziper.Directory;
import net.java.osgi.embeddy.boot.ziper.FileItem;
import net.java.osgi.embeddy.boot.ziper.FilePlains;
import net.java.osgi.embeddy.boot.ziper.FilePlains.EachFile;
import net.java.osgi.embeddy.boot.ziper.FileObject;


/**
 * Class that handles extraction and update of the bundles
 * integrated in the application archive. It installs and
 * starts OSGi bundles in the framework.
 *
 * @author anton.baukin@gmail.com.
 */
public class Bundler implements Closeable
{
	public Bundler(BootSet boot)
	{
		this.boot = EX.assertn(boot);
	}

	public final BootSet boot;


	/* Bundles Handling */

	public void init()
	{
		logger = LU.logger(this.getClass());

		//~: take bundles directory
		final String S = "org.osgi.framework.storage";
		String       s = boot.get(S);

		//?: {lookup shorter variant}
		if(s == null)
		{
			String    x = boot.manifested("Storage-Property");
			if(x != null) s = boot.get(x);
		}

		//?: {has storage defined}
		if(s != null)
		{
			EX.asserts(s, "Incorrect whitespaces in OSGi [", S, "] value!");

			storage = new File(s);
			LU.info(logger, "taking provided OSGi storage [",
			  storage.getAbsolutePath(), "]");
		}
		//~: create temporary storage
		else try
		{
			storage = File.createTempFile("EmbeddyOSGiStorage", "");
			EX.assertx(storage.exists() && storage.delete());
			temporary = true;

			LU.info(logger, "created temporary OSGi storage [",
			  storage.getAbsolutePath(), "]");
		}
		catch(IOException e)
		{
			throw EX.wrap(e, "Error occurred while creating temporary OSGi storage!");
		}

		//~: create directory on demand
		if(!storage.exists())
			EX.assertx(storage.mkdirs(),
			  "Coludn't create OSGi storage directory [",
			  storage.getAbsolutePath(), "]!"
			);

		//?: {not accessible directory}
		EX.assertn(storage.isDirectory() && storage.canWrite(),
		  "OSGi storage [", storage.getAbsolutePath(),
		  "] is not a directory, or can't write to it!"
		);

		boot.set(S, storage.getAbsolutePath());
	}

	public void install(Object framework)
	{
		//~: assign the framework
		if(!(framework instanceof Framework))
			throw EX.state("Class [", framework.getClass().getName(),
			  "] is not an OSGi Framework!");
		this.framework = (Framework) framework;

		//~: find the bundles
		String[] names = findArchiveBundles();
		if(names.length == 0)
		{
			LU.warn(logger, "application JAR has no OSGi bundles included!");
			return;
		}

		//~: and read them
		readArchiveBundles(names);

		//~: install or update bundles
		installOrUpdate();

		//~: explode the configuration files
		explodeConfig();
	}

	public void start()
	{
		EX.assertn(framework);
		FrameworkStartLevel fsl = (FrameworkStartLevel)
		  framework.adapt(FrameworkStartLevel.class);

		//~: wait for the start
		final CountDownLatch    waitee = new CountDownLatch(1);
		final FrameworkListener waiter = new FrameworkListener()
		{
			public void frameworkEvent(FrameworkEvent event)
			{
				waitee.countDown();
			}
		};

		//~: move framework to the target start level
		int sl = 1; try
		{
			sl = getTargetStartLevel();

			if(fsl.getStartLevel() < sl)
			{
				//~: assign the level
				fsl.setStartLevel(sl, new FrameworkListener[]{ waiter });

				//~: wait it
				waitee.await();

				LU.info(logger, "moved OSGi framework to start level [", sl, "]");
			}
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while moving OSGi framework to [",
			  sl, "] start level!");
		}

		//~: inspect the bundles
		Bundle[] bs = framework.getBundleContext().getBundles();
		Arrays.sort(bs, StartLevelCmp.INSTANCE);

		int active = 0;
		for(Bundle b : bs)
		{
			final int A = Bundle.ACTIVE;
			final int X = Bundle.STARTING;
			final int I = Bundle.INSTALLED;
			final int R = Bundle.RESOLVED;
			final int s = b.getState();

			if((s == X) | (s == A))
			{
				LU.info(logger, "bundle [", b.getSymbolicName(), "] is ACTIVE!");
				active++;
				continue;
			}

			if((s == I) | (s == R)) try
			{
				LU.info(logger, "initial start of bundle [", b.getSymbolicName(), "]");
				b.start();
			}
			catch(Throwable e)
			{
				throw EX.wrap(e, "Error occurred while starting bundle [",
				  b.getSymbolicName(), "]!");
			}

			if((b.getState() != X) & (b.getState() != A))
				LU.warn(logger, "bundle [", b.getSymbolicName(), "] is NOT ACTIVE!");
			else
				active++;
		}

		if(active == bs.length)
			LU.info(logger, "successfully started all OSGi bundles!");
		else
			LU.warn(logger, "started only [", active,
			  "] of [", bs.length, "] OSGi bundles!");
	}

	public void stop()
	{
		EX.assertn(framework);

		if(framework.getState() == Framework.ACTIVE) try
		{
			//~: issue stop
			LU.info(logger, "stopping OSGi framework");
			framework.stop();

			//~: wait for stop
			framework.waitForStop(0L);
		}
		catch(Throwable e)
		{
			LU.error(logger, e, "Error occured while stopping OSGi framework!");
		}
	}

	/**
	 * Closes the persistent storage and removes
	 * the temporary archives previously extracted.
	 * This method must work even when extraction fails!
	 */
	public void close()
	{
		Throwable err = null;

		//?: {storage is closed}
		if((storage == null) || !storage.exists())
			return;

		//~: clear the storage
		try
		{
			clearStorage();
		}
		catch(Throwable e)
		{
			err = e;
		}
		finally
		{
			framework = null;
		}

		if(err != null)
			throw EX.wrap(err);

		LU.info(logger, "OSGi bundles strategy is now closed");
	}

	protected Object    logger;
	protected File      storage;
	protected boolean   temporary;
	protected Framework framework;


	/* protected: bundles handling */

	protected void     clearStorage()
	  throws IOException
	{
		//?: {is temporary storage} remove it
		if(temporary)
		{
			LU.info(logger, "erasing temporary OSGi bundles storage [",
			  storage.getAbsolutePath(), "]");

			if(!removePath(storage))
				LU.warn(logger, "couldn't fully clear temporary OSGi bundles storage [",
				  storage.getAbsolutePath(), "]!");
		}
		else
		{
			LU.info(logger, "leaving as-is provided OSGi bundles storage [",
			  storage.getAbsolutePath(), "]");
		}
	}

	/**
	 * Returns false when the specified file or directory
	 * was not actually deleted, and must be deleted on exit.
	 */
	protected boolean  removePath(File f)
	  throws IOException
	{
		if(!f.isDirectory())
			if(f.delete())
				return true;
			else
			{
				f.deleteOnExit();
				return false;
			}

		File[]  fs  = f.listFiles();
		boolean now = true;
		if(fs != null) for(File x : fs)
			now = now & removePath(x);

		if(now && f.delete())
			return true;

		f.deleteOnExit();
		return false;
	}

	protected String[] findArchiveBundles()
	{
		//~: take the bundles path
		String     p = EX.asserts(boot.getBundlesPath());
		FileObject d = EX.assertn(boot.getRootArchive().files.lookup(p),
		  "Root JAR has no bundles path [", p, "]!");

		EX.assertn(boot.getRootArchive().file);
		if(!(d instanceof Directory))
			throw EX.ass("Root JAR bundles path [", p, "] is not a directory!");

		Set<String> names = new LinkedHashSet<String>(5);
		for(FileObject f : ((Directory)d).getNested())
		{
			//?: {not a jar file}
			if(!f.getName().endsWith(".jar"))
				continue;

			//?: {not a file}
			if(!(f instanceof FileItem))
				continue;

			names.add(FilePlains.path(f));
		}

		return names.toArray(new String[names.size()]);
	}

	protected void     readArchiveBundles(String[] names)
	{
		ZipFile zip = boot.getRootZip();

		for(String name : names) try
		{
			BundleReader br = new BundleReader(name);
			ZipEntry     ze = EX.assertn(zip.getEntry(
			  name.startsWith("/")?(name.substring(1)):(name)));
			InputStream  zi = zip.getInputStream(ze);

			//~: scan the archive
			try
			{
				br.read(zi);
			}
			finally
			{
				zi.close();
			}

			//?: {has no manifest}
			EX.assertx(br.foundManifest(),
			  "Bundle file [", name, "] contains no manifest!");

			//~: access the symbolic name
			String sn = br.getSymbolicName();
			if(readers.containsKey(sn))
				throw EX.ass("Bundle file [", name, "] with Symbolic name [",
				  sn, "] has this name duplicated in this bundle: [",
				  readers.get(sn).file, "]!");

			//!: append the reader
			readers.put(sn, br);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while scanning bundle archive [", name, "]!");
		}
	}

	/**
	 * Maps bundle archive symbolic name to the reader.
	 */
	protected final Map<String, BundleReader> readers =
	  new HashMap<String, BundleReader>(5);

	protected void     installOrUpdate()
	{
		//~: map installed bundles
		Map<String, Bundle> im = new HashMap<String, Bundle>(7);
		Bundle[]            bs = framework.getBundleContext().getBundles();
		if(bs == null) bs = new Bundle[0];
		for(Bundle b : bs)
		{
			EX.assertn(b.getSymbolicName(), "Installed OSGi bundle [",
			  b.getLocation(), "] has no Symbolic name!");

			EX.assertx(!im.containsKey(b.getSymbolicName()),
			  "Not unique bundle having Symbolic name [", b.getSymbolicName(),
			  "] is installed by location [", b.getLocation(), "]!"
			);

			im.put(b.getSymbolicName(), b);
		}

		//HINT: we scan for bundles with manifest-defined start
		//  level and put all other bundles to start level +1.

		//~: start levels handling
		HashSet<Bundle> sls = new HashSet<Bundle>(Arrays.asList(bs));
		int             msl = 1;

		//c: for each bundle from the archive
		for(Map.Entry<String, BundleReader> re : readers.entrySet())
		{
			Bundle b = im.get(re.getKey());

			//?: {has that bundle}
			if(b != null)
			{
				sls.add(b);

				Version v0 = b.getVersion();
				Version v1 = re.getValue().getVersion();

				//?: {installed is not older}
				if(v0.compareTo(v1) >= 0)
				{
					LU.info(logger, "found installed OSGi bundle [", re.getKey(),
					  "]; version = ", v0);

					continue;
				}

				LU.info(logger, "updating installed OSGi bundle [", re.getKey(),
				  "]; version = ", v0, " with newer version = ", v1);

				//!: update it
				updateBundle(b, re.getValue());
			}
			else
			{
				LU.info(logger, "installing OSGi bundle [", re.getKey(),
				  "]; version = ", re.getValue().getVersion());

				b = installBundle(re.getValue());
				sls.add(b);
			}

			//~: assign the start level
			int sl = assignStartLevel(b, re.getValue());
			if(sl >= 1)
			{
				sls.remove(b);
				if(sl >= msl) msl = sl + 1;
			}
		}

		//~: assign the start levels
		sls.remove(framework);
		assignStartLevels(sls, msl);
	}

	protected void     updateBundle(Bundle b, BundleReader r)
	{
		//!: remove the bundle
		if(b.getState() != Bundle.UNINSTALLED) try
		{
			b.uninstall();
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error occurred while uninstalling OSGi bundle [",
			  r.getSymbolicName(), "] at [", b.getLocation(), "]!");
		}

		//!: install it
		installBundle(r);
	}

	protected Bundle   installBundle(BundleReader r)
	{
		String location = r.file;

		try
		{
			location = getBundleLocation(location);
			return framework.getBundleContext().installBundle(location);
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Failed installing OSGi bundle from location [",
			  location, "]!");
		}
	}

	protected int      assignStartLevel(Bundle b, BundleReader r)
	{
		String s = boot.get("StartLevel-" + r.getSymbolicName());
		if(s == null) return -1;
		int    i = Integer.parseInt(s.trim());
		EX.assertx(i >= 1);

		((BundleStartLevel) b.adapt(BundleStartLevel.class)).setStartLevel(i);
		LU.info(logger, "set bundle [", b.getSymbolicName(),
		  "] start level to [", i, "]");

		return i;
	}

	protected void     assignStartLevels(Collection<Bundle> bs, int sl)
	{
		for(Bundle b : bs)
		{
			BundleStartLevel bsl = (BundleStartLevel)
			  b.adapt(BundleStartLevel.class);

			if(bsl.getStartLevel() < sl)
			{
				bsl.setStartLevel(sl);

				LU.info(logger, "set bundle [", b.getSymbolicName(),
				  "] start level to [", sl, "]");
			}
		}
	}

	protected int      getTargetStartLevel()
	{
		Bundle[] bs = framework.getBundleContext().getBundles();
		int      sl = 1;

		for(Bundle b : bs)
		{
			int i = ((BundleStartLevel) b.adapt(BundleStartLevel.class)).getStartLevel();
			if(i > sl) sl = i;
		}

		return sl;
	}

	protected String   getBundleLocation(String file)
	{
		if(file.startsWith("/"))
			file = file.substring(1);

		try
		{
			return new URL(String.format("jar:%s!/%s",
			  boot.getRootArchive().file.toURI().toString(), file)).
			  toString();
		}
		catch(Exception e)
		{
			throw EX.wrap(e);
		}
	}

	protected void     explodeConfig()
	{
		//~: explode root
		String path = boot.manifested("Explode-Root");
		if(path == null) return;
		EX.asserts(path, "Explode-Root manifest setting is incorrect!");

		//~: access it
		final FileObject d = boot.getRootArchive().files.lookup(path);
		if(!(d instanceof Directory))
		{
			LU.warn(logger, "Explode root [", path,
			  "] is not found, or not a directory!");

			return;
		}

		FilePlains.each((Directory)d, new EachFile()
		{
			public boolean takeFile(FileItem f)
			{
				explodeConfigFile((Directory)d, f);
				return true;
			}
		});
	}

	protected void     explodeConfigFile(Directory r, FileItem f)
	{
		//~: prepare target file absolute name
		String t = storage.getAbsolutePath();
		if(t.endsWith(File.separator))
			t = t.substring(0, t.length() - File.separator.length());

		String u = FilePlains.path(r);
		String n = FilePlains.path(f);

		//~: remove explode root
		EX.assertx(n.startsWith(u));
		String p = n.substring(u.length());
		EX.assertx(!p.startsWith("/"));
		p = File.separator + p.replace("/", File.separator);

		//~: x - file, y - it's target directory
		File x = new File(t + p);
		File y = x.getParentFile();

		//~: ensure the directory is created
		if(y.exists())
			EX.assertx(y.isDirectory(), "Not a explode directory [",
			  y.getAbsolutePath(), "]!");
		else
			EX.assertx(y.mkdirs(), "Coudn't create explode directory [",
			  y.getAbsolutePath(), "]!");

		//?: {file exists} break
		if(x.exists() && (x.length() != 0L))
			return;

		try
		{
			//~: create the file
			if(!x.exists()) EX.assertx(x.createNewFile(),
			  "Coudn't create explode file [", x.getAbsolutePath(), "]!");

			//~: write it
			ZipFile      z = boot.getRootZip();
			ZipEntry     e = EX.assertn(z.getEntry(n.substring(1)));
			InputStream  i = z.getInputStream(e);
			OutputStream o = new FileOutputStream(x);
			byte[]       b = new byte[512];

			try
			{
				for(int s;((s = i.read(b)) > 0);)
					o.write(b, 0, s);
			}
			finally
			{
				try
				{
					i.close();
				}
				finally
				{
					o.close();
				}
			}
		}
		catch(Throwable e)
		{
			throw EX.wrap(e, "Error while copying exploded file [",
			  x.getAbsolutePath(), "]!");
		}
	}


	protected static class StartLevelCmp implements Comparator<Bundle>
	{
		public static StartLevelCmp INSTANCE = new StartLevelCmp();

		public int compare(Bundle l, Bundle r)
		{
			int x = ((BundleStartLevel) l.adapt(BundleStartLevel.class)).getStartLevel();
			int y = ((BundleStartLevel) r.adapt(BundleStartLevel.class)).getStartLevel();
			return (x == y)?(0):(x < y)?(-1):(+1);
		}
	}
}