require("dotenv").config();
const ytdl = require("ytdl-core");
const Discord = require("discord.js");
const bot = new Discord.Client();

const { prefix, name } = require("./config.json");
const availableResponse = require("./availableResponses.json");
const isYoutube = new RegExp(
  "^(http(s)?://)?((w){3}.)?youtu(be|.be)?(.com)?/.+"
);

var compiledResponses = [];
for (response in availableResponses.commands)
  compiledResponses.push(`\`${response}\``);

var connection;
var dispatcher;
var voiceChannel;

//Log into Discord
bot.login(process.env.TOKEN);

//On Ready
bot.once("ready", () => {
  console.log(`${name} logged in!`);
  bot.user.setActivity("Exclusive bot of College in Quarantine server");
});

//Bot onMessage Callback
bot.on("message", async (msg) => {
  //Available response list handler
  for (messageKey in availableResponse.commands) {
    if (msg.content.toLowerCase() == `${prefix} ${messageKey}`) {
      var userResponses = availableResponse.commands[messageKey];
      var response =
        userResponses[Math.floor(Math.random() * userResponses.length)];
      msg.channel.send(response);
      console.log(`Sent response: ${response} in #${msg.channel.name}`);
    }
  }

  //popn help menu
  if (msg.content.toLowerCase() == `${prefix} help`) {
    helpmenu = new Discord.MessageEmbed()
      .setColor("#000000")
      .setTitle("Help Menu")
      .addFields(
        { name: "Available Responses:", value: compiledResponses.join(" ") },
        {
          name: "Music commands",
          value: `${prefix} [youtube link], ${prefix} leave`,
        },
        {
          name: "Get your own response",
          value: "DM <@!490907114370236426> to get your own custom response",
        }
      );
    msg.channel.send(helpmenu);
  }

  //Levels filter
  if (msg.channel.id == "719506718656167988") {
    if (
      !msg.content.toLowerCase().startsWith("!rank") ||
      !msg.content.toLowerCase() == "!levels"
    ) {
      if (msg.author.id != "159985870458322944") {
        msg.delete();
        msg.author.send(
          new Discord.MessageEmbed()
            .setColor("#000000")
            .setTitle("Levels Help")
            .addFields(
              {
                name: "Warning",
                value:
                  "The message you sent is not a command. To send any other message, please move to <#718721072450633731>",
              },
              { name: "Available Commands", value: "!levels, !rank" }
            )
        );
      }
    }
  }

  //AutoClear handler
  if (msg.channel.id == "741133567811256372") {
    msg.delete({ timeout: 8000 });
    if (msg.content.toLowerCase() == `${prefix} delete all`) {
      const fetched = await msg.channel.messages.fetch({ limit: 100 });
      msg.channel
        .bulkDelete(fetched)
        .then(() =>
          msg
            .reply("Cleared all messages successfully")
            .then((message) => message.delete({ timeout: 1000 }))
        )
        .catch((error) =>
          msg.reply(`Couldn't delete messages because ${error}`)
        );
    }
  }

  //popn Youtube handler
  if (
    msg.content.toLowerCase().startsWith(`${prefix} https://`) &&
    isYoutube.test(msg.content.split(" ")[1])
  ) {
    if (msg.member.voice.channel) {
      var link = msg.content.split(" ")[1];
      var voiceChannel = msg.member.voice.channel;
      if (connection) {
        dispatcher = connection.play(ytdl(link));
        dispatcher.on("error", console.error);
        dispatcher.on("finish", () => {
          dispatcher.destroy();
          connection.disconnect();
          connection = null;
          dispatcher = null;
          voiceChannel = null;
        });
      } else {
        connection = await voiceChannel.join();
        dispatcher = connection.play(ytdl(link));
        dispatcher.on("error", console.error);
        dispatcher.on("finish", () => {
          dispatcher.destroy();
          connection.disconnect();
          connection = null;
          dispatcher = null;
          voiceChannel = null;
        });
      }
      console.log(`playing ${link}`);
    } else {
      msg.reply("You're not in a vc bichh");
    }
  }

  //Leave vc
  if (msg.content.toLowerCase() == `${prefix} leave`) {
    if (connection) {
      connection.disconnect();
      connection = null;
      dispatcher = null;
      voiceChannel = null;
    } else {
      msg.reply("I'm not in a vc bichh");
    }
  }
});
