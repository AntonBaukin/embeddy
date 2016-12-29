package net.java.osgi.embeddy.webapp.set;

/* Java */

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/* Java Servlet */

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/* Spring Framework */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;
import net.java.osgi.embeddy.springer.SU;
import net.java.osgi.embeddy.springer.db.TxBean;

/* application */

import net.java.osgi.embeddy.app.db.FilesStore;
import net.java.osgi.embeddy.app.db.GetObject;
import net.java.osgi.embeddy.app.secure.SecDigest;
import net.java.osgi.embeddy.webapp.Nested;
import net.java.osgi.embeddy.webapp.login.AuthBean;


/**
 * Spring controller to replace a single file,
 * or to create multiple new files
 *
 * @author anton.baukin@gmail.com.
 */
@Controller
public class UploadFiles
{
	@RequestMapping(path = "/set/mediafile",
	  method = RequestMethod.POST)
	public void mediaFile (
	    HttpServletRequest req, HttpServletResponse res,
	    @RequestParam("MediaFile") MultipartFile mp )
	  throws Throwable
	{
		updateFile(req, res, mp, "MediaFile",
		  "update_mediafile_uploaded");
	}

	@RequestMapping(path = "/add/mediafile",
	  method = RequestMethod.POST)
	public void mediaFileAdd ( HttpServletResponse res,
	    @RequestParam("MediaFile") MultipartFile mp )
	  throws Throwable
	{
		addFile(res, mp, "MediaFile",
		  "update_mediafile_uploaded");
	}

	@RequestMapping(path = "/set/docfile",
	  method = RequestMethod.POST)
	public void docFile (
	    HttpServletRequest req, HttpServletResponse res,
	    @RequestParam("DocFile") MultipartFile mp )
	  throws Throwable
	{
		updateFile(req, res, mp, "Document",
		  "update_docfile_uploaded");
	}

	@RequestMapping(path = "/add/docfile",
	  method = RequestMethod.POST)
	public void docFileAdd ( HttpServletResponse res,
	    @RequestParam("DocFile") MultipartFile mp )
	  throws Throwable
	{
		addFile(res, mp, "Document",
		  "update_docfile_uploaded");
	}

	protected void updateFile (
	    HttpServletRequest req, HttpServletResponse res,
	    MultipartFile mp, String type, String script )
	  throws Throwable
	{
		String uuid;

		//?: {parameter is not set}
		if(SU.sXe(uuid = req.getParameter("uuid")))
		{
			res.sendError(400, "Specify file UUID parameter!");
			return;
		}

		//~: is rename
		boolean rename = "true".equals(req.getParameter("rename"));

		context.getBean(TxBean.class).invoke(() ->
		{
			Map<String, Object> fo = new HashMap<>();
			String              digest;

			//?: {file doesn't exist}
			if(!getObject.load(uuid, type, fo))
			{
				res.setStatus(404);
				return null;
			}

			//~: update the file
			try(InputStream is = mp.getInputStream())
			{
				SecDigest.Stream di = secDigest.wrap(is);

				//!: save the file content
				filesStore.save(fo, di);

				digest = di.hex();
			}

			//~: update the file object
			String fobj = (String) nested.jsX.apply(
			  "db/obj.js", script, uuid, rename, digest, mp
			);

			//~: write resulting json
			if((fobj != null) && !fobj.isEmpty())
			{
				res.setContentType("application/json;charset=UTF-8");
				res.setCharacterEncoding("UTF-8");
				res.getWriter().write(fobj);
			}

			return null;
		});
	}

	protected void addFile ( HttpServletResponse res,
	    MultipartFile mp, String type, String script )
	  throws Throwable
	{
		AuthBean ab = context.getBean(AuthBean.class);

		//?: {no user domain}
		EX.asserts(ab.getDomain());

		context.getBean(TxBean.class).invoke(() ->
		{
			String digest, uuid = getObject.newUUID();
			Map<String, Object> fo = new HashMap<>();

			fo.put("uuid",  uuid);
			fo.put("owner", ab.getDomain());
			fo.put("type",  type);

			//~: save the new file
			getObject.save(fo);

			//~: update the file
			try(InputStream is = mp.getInputStream())
			{
				SecDigest.Stream di = secDigest.wrap(is);

				//!: save the file content
				filesStore.save(fo, di);

				//~: resulting digest
				digest = di.hex();
			}

			//~: save the file object
			String fobj = (String) nested.jsX.apply(
			  "db/obj.js", script, uuid, true, digest, mp
			);

			//~: write resulting json
			if((fobj != null) && !fobj.isEmpty())
			{
				res.setContentType("application/json;charset=UTF-8");
				res.setCharacterEncoding("UTF-8");
				res.getWriter().write(fobj);
			}

			return null;
		});
	}

	@Autowired
	protected ApplicationContext context;

	@Autowired
	protected GetObject getObject;

	@Autowired
	protected SecDigest secDigest;

	@Autowired
	protected FilesStore filesStore;

	@Autowired
	protected Nested nested;
}