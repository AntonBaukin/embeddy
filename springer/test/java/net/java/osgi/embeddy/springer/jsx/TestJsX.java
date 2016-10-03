package net.java.osgi.embeddy.springer.jsx;

/* Java */

import java.io.StringWriter;

/* JUnit */

import org.junit.runners.MethodSorters;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Tests {@link JsX} implementation.
 *
 * @author anton.baukin@gmail.com.
 */
@org.junit.FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class TestJsX
{
	@org.junit.Before
	public void prepareJsX()
	{
		(jsX = new JsX()).setRoots(
		  "net.java.osgi.embeddy.springer.jsx " +
		  "net.java.osgi.embeddy.springer.jsx.tests"
		);
	}

	protected JsX jsX;

	@org.junit.Test
	public void test00HelloWorld()
	{
		StringWriter s = new StringWriter();
		final String T = String.format("%s%n", "Hello, World!");

		jsX.invoke("HelloWorld", "helloWorld", s);
		EX.assertx(EX.eq(T, s.toString()));
	}

	@org.junit.Test
	public void test00Minimum()
	{
		jsX.invoke("TestZeT", "testMinimum");
	}

	@org.junit.Test
	public void test01Checks()
	{
		jsX.invoke("TestZeT", "testChecks");
	}

	@org.junit.Test
	public void test02Asserts()
	{
		jsX.invoke("TestZeT", "testAsserts");
	}

	@org.junit.Test
	public void test03Basics()
	{
		jsX.invoke("TestZeT", "testBasics");
	}

	@org.junit.Test
	public void test04Strings()
	{
		jsX.invoke("TestZeT", "testStrings");
	}

	@org.junit.Test
	public void test05Arrays()
	{
		jsX.invoke("TestZeT", "testArrays");
	}

	@org.junit.Test
	public void test06Extends()
	{
		jsX.invoke("TestZeT", "testExtends");
	}

	@org.junit.Test
	public void test07DeepAssign()
	{
		jsX.invoke("TestZeT", "testDeepAssign");
	}

	@org.junit.Test
	public void test08Classes()
	{
		jsX.invoke("TestZeT", "testClasses");
	}

	@org.junit.Test
	public void test09ClassDefs()
	{
		jsX.invoke("TestZeT", "testClassDefs");
	}

	@org.junit.Test
	public void test10Console()
	{
		StringWriter o = new StringWriter();
		StringWriter e = new StringWriter();

		jsX.invoke("TestZeT", "testConsole",
		  new JsStreams().output(o).error(e)
		);

		final String O = "This is 0-sample! Did you here 123?\n";
		EX.assertx(O.equals(o.toString()));

		final String E = "This is a sound of error...\n";
		EX.assertx(E.equals(e.toString()));
	}

	@org.junit.Test
	public void test11LinkedMap()
	{
		jsX.invoke("TestZeT", "testLinkedMap");
	}
}