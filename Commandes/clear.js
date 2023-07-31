const discord = require("discord.js")

module.exports = {
    name: "clear",
    description: "Supprime les messages",
    permission: discord.PermissionFlagsBits.ManageMessages,
    dm: true,
    options:[
        {
        type: "integer",
        name: "nombre",
        description: "Le nombre de messages à supporter",
        required: true
        } 
    ],

    async run(bot, message){try {
        const amount = message.options.getInteger('nombre'); if (amount <= 0 || amount > 100) { return message.reply({ content: 'Le nombre de messages doit être compris entre 1 et 100.', ephemeral: true });}
        await message.channel.bulkDelete(amount, true);
        return message.reply({ content: `Effacé ${amount} messages.`, ephemeral: true });
    } catch (error) {
        console.log(error);
    };
    }
}