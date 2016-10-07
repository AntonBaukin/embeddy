package net.java.osgi.embeddy.springer.support;

/**
 * Mark exception class with this interface
 * to indicate the the error must not be reported.
 *
 * @author anton.baukin@gmail.com
 */
public interface HiddenError
{
	/**
	 * Tells that after processing on the uppest
	 * level of the application stack this error
	 * must not be futher reported.
	 */
	default boolean isTransparent()
	{
		return false;
	}
}