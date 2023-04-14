const Discord = require('discord.js')
const { EmbedBuilder, REST, Routes, ActivityType } = require('discord.js');
const bot = new Discord.Client({intents: 3276799})
const config = require('./config')
const commands = require('./commands')

const fs = require('fs');
const request = require('request');

const mcServer = require('minecraft-server-util');
const Rcon = require('rcon-client').Rcon;

const client = new Rcon({
  host: config.mc_server_ip,
  port: config.rcon_port,
  password: config.rcon_password,
});

const Tail = require('tail').Tail;
const tail = new Tail('../logs/latest.log');

const webhookUrl = config.dicord_webhook_url;
const axios = require('axios')

//load {/} commands
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(config.client_id), { body: commands.commandsList });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const prefix = "!"

bot.login(config.token)

bot.on("ready", async() => {
    console.log(`${bot.user.tag} est connecté`)
    tail.on('line', (line) => {
      // Filters
      if(line.split(" ").includes("RCON")) return;
      if(line.replace(/[\]/]/g, ' ').includes('WARN')) return;
      if(line.replace(/[\]/]/g, ' ').includes('voicechat')) return;
      if(line.includes("logged in with entity")) return;
      if(line.split(" ").includes("/tell")) return;
      if(line.split(" ").includes("/tp")) return;
      if(line.split(" ").includes("issued")) return;
      if(line.includes("Teleported")) return;
      if(line.includes("UUID")) return;
      if(line.includes("Disconnected")) return;
      newLine = line.replace(/\[Async Chat Thread - #\d+\/INFO\]: /, '')
      newLine = newLine.replace(/\[Server thread+\/INFO\]: /, '')

      axios.post(webhookUrl, { content: newLine })
      .then(response => {
          console.log('Message sent!');
      })
      .catch(error => {
          console.error(error);
      });
    });
    async function getInfo() {
        while(true){
            mcServer.queryFull(config.mc_server_ip, config.mc_server_port)
                .then((result) => {
                    parsedJSON = JSON.parse(JSON.stringify(result))
                    bot.user.setPresence({activities: [{type: ActivityType.Watching, name:`serveur mc: ${parsedJSON.players.online}/${parsedJSON.players.max} joueurs connectés`}]})
                })
                .catch((error) => console.error(error));
            await new Promise(resolve => setTimeout(resolve, 30000));
            //console.log(`updated`)
        }
      }
        getInfo()

})

//{/} commands handle
bot.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

bot.on("messageCreate", async (msg) => {
    if(msg.author.id == bot.application.id){return}
    if(msg.webhookId) return;
    console.log(msg.content)

    if(msg.content === prefix + "players"){
      if(msg.channelId != config.rcon_channel){
        mcServer.queryFull(config.mc_server_ip, config.mc_server_port)
        .then((result) => {
            parsedJSON = JSON.parse(JSON.stringify(result))
            message = "";
            players = parsedJSON.players.list;

            if(players[0] != undefined){
                for(let i=0;i<players.length; i++){
                    message += players[i];
                    if(i != players.length-1){
                        message += ", "
                    }
                }
                msg.reply(`Liste des joueurs: ${message}`)
            } else {
                msg.reply(`Aucun joueur n'est connecté`)
            }        
        })
        .catch((error) => console.error(error));
      } else {
        msg.delete();
      }
    }

    //Rcon Console
    if(msg.channelId === config.rcon_channel) {
      if(!msg.content.startsWith(prefix)){
        const mcChatChannel = bot.channels.cache.get(config.rcon_channel)
        command = msg.content
        client.connect().then(() => {
          console.log('Connected to Minecraft server via RCON')
          // Envoie la commande "log" pour afficher les derniers messages de la console
          const now = new Date();

          // formater l'heure
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const seconds = now.getSeconds().toString().padStart(2, '0');
          const timeString = `[${hours}:${minutes}:${seconds}]`;
          client.send(command).then((res) => {
              console.log(res)
              newRes = res.replace("/", '')
              axios.post(webhookUrl, { content: newRes.replace(/§./g, '').split('\n').map(
                line => {
                  if (!line == "") {
                    return `${timeString} ${line}`;
                  } else {
                    return line;
                  }
                }).join('\n') })
              .then(response => {
                  console.log('Message sent!');
              })
              .catch(error => {
                  console.error(error);
              });
              client.end()
            }).catch((err) => {
              console.error(err)
              mcChatChannel.send(err)
              client.end()
            })
        }).catch((error) => {
          console.error(`Failed to connect to Minecraft server via RCON: ${error}`)
        })
      }
    }

    if(msg.content === prefix + "stats"){
        stats = JSON.parse(fs.readFileSync('stats.json'));
        const wList = stats[msg.author.username][0]['wList'];
        let embed = sortWordsByFrequency(wList)
        msg.reply({embeds: [embed]})
    }
    if(msg.content === prefix + "help"){
        return;
    }

    //récolte des stats
    stats = JSON.parse(fs.readFileSync('stats.json'));
    var index = Object.keys(stats).indexOf(msg.author.username);
    if(index == -1) {
      stats[msg.author.username] = [{ "wList": {} }];

      // Écrire l'objet JSON mis à jour dans le fichier
      let updatedData = JSON.stringify(stats);
      fs.writeFileSync('stats.json', updatedData);
      addWordToJSON()

    } else {
      addWordToJSON()
    }
    function addWordToJSON() {
      if(msg.content.startsWith(prefix)) return;
      let words = msg.content.replace(/[!?._*,'"]/g, "");
      words = words.split(" ")
      const wList = stats[msg.author.username][0]['wList'];
      motsVides = ["cest", "a", "à", "afin", "alors", "après", "au", "aucun", "aussi", "autre", "avant", "avec", "avoir", "car", "ce", "cela", "ces", "ceux", "chaque", "ci", "comme", "comment", "dans", "de", "des", "du", "dedans", "dehors", "depuis", "devrait", "doit", "donc", "dont", "du", "elle", "elles", "en", "encore", "entre", "est", "et", "eu", "eux", "faire", "fois", "font", "hors", "ici", "il", "ils", "je", "juste", "la", "le", "les", "leur", "là", "ma", "maintenant", "mais", "me", "même", "mes", "mine", "moi", "mon", "ne", "ni", "non", "notre", "nous", "ou", "où", "par", "parce", "pas", "peu", "peut", "plupart", "pour", "pourquoi", "quand", "que", "quel", "quelle", "quelles", "quels", "qui", "sa", "sans", "se", "sera", "serait", "si", "sien", "soi", "soit", "son", "sont", "sous", "suivre", "sur", "ta", "te", "tellement", "tels", "tes", "ton", "tous", "tout", "trop", "très", "tu", "un", "une", "valeur", "voici", "voie", "voient", "vois", "voit", "vu", "vôtre", "sa","ses"]
      for (let word of words) {
        word = word.toLowerCase()
        if(!motsVides.includes(word)) {
          if(word.length >= 3){
            let count = 1;

            for (let i = 1; i <= Object.keys(wList).length; i++) {
              if (wList.hasOwnProperty(i) && wList[i].includes(word)) {
                wList[i].splice(wList[i].indexOf(word), 1);
                wList[i] = wList[i].filter(x => x != null);
                count = i + 1;
                break;
              }
            }

            if (!wList.hasOwnProperty(count)) {
              wList[count] = [];
            }

              wList[count].push(word);
          }

          fs.writeFileSync('stats.json', JSON.stringify(stats));
        }
      }
    }

    function sortWordsByFrequency(wordsDict) {
      // Créer un tableau à partir des clés de l'objet
      const keys = Object.keys(wordsDict);
      // Trier les clés par ordre décroissant de leur valeur
      keys.sort((a, b) => b - a);
      // Créer un nouveau tableau trié par ordre décroissant de la fréquence d'utilisation
      var embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle("Voici le top 5 des mots que tu a le plus utilisé")
      let index = 1
      keys.forEach((key) => {
        wordsDict[key].forEach((word) => {

        });
        if(index <= 5) {
          let wordAll = wordsDict[key].join(" ")
          if(!wordAll == "") {
            //console.log(wordAll, index)
            embed.addFields({name: `top ${index.toString()}`, value: wordAll})
            index ++
          }
        }
      });
      if(index != 1){
        return embed
      } else {
        msg.reply("t'as jamais parlé sur le serveur avant cette commande ou chuis p'tet amnésique jsp")
      }
    }
    
})