package com.smhrd.sangspoon;

import org.springframework.web.bind.annotation.*;

@RestController
public class TestApiController {

    @GetMapping("/api/test")
    public String test() {
        return "Test API is working!";
    }
    
    @GetMapping("/api/hello")
    public String hello() {
        return "Hello! API is working!";
    }
}
