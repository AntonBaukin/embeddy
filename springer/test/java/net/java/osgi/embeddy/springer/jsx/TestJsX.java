package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.StringWriter;

/* JUnit */

import org.junit.Before;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;



/**
 * Tests {@link JsX} implementation.
 *
 * @author anton.baukin@gmail.com.
 */
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class TestJsX
{
	@Before
	public  void prepareJsX()
	{
		(jsX = new JsX()).setRoots(
		  "net.java.osgi.embeddy.springer.jsx " +
		  "net.java.osgi.embeddy.springer.jsx.tests"
		);
	}

	protected JsX jsX;

	@Test
	public void test00HelloWorld()
	{
		StringWriter s = new StringWriter();
		final String T = String.format("%s%n", "Hello, World!");

		jsX.invoke("HelloWorld", "helloWorld", s);
		EX.assertx(EX.eq(T, s.toString()));
	}

	@Test
	public void test01Checks()
	{
		jsX.invoke("TestZeT", "testChecks");
	}

	@Test
	public void test02Asserts()
	{
		jsX.invoke("TestZeT", "testAsserts");
	}

	@Test
	public void test03Arrays()
	{
		jsX.invoke("TestZeT", "testArrays");
	}

	@Test
	public void test04BasicsObject()
	{
		jsX.invoke("TestZeT", "testBasicsObject");
	}

	@Test
	public void test05BasicsFunction()
	{
		jsX.invoke("TestZeT", "testBasicsFunction");
	}

	@Test
	public void test06BasicsHelper()
	{
		jsX.invoke("TestZeT", "testBasicsHelper");
	}

	@Test
	public void test07Strings()
	{
		jsX.invoke("TestZeT", "testStrings");
	}

	@Test
	public void test08Classes()
	{
		jsX.invoke("TestZeT", "testClasses");
	}

	@Test
	public void test09Console()
	{
		StringWriter o = new StringWriter();
		StringWriter e = new StringWriter();

		jsX.invoke("TestZeT", "testConsole",
		  new JsStreams().output(o).error(e)
		);

		final String O = "This is 0-sample! Did you here 1,2,3?\n";
		EX.assertx(O.equals(o.toString()));

		final String E = "This is a sound of error...\n";
		EX.assertx(E.equals(e.toString()));
	}
}