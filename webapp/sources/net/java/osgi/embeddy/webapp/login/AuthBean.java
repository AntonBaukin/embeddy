package net.java.osgi.embeddy.webapp.login;

/* Java */

import java.util.HashMap;
import java.util.Map;

/* Java Servlet */

import javax.servlet.http.HttpSession;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/* embeddy: springer */

import net.java.osgi.embeddy.app.secure.AuthPoint;


/**
 * Temporary (during a web request) loads
 * and caches authentication related data.
 *
 * @author anton.baukin@gmail.com.
 */
@Component @Scope("request")
public class AuthBean
{
	/* Authentication Objects */

	/**
	 * UUID of the user executing the request.
	 */
	public String    getLogin()
	{
		return get("AuthLogin");
	}

	/**
	 * UUID of the auth session of
	 * the user executing the request.
	 */
	public String    getSession()
	{
		return get("AuthSession");
	}

	/**
	 * UUID of the domain the user is in.
	 * System user has no domain assigned.
	 */
	public String    getDomain()
	{
		return get("AuthDomain");
	}


	/* protected: auth loads */

	protected String get(String p)
	{
		if(state.isEmpty())
			collect();

		return (String) state.get(p);
	}

	protected void   collect()
	{
		//~: auth login
		wsput("AuthLogin");

		//~: auth login
		wsput("AuthSession");

		//~: auth login
		wsput("AuthDomain");
	}

	protected void   wsput(String p)
	{
		state.put(p, ws.getAttribute(p));
	}

	@Autowired
	protected HttpSession ws;

	@Autowired
	protected AuthPoint auth;

	protected final Map<String, Object> state = new HashMap<>(5);
}