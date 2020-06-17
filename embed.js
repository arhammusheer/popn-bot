const Discord = require("discord.js");
const fs = require('fs');
const availableResponses = JSON.parse(fs.readFileSync('availableResponses.json', 'utf-8'));

var embed = {};
var compiledResponses = [];

for(response in availableResponses.commands) compiledResponses.push(`\`${response}\``);


embed.helpmenu = new Discord.MessageEmbed()
  .setColor("#000000")
  .setTitle("Help Menu")
  .addFields(
    { name: "Available Responses:", value: compiledResponses.join(", ")},
    { name: "Get your own response" ,value: "DM <@!490907114370236426> to get your own custom response"}
  );

embed.levelsMenu = new Discord.MessageEmbed()
  .setColor("#000000")
  .setTitle("Levels Help")
  .addFields(
    { name: "Warning", value: "The message you sent is not a command. To send any other message, please move to <#718721072450633731>"},
    { name: "Available Commands", value: "!levels, !rank"}
  );



module.exports = embed;