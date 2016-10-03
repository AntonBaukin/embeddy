package net.java.osgi.embeddy.webapp.get;

/* Java */

import java.net.URLEncoder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/* Java Servlet */

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SU;

/* application */

import net.java.osgi.embeddy.webapp.GetFiles;
import net.java.osgi.embeddy.webapp.GetFiles.Range;


/**
 * Spring controller to download file.
 *
 * @author anton.baukin@gmail.com.
 */
@Controller
public class DownloadFile
{
	public static final String TYPES =
	  "MediaFile Document";

	@RequestMapping(method = RequestMethod.GET,
	  path = "/get/filenamed/{uuid}")
	public void redirect(@PathVariable String uuid, HttpServletResponse res)
	{
		getFiles.info(uuid, TYPES, take ->
		{
			//?: {file not found}
			if(!take.exists())
			{
				res.setStatus(404);
				return;
			}

			String n = (take.name() != null)?(take.name()):("File");
			String e = take.ext();

			if(e != null)
			{
				e = e.trim();
				if(!e.isEmpty() && !e.startsWith("."))
					e = "." + e;
				n = n + e;
			}

			try
			{
				//~: encode file characters
				StringBuilder s = new StringBuilder();
				for(int i = 0;(i < n.length());i++)
				{
					char    c = n.charAt(i);
					boolean x;

					//?: {is letter}
					if(Character.isLetter(c))
						x = (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
					else
						x = (Character.isDigit(c) || c == ' ' || c == '.');

					if(x)
						s.append(c);
					else
						s.append(URLEncoder.encode(""+c, "UTF-8"));
				}

				//!: send redirect
				res.sendRedirect(SU.cat(
				  "/get/filenamed/", uuid, "/", s
				));
			}
			catch(Throwable x)
			{
				throw EX.wrap(x);
			}
		});
	}

	@RequestMapping(method = RequestMethod.GET, path = {
	  "/get/file/{uuid}", "/get/filenamed/{uuid}/{name}"
	})
	public void get(@PathVariable String uuid,
	  HttpServletRequest req, HttpServletResponse res)
	{
		final Range range;

		//?: {download entire file}
		if(req.getHeader("Range") == null)
			range = null;
		//~: decode the dump range
		else
		{
			//-->   ^bytes\s*=\s*(\d+)(\-\d+)?$
			String  R = "^bytes\\s*=\\s*(\\d+)(\\-\\d+)?$";
			String  r = req.getHeader("Range").trim();
			Matcher m = Pattern.compile(R).matcher(r);

			try
			{
				//?: {not matches}
				EX.assertx(m.matches());

				long b = Long.parseLong(m.group(1));
				long e = SU.sXe(m.group(2))?(Long.MAX_VALUE - 1):
				  Long.parseLong(m.group(2).substring(1));

				//--> in HTTP Range end is included
				range = new Range(b, e + 1);
			}
			catch(Throwable e)
			{
				res.setStatus(400);
				return;
			}
		}

		getFiles.get(uuid, TYPES, take ->
		{
			//?: {file not found}
			if(!take.exists())
			{
				res.setStatus(404);
				return;
			}

			long length = take.length(range);

			//~: mime type
			if(take.mime() != null)
				res.setContentType(take.mime());

			//~: content length
			res.setContentLengthLong(length);

			//?: {file has no length} no content
			if(length == 0L)
			{
				res.setStatus((range == null)?(204):(416));
				return;
			}

			//?: {ranged content}
			if(range != null)
			{
				res.setStatus(206);
				res.setHeader("Content-Range", SU.cat(
				  "bytes=", range.start, "-",
				  range.start + length - 1
				));
			}

			//~: mark as attachment
			res.setHeader("Content-Disposition", "attachment");

			//~: dump the file
			try
			{
				take.dump(res.getOutputStream(), range);
			}
			catch(Throwable e)
			{
				throw EX.wrap(e);
			}
		});
	}

	@Autowired
	protected GetFiles getFiles;
}