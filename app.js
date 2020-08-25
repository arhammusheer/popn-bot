require("dotenv").config();
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
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
var isReady = true;

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
  bot.user.setActivity("The exclusive custom bot of College in Quarantine Server");
});

//Bot on-message callback
bot.on("message", async (msg) => {
  //Dynamic responses from availableResponses json
  for (messageKey in availableResponses.commands) {
    if (msg.content.toLowerCase() == messageKey) {
      sendResponse(msg, availableResponses.commands[messageKey]);
    }
  }
  if (
    msg.channel.id == "741133567811256372" &&
    msg.content.toLowerCase() == "popn delete all"
  ) {
    const fetched = await msg.channel.messages.fetch({ limit: 100 });
    msg.channel
      .bulkDelete(fetched)
      .catch((error) =>
        msg.reply(`Couldn't delete messages because of: ${error}`)
      );
    msg
      .reply("Cleared all messages")
      .then((message) => {
        message.delete({ timeout: 1000 });
      })
      .catch((err) => {
        console.log(err);
        msg.channel.send("an error occured!!");
      });
  }

  if (msg.channel.id == "741133567811256372") msg.delete({ timeout: 8000 });

  //Static Responses
  if (msg.content.toLowerCase() === "popn help") {
    msg.channel.send(embed.helpmenu);
    console.log("Sent Help menu embed");
  }
  if (msg.content.toLowerCase() === "lmao") {
    msg.react("😂");
    console.log("send reaction response: lmao");
  }
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
  if (msg.member.voice.channel) {
    var connection;
    var voiceChannel = msg.member.voice.channel;
    if (msg.content.startsWith("popn vc")) {
      if (msg.content.toLowerCase() == "popn vc connect") {
        connection = await voiceChannel.join();
      }
      if (msg.content.toLowerCase() == "popn vc leave") {
        voiceChannel.leave();
      }
      if (msg.content.toLowerCase() == "popn vc illuminati") {
        if (connection) {
          connection.play("./Audio/illuminati.mp3");
        } else {
          connection = await voiceChannel.join();
          connection.play("./Audio/illuminati.mp3");
        }
      }
      if (msg.content.toLowerCase() == "popn vc wow") {
        if (connection) {
          connection.play(ytdl("https://www.youtube.com/watch?v=zqTwOoElxBA"));
        } else {
          connection = await voiceChannel.join();
          connection.play(ytdl("https://www.youtube.com/watch?v=zqTwOoElxBA"));
        }
      }
      if (msg.content.toLowerCase() == "popn vc error") {
        if (connection) {
          connection.play(ytdl("https://www.youtube.com/watch?v=0lhhrUuw2N8"));
        } else {
          connection = await voiceChannel.join();
          connection.play(ytdl("https://www.youtube.com/watch?v=0lhhrUuw2N8"));
        }
      }
      if (msg.content.startsWith("popn vc yt")) {
        link = msg.content.split(" ")[3];
        if (connection) {
          connection.play(ytdl(link));
        } else {
          connection = await voiceChannel.join();
          connection.play(ytdl(link));
        }
      }
    }
  } else {
    if (msg.content.startsWith("popn vc"))
      msg.reply("You're not in a vc bichh");
  }

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

async function sendResponse(msg, response) {
  msg.channel.send(response);
  console.log("Sent Dynamic Response: " + response);
}
