package com.example.oop.oop.model;

public class ResponseDTO {
    private String message;
    private String data;

    public ResponseDTO() {}

    public ResponseDTO(String message, String data) {
        this.message = message;
        this.data = data;
    }

    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public String getData() {
        return data;
    }
    public void setData(String data) {
        this.data = data;
    }
}
