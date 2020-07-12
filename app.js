require("dotenv").config();
const Discord = require("discord.js");
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const embed = require("./embed");
const fs = require("fs");
var path = require("path");
const express = require("express");
const app = express();
var http = require("http");
const logger = require("morgan");

var sendBadWordAlert = false;
var availableResponses = require("./availableResponses.json");
var badWordList = require("./badWordList.json");
var badWordException = require("./badWordExceptions.json");
var compiledResponses = [];
var renderData = {};

for (response in availableResponses.commands) compiledResponses.push(response);

renderData["availableResponses"] = compiledResponses;
renderData["badWords"] = badWordList;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//Express.js Website Paths
app.get("/", function (req, res, next) {
  res.json({
    status: "online",
  });
});

//Express.js Server Run
var httpServer = http.createServer(app);

httpServer.listen(3000);

//Bot Login
bot.login(TOKEN);

//Bot on-login success callback
bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity("The exclusive custom bot of USA - India Server");
});

//Bot on-message callback
bot.on("message", async (msg) => {
  //Dynamic responses from availableResponses json
  for (messageKey in availableResponses.commands) {
    if (msg.content.toLowerCase() == messageKey)
      msg.channel.send(availableResponses.commands[messageKey]);
  }
  //Static Responses
  if (msg.content.toLowerCase() === "popn help")
    msg.channel.send(embed.helpmenu);
  if (msg.content.toLowerCase() === "lmao") msg.react("😂");
  if (msg.content.toLowerCase().startsWith("popn addnew")) {
    let allowedRole = msg.guild.roles.cache.find(
      (guild) => guild.name === "bot-commander"
    );
    if (msg.member.roles.cache.has(allowedRole.id)) {
      addNewResponse(msg);
    } else {
      msg.channel.send(
        `Sorry, you don't have the role to use that command <@${msg.author.id}>`
      );
    }
  }

  //Bad word Filter

  /* DISABLED FOR REBUILD

  badWordList.some((badWordElement) => {
    
    if( msg.content.toLowerCase().replace(/\s/g, "").includes(badWordElement) && msg.author.id != bot.user.id){

      sendBadWordAlert = true; //Send Alert

      //Exception Filter
      badWordException.some((exceptionElement) => {
        if(msg.content.toLowerCase().replace(/\s/g, "").includes(exceptionElement)) {
          sendBadWordAlert = false;
          console.log("Exception filtered " + exceptionElement)
        }
      });
    }

    if (sendBadWordAlert == true) {
      console.log("BAD WORD ALERT SEND " + badWordElement)
      msg.react("🚨");
      msg.channel.send("🚨 BAD WORD ALERT 🚨");
      badWordAlertMarker = true;
    }
    sendBadWordAlert = false;
  });
  */

  //Levels Channel Filter
  if (msg.channel.id == "719506718656167988") checkForSpam(msg);
});

function checkForSpam(message) {
  allowedMessages = ["!rank", "!levels"];
  if (allowedMessages.indexOf(message.content.toLowerCase()) === -1) {
    if (message.author.id != "159985870458322944") {
      message.delete();
      message.author.send(embed.levelsDMWarning);
    }
  }
}
