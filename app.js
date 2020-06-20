require("dotenv").config();
const Discord = require("discord.js");
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const embed = require("./embed");
const fs = require("fs");
var path = require("path");
const express = require("express");
const app = express();
var https = require("https");
var http = require("http");
const logger = require("morgan");
const certificate = fs.readFileSync(
  "./ssl_certificates/fullchain.pem",
  "utf-8"
);
const privateKey = fs.readFileSync("./ssl_certificates/privkey.pem", "utf-8");
var credentials = { key: privateKey, cert: certificate };

var badWordAlertSent;
var availableResponses = require("./availableResponses.json");
var badWordList = require("./badWordList.json");
var badWordException = require("./badWordExceptions.json");
const { emitKeypressEvents } = require("readline");
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
  if (req.secure) {
    res.render("status", renderData);
  } else {
    res.redirect("https://" + req.headers.host + req.url);
  }
});

//Express.js Server Run
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);

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

  //Bad word Filter
  badWordList.some((element) => {
    badWordException.some((exceptionElement) => {
      if (!exceptionElement.includes(element)) {
        if (
          msg.content.toLowerCase().replace(/\s/g, "").includes(element) &&
          msg.author.id != bot.user.id &&
          badWordAlertSent == false
        ) {
          msg.react("🚨");
          msg.channel.send("🚨 BAD WORD ALERT 🚨");
          badWordAlertSent = true;
        }
      }
    });
  });
  badWordAlertSent = false;

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
