# About the project :
This bot is used in my discord server with friends, with it you can see who is connected at any moment on my minecraft server. It also feature a minecraft console interface with the RCON port and many other usefull commands

# Prerequire

You'll need node.js >=16.9.0 and npm >=9.2.0 installed on your machine to run the poject

# Installation :
```
# You need to create the bot folder in your minecraft server folder because he has to acces the logs folder :

tree ./ -L 2
./
├── DiscordBot
│   ├── README.md
│   ├── config.js
│   ├── main.js
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   └── stats.json
    ...
├── debug
├── eula.txt
├── help.yml
├── libraries
├── logs
    └── latest.log
    ...

# Navigate into the server folder and enter the following commands

git clone git@github.com:Darukity/MrBot-Discord-RCON.git

cd MrBot-Discord-RCON

npm i
```
After the installation is complete you will need to create a config.js file into the bot folder the format is the folowing :
```
module.exports = {
    token: '<your discord bot token>',
    rcon_channel: '<the discord channel id for the chat channel>',
    mc_server_ip: '<ip of the minecraft server>',
    mc_server_port: <the port of the minecraft server>,
    rcon_port: <the port of the rcon server>,
    rcon_password: "<the password of the RCON server>",
    dicord_webhook_url: '<the discord webhook url>',
    client_id: '<the id of your discord bot>'
}
```
The Rcon port and password can be seted up in the minecraft server configuration.
