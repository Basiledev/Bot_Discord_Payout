const discord = require("discord.js") 

module.exports = async (bot, interaction) => {
    if(interaction.type == discord.InteractionType.ApplicationCommand){
         let command = require(`../Commandes/${interaction.commandName}`)
         command.run(bot, interaction, command.options);
    }
}