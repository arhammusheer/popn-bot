require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const embed = require("./embed");
const fs = require('fs');
var path = require("path");
const express = require('express')
const app = express()
const port = 3000
const logger = require('morgan');

var badWordAlertSent;

var availableResponses = JSON.parse(fs.readFileSync('availableResponses.json', 'utf-8'));

var badWordList = JSON.parse(fs.readFileSync('badWordList.json','utf-8'));

var compiledResponses = [];

for(response in availableResponses.commands) compiledResponses.push(response);

var renderData = {};

renderData['availableResponses'] = compiledResponses;
renderData['badWords'] = badWordList;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


//Express.js Website Paths
app.get('/', function(req, res, next){
  res.render("status", renderData);
});

//Express.js Server Run
app.listen(port, () => console.log(`popN BOT is ONLINE`));

//Bot Login
bot.login(TOKEN);

//Bot on-login success callback
bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity("The exclusive custom bot of USA - India Server");
});

//Bot on-message callback
bot.on("message", async msg => {

    //Dynamic responses from availableResponses json
    for(messageKey in availableResponses.commands){
      if(msg.content.toLowerCase() == messageKey) msg.channel.send(availableResponses.commands[messageKey]);
    }
    //Static Responses
    if(msg.content.toLowerCase() === 'popn help') msg.channel.send(embed.helpmenu);
    if(msg.content.toLowerCase() === 'lmao') msg.react("😂");

    //Bad word Filter
    badWordList.some(element => {
      if(msg.content.toLowerCase().includes(element)){
        if(!msg.content.toLowerCase().includes("dikshit") && msg.author.id != bot.user.id && badWordAlertSent == false){
          msg.react("🚨");
          msg.channel.send("🚨 BAD WORD ALERT 🚨");
          badWordAlertSent = true;
        }
      }
    });
    badWordAlertSent = false;

    //Levels Channel Filter
    if(msg.channel.id == "719506718656167988") checkForSpam(msg);
});

function checkForSpam(message){
  if(!message.content.toLowerCase().includes("levels") || !message.content.toLowerCase().includes("rank")){
    if(message.author.id != '159985870458322944'){
      message.delete();
    }
  }
}