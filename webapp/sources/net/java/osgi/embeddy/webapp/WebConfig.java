package net.java.osgi.embeddy.webapp;

/* Java */

import java.util.concurrent.TimeUnit;

/* Spring Framework */

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.servlet.resource.GzipResourceResolver;
import org.springframework.web.servlet.resource.PathResourceResolver;


/**
 * Spring MVC configuration.
 *
 * @author anton.baukin@gmail.com.
 */
@Configuration @EnableWebMvc
public class WebConfig extends WebMvcConfigurerAdapter
{
	public void addResourceHandlers(ResourceHandlerRegistry registry)
	{
		registry.addResourceHandler("/static/**").
		  addResourceLocations("classpath:/content/").
		  setCacheControl(CacheControl.maxAge(60, TimeUnit.MINUTES)).
		  resourceChain(true).
		  addResolver(new GzipResourceResolver()).
		  addResolver(new PathResourceResolver());
	}
}