package com.example.oop.oop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@SpringBootApplication
@RestController

public class OopApplication {

	public static void main(String[] args) {
		SpringApplication.run(OopApplication.class, args);
	}

	@GetMapping
	public List<String> hello(){
		return List.of("hellow", "World");
	}

}
