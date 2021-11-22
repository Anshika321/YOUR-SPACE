//jshint esversion: 6

const express = require("express");
const path=require('path');
const https = require('https');

const app = express();

app.use(express.static(path.join(__dirname,"/public")));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/toDo", function (req, res) {
    res.sendFile(__dirname + "/to-do.html");
});

app.get("/notes", function (req, res) {
    res.sendFile(__dirname + "/notes.html");
});

app.get("/currentAffairs", function (req, res) {
    res.sendFile(__dirname + "/currentAffairs.html");
});

app.listen(3000,function(){
    console.log("Server started on port 3000");
});
