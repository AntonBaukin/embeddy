package net.java.osgi.embeddy.boot;

/**
 * OSGi program entry point.
 *
 * @author anton.baukin@gmail.com.
 */
public class Main
{
	/* public: program entry point */

	public static void main(String[] argv)
	  throws Exception
	{
		new BootLegger().init().prepare().launch();
	}
}