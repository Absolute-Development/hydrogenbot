const Discord = require("discord.js");
const file = {
  "prefix": {
    "default": "H!"
  },
  "TOKEN": "NjI3MzcwNzkzMzY5NjAwMDEx.Xg5eKQ.KO3uKYCP5QlskLmWSumMa5fdoAg",
  "BOT_ID": "627370793369600011"
}

const bot     = new Discord.Client({fetchAllMembers: true});
const fs      = require("fs");
const moment  = require("moment");
const db = require("quick.db")
const premium = new db.table("premium")
const premiumcode = new db.table("premiumcode")
const DBL = require('dblapi.js');
const dbl = new DBL("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyNzM3MDc5MzM2OTYwMDAxMSIsImJvdCI6dHJ1ZSwiaWF0IjoxNTcwNzQzODc3fQ.raZzeJPoAaTSCRs_YXbq1peOddav6ZfKUHqQFQNlYoI", { webhookPort: 5000, webhookAuth: 'secret' }, bot);
dbl.on('posted', () => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] Server count posted!`);
})

dbl.on('error', e => {
 console.log(`Oops! ${e}`);
})
dbl.webhook.on('ready', hook => {
  console.log(`Webhook running at http://${hook.hostname}:${hook.port}${hook.path}`);
});
dbl.webhook.on('vote', vote => {
  bot.users.get(vote.user).send("Thank you for voting!");
});
exports.db = db
exports.premium = premium;
exports.pcode = premiumcode;

const log = (msg) => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${msg}`);
};

bot.on("guildMemberAdd", member => {
    if(premium.get(member.id)){
        member.addRole(member.guild.roles.get("662758123261657182").id)
    }
})

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
fs.readdir("./cmd/", (err, files) => {
  if (err) console.error(err);
  log(`Loading a total of ${files.length} commands.`);
  files.forEach(f => {
    let props = require(`./cmd/${f}`);
    log(`Loading Command: ${props.help.name}`);
    bot.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      bot.aliases.set(alias, props.help.name);
    });
  });
});
bot.on('ready', async() => {
    setInterval(function(){
    bot.user.setPresence({
        game: {
            name: `H! | ${bot.users.size} users`,
            type: "STREAMING",
            url: "https://www.twitch.tv/discordapp"
        }
    });
    }, 15000)
});

bot.on('ready', () => {
    setInterval(function(){
        bot.channels.find(c => c.id === "656311687141523499").setName("Servercount: " + bot.guilds.size)
        bot.channels.find(c => c.id === "656312469806907427").setName("Usercount: " + bot.users.size)
    }, 12000)
})

bot.on("message", msg => {

  var prefix = "H!";

  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  if (msg.channel.type == "dm") return;

  let command = msg.content.split(" ")[0].slice(prefix.length);
  let params = msg.content.split(" ").slice(1);
  let perms = bot.elevation(msg);
  let cmd;

  if (bot.commands.has(command)) {
    cmd = bot.commands.get(command);
  } else if (bot.aliases.has(command)) {
    cmd = bot.commands.get(bot.aliases.get(command));
  }
  if (cmd) {
    if (perms < cmd.conf.permLevel) return msg.channel.send("oops looks like you dont have the right permission level :(");
    cmd.run(bot, msg, params, perms, prefix);
  }
});

bot.on("ready", () => {
  log(`Ready to serve ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} servers.`);
});

bot.on("error", console.error);
bot.on("warn", console.warn);

bot.login("NjI3MzcwNzkzMzY5NjAwMDEx.Xg653Q.7xQqQgW8u-tpFkU2IVIx8RC7c3Y");

bot.on('disconnect', function(erMsg, code) {
  console.log('----- Bot disconnected from Discord with code', code, 'for reason:', erMsg, '-----');
  bot.login("NjI3MzcwNzkzMzY5NjAwMDEx.Xg653Q.7xQqQgW8u-tpFkU2IVIx8RC7c3Y");
});

bot.reload = function (command) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./cmd/${command}`)];
      let cmd = require(`./cmd/${command}`);
      bot.commands.delete(command);
      bot.aliases.forEach((cmd, alias) => {
        if (cmd === command) bot.aliases.delete(alias);
      });

      bot.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        bot.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

bot.elevation = function (msg) {
  /* This function should resolve to an ELEVATION level which
     is then sent to the command handler for verification*/
  let permlvl = 0;

 
  if (msg.member.hasPermission("MANAGE_GUILD")) permlvl = 2;

  if (msg.member.hasPermission("ADMINISTRATOR")) permlvl = 3;

  if (msg.author.id === "539195184357965833") permlvl = 4;
    
  if (premium.get(msg.author.id)) permlvl = 5;
    
  return permlvl;
};
