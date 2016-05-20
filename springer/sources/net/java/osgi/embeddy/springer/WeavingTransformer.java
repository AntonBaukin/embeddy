package net.java.osgi.embeddy.springer;

/* Java */

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.IllegalClassFormatException;
import java.security.ProtectionDomain;
import java.util.ArrayList;
import java.util.List;


/**
 * ClassFileTransformer-based weaver, allowing for
 * a list of transformers to be applied on a class
 * byte array. Normally used inside class loaders.
 *
 * @author Rod Johnson, Costin Leau, Juergen Hoeller
 */
final class WeavingTransformer
{
	public WeavingTransformer(ClassLoader loader)
	{
		this.loader = EX.assertn(loader);
	}


	/* Weaving Transformer */

	/**
	 * Add a class file transformer to be applied by this weaver.
	 */
	public void addTransformer(ClassFileTransformer transformer)
	{
		this.transformers.add(EX.assertn(transformer));
	}


	/**
	 * Apply transformation on a given class byte definition.
	 * The method will always return a non-null byte array
	 * (if no transformation has taken place the array content
	 * will be identical to the original one).
	 *
	 * @return (possibly transformed) class byte definition
	 */
	public byte[] transformIfNecessary(String className, byte[] bytes)
	{
		String internalName = className.replace(".", "/");
		return transformIfNecessary(className, internalName, bytes, null);
	}

	public byte[] transformIfNecessary(String className,
	  String internalName, byte[] bytes, ProtectionDomain pd)
	{
		byte[] result = bytes;

		for(ClassFileTransformer cft : this.transformers) try
		{
			byte[] transformed = cft.transform(
			  this.loader, internalName, null, pd, result);

			if(transformed != null)
				result = transformed;
		}
		catch(IllegalClassFormatException ex)
		{
			throw EX.wrap(ex, "Class file [", className,
			  "] transformation had failed!");
		}

		return result;
	}

	private final ClassLoader loader;

	private final List<ClassFileTransformer> transformers = new
	  ArrayList<ClassFileTransformer>();
}