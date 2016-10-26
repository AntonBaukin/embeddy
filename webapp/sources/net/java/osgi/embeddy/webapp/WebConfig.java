package net.java.osgi.embeddy.webapp;

/* Java */

import java.io.File;
import java.util.concurrent.TimeUnit;

/* Spring Framework */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.servlet.resource.GzipResourceResolver;
import org.springframework.web.servlet.resource.PathResourceResolver;

/* embeddy: springer */

import net.java.osgi.embeddy.springer.EX;


/**
 * Spring MVC configuration.
 *
 * @author anton.baukin@gmail.com.
 */
@Configuration @EnableWebMvc
public class WebConfig extends WebMvcConfigurerAdapter
{
	@Bean
	public MultipartResolver multipartResolver()
	{
		CommonsMultipartResolver mr =
		  new CommonsMultipartResolver();

		//=: default encoding UTF-8
		mr.setDefaultEncoding("UTF-8");

		//=: very small memory size
		mr.setMaxInMemorySize(512);

		//~: fair file size limit (6Gb)
		mr.setMaxUploadSize(1024L * 1024 * 1024 * 2);

		//~: temporary directory
		File tmp = new File(System.getProperty(
		  "org.osgi.framework.storage"), "temp");

		//?: {not yet created}
		if(!tmp.exists())
			EX.assertx(tmp.mkdir());

		//?: {storage unavailable}
		EX.assertx(tmp.exists() && tmp.isDirectory() && tmp.canWrite());

		//=: upload temp directory
		try
		{
			mr.setUploadTempDir(new FileSystemResource(tmp));
		}
		catch(Throwable e)
		{
			throw EX.wrap(e);
		}

		return mr;
	}


	/* Web Extension Points */

	public void addResourceHandlers(ResourceHandlerRegistry registry)
	{
		registry.addResourceHandler("/static/**").
		  addResourceLocations("classpath:/content/").
		  setCacheControl(CacheControl.maxAge(60, TimeUnit.MINUTES)).
		  setCachePeriod(600). //<-- seconds
		  resourceChain(true).
		  addResolver(new GzipResourceResolver()).
		  addResolver(new PathResourceResolver());
	}

	public void configureContentNegotiation(ContentNegotiationConfigurer cnc)
	{
		cnc.favorPathExtension(true);
		cnc.ignoreAcceptHeader(true);
		cnc.useJaf(false);

		cnc.mediaType("json", MediaType.APPLICATION_JSON_UTF8);
	}
}