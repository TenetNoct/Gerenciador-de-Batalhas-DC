const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const battleManager = require('./battleManager');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content.startsWith('/setbattle')) {
    battleManager.setBattle(message);
  } else if (message.content.startsWith('/d ')) {
    battleManager.applyDamage(message);
  } else if (message.content.startsWith('/h ')) {
    battleManager.applyHeal(message);
  } else if (message.content.startsWith('/ad ')) {
    battleManager.applyDamageAll(message);
  } else if (message.content.startsWith('/ah ')) {
    battleManager.applyHealAll(message);
  } else if (message.content.startsWith('/md ')) {
    battleManager.applyMaxDamage(message);
  } else if (message.content.startsWith('/mh ')) {
    battleManager.applyMaxHeal(message);
  } else if (message.content.startsWith('/amd ')) {
    battleManager.applyMaxDamageAll(message);
  } else if (message.content.startsWith('/amh ')) {
    battleManager.applyMaxHealAll(message);
  } else if (message.content.startsWith('/eb')) {
    battleManager.endBattle(message);
  } else if (message.content.startsWith('/help')) {
    battleManager.showHelp(message);
  }
});

client.login(process.env.DISCORD_TOKEN);
