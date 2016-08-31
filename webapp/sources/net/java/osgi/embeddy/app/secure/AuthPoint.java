package net.java.osgi.embeddy.app.secure;

/* Java */

import java.security.SecureRandom;

/* Java Servlet */

import javax.servlet.http.HttpSession;

/* Java Annotations */

import javax.annotation.PostConstruct;

/* Spring Framework */


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/*  embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.servlet.FilterTask;

/* application */

import net.java.osgi.embeddy.app.Global;


/**
 * Authentication and access control strategy.
 *
 * @author anton.baukin@gmail.com.
 */
@Component
public class AuthPoint
{
	/* Authentication */

	public boolean isAuthedUser(FilterTask task, boolean strict)
	{
		//?: {has no session}
		HttpSession s = task.getRequest().getSession(false);
		if(s == null) return false;

		//?: {has no login}
		String l = (String) s.getAttribute("AuthLogin");
		if(l == null) return false;

		//?: {has no valid session}
		String x = (String) s.getAttribute("AuthSession");

		//?: {not strict | issue db request}
		return (x != null) && (
		  !strict || touchActualSession(x, l, false)
		);
	}

	public boolean touchActualSession(String session, String login, boolean touch)
	{
		return (Boolean) global.jsX.apply(
		  "/secure/auth.js", "touch_actual_session",
		  session, touch, login
		);
	}

	public String  getIndexPage(FilterTask task)
	{
		HttpSession s = task.getRequest().getSession(false);
		String      l = (s == null)?(null):
		  (String) s.getAttribute("AuthLogin");

		return (l == null)?(null):getIndexPage(l);
	}

	public String  getIndexPage(String login)
	{
		return (String) global.jsX.apply(
		  "/secure/auth.js", "get_index_page", login);
	}

	/**
	 * Secure random valid during the run time.
	 */
	public byte[]  XKEY;


	/* Static Routines */

	/**
	 * Selects random characters from the string given.
	 */
	public String  randomChars(String chars, int n)
	{
		EX.asserts(chars);
		EX.assertx(n > 0);

		StringBuilder s = new StringBuilder(n);
		SecureRandom  r = random.get();

		try
		{
			while(s.length() < n)
				s.append(chars.charAt(r.nextInt(chars.length())));
		}
		finally
		{
			random.free(r);
		}

		return s.toString();
	}


	/* protected: internals */

	@Autowired
	protected SecRandom random;

	@Autowired
	protected Global global;

	@PostConstruct
	protected void init()
	{
		//~: generate random runtime key
		XKEY = random.randomBytes(20);
	}
}