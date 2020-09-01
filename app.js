require("dotenv").config();
const ytdl = require("ytdl-core");
const Discord = require("discord.js");
const bot = new Discord.Client();

const { prefix, name } = require("./config.json");
const availableResponse = require("./availableResponses.json");
const playlists = require("./youtubeRandom.json");
const isYoutube = new RegExp(
  "^(http(s)?://)?((w){3}.)?youtu(be|.be)?(.com)?/.+"
);

var compiledResponses = [];
for (response in availableResponse.commands)
  compiledResponses.push(`\`${response}\``);

var connection;
var dispatcher;
var voiceChannel;

const queue = new Map();

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
          value: `${prefix} [youtube link], ${prefix} stop, ${prefix} skip, ${prefix} random [pop/trap/rap/lowfi/weeb/kpop/gaming/house]`,
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
      !msg.content.toLowerCase().startsWith("!levels")
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
  //Server queue
  const serverQueue = queue.get(msg.guild.id);

  //music commands
  if (msg.content.startsWith(`${prefix} play`)) {
    if (isYoutube.test(msg.content.split(" ")[2])) {
      execute(msg, serverQueue);
    } else {
      msg.channel.send("Bruh...This ain't a youtube link");
    }
    return;
  } else if (msg.content.startsWith(`${prefix} skip`)) {
    skip(msg, serverQueue);
    return;
  } else if (msg.content.startsWith(`${prefix} stop`)) {
    stop(msg, serverQueue);
    return;
  } else if (msg.content.startsWith(`${prefix} random`)) {
    radio(msg, serverQueue);
  }

  //Download youtube link
  if (msg.content.toLowerCase().startsWith(`${prefix} download`)) {
    var youtubeLink = msg.content.split(" ")[2];
    var youtubeName;
    await ytdl.getBasicInfo(youtubeLink, (err, info) => {
      return (youtubeName = info.videoDetails.title);
    });
    const attachment = new Discord.MessageAttachment(
      ytdl(youtubeLink, { filter: "audioonly", format: "mp3" }),
      `${youtubeName}.mp3`
    );
    if (isYoutube.test(youtubeLink)) {
      msg.channel.send("Here you go bruh 🎵", {
        files: [attachment],
      });
    }
  }
});

//Song execute
async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[2]);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 6,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

//Song Skip
function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

//Stop music and clear queue
function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

//Song play function
function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Imma play **${song.title}**`);
}

function radio(message, serverQueue) {
  args = message.content.split(" ");
  executeMsg = message;
  youtubeLink = randomSong(args[2]);
  executeMsg.content = `${prefix} play ${youtubeLink}`;
  if(youtubeLink){
    return execute(executeMsg, serverQueue);
  } else {
    message.channel.send("An error occured. I'm sorry. I sed 😢")
  }
}

function randomSong(request) {
  for (genre in playlists) {
    if (genre == request) {
      currentPlaylist = playlists[genre];
      youtubeLink =
        currentPlaylist[Math.floor(Math.random() * currentPlaylist.length)];
      return youtubeLink;
    }
  }
}
