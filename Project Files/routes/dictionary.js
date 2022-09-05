const express = require("express");
const https = require("https");
const dict = express.Router();
const bodyParser = require("body-parser");
const ejs= require("ejs");


var wordToSearch="" , define="", example='', pronounce='',phonetic='',partOfSpeech='',synonyms=[],antonyms=[];

// const app = express();
// app.set('view engine', 'ejs');
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));


dict.get("/", function (req, res) {
  res.render("dictionary", {
    word: wordToSearch,
    definition: define,
    examples: example,
    pronounce: pronounce,
    phonetic: phonetic,
    partOfSpeech: partOfSpeech,
    synonyms: synonyms,
    antonyms: antonyms
  });
});

dict.post("/", function (req, res) {

  wordToSearch = req.body.word;
  console.log(wordToSearch);
  const url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + wordToSearch;


  var request=https.get(url,function(response){
    response.on('data',function(data){
        const wordData = JSON.parse(data);


        phonetic=wordData[0].phonetic;
        pronounce=wordData[0].phonetics[0].audio;
        const level=wordData[0].meanings[0].definitions[0];
        define=level.definition;
        example=level.example;
        partOfSpeech=wordData[0].meanings[0].partOfSpeech;

        synonyms=level.synonyms;
        antonyms=level.antonyms;
        console.log(pronounce);
        console.log("Response received..")

        res.redirect("/dictionary");
    });    
  });

  request.on('error', function(err) {
    // Handle error
  });

  request.end();

});

module.exports = dict;
