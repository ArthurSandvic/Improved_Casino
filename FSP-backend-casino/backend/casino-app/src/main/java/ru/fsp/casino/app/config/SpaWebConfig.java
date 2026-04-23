package ru.fsp.casino.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/profile").setViewName("forward:/index.html");
        registry.addViewController("/admin").setViewName("forward:/index.html");
        registry.addViewController("/mountain").setViewName("forward:/mountain/index.html");
        registry.addViewController("/mountain/").setViewName("forward:/mountain/index.html");
        registry.addViewController("/bank").setViewName("forward:/bank/index.html");
        registry.addViewController("/bank/").setViewName("forward:/bank/index.html");
    }
}
