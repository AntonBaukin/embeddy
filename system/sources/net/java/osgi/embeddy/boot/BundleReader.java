package net.java.osgi.embeddy.boot;

/* Java */

import java.io.IOException;
import java.io.InputStream;
import java.util.jar.Attributes;
import java.util.jar.Manifest;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/* OSGi */

import org.osgi.framework.Version;


/**
 * Loads and reads bundle manifest file.
 *
 * @author anton.baukin@gmail.com.
 */
public class BundleReader
{
	public BundleReader(String file)
	{
		this.file = file;
	}

	public final String file;


	/* Bundle Reader */

	public void    read(InputStream jar)
	  throws IOException
	{
		ZipInputStream zis = new ZipInputStream(jar);

		ZipEntry ze; while((ze = zis.getNextEntry()) != null)
		{
			if(MF.equalsIgnoreCase(ze.getName()))
			{
				mf = new Manifest(zis);
				break;
			}
		}
	}

	public boolean foundManifest()
	{
		return (mf != null);
	}

	public String  getManifestAttr(String name)
	{
		EX.assertn(mf, "Bundle [", file, "] MANIFEST.MF is not found!");

		Attributes a = EX.assertn(mf.getMainAttributes(),
		  "Bundle [", file, "] MANIFEST.MF has no attributes!");

		String v = a.getValue(name);
		if(v != null) v = v.trim();
		return (v == null)?(null):(v.isEmpty())?(null):(v);
	}

	public String  getSymbolicName()
	{
		return EX.assertn(getManifestAttr("Bundle-SymbolicName"),
		  "Bundle [", file, "] has no Bundle-SymbolicName!");
	}

	public Version getVersion()
	{
		String v = getManifestAttr("Bundle-Version");
		return (v != null)?(new Version(v)):(Version.emptyVersion);
	}


	/* protected: reader state */

	protected final String MF = "META-INF/MANIFEST.MF";
	protected Manifest     mf;
}