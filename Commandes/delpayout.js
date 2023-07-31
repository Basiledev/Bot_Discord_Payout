const discord = require("discord.js")

module.exports = {
    name: "delpayout",
    description: "Supprime un payout",
    permission: discord.PermissionFlagsBits.ManageMessages,
    options:[
        {
        type: "integer",
        name: "nombre",
        description: "Le numero du payout à supprimer",
        required: true
        } 
    ],

    async run(bot, message){try {
        const del_id = message.options.getInteger('nombre')

        
        var getId = `SELECT * FROM payout WHERE id = ${del_id}`;
        bot.db.query(getId, function (err, resultid) {
            if (err) {
                throw err;
            } else {

                if (resultid[0].id==="")message.reply({ content: 'Ce payout n\'existe pas', ephemeral: true });

                var sql = `DELETE FROM participant WHERE id_payout = ${resultid[0].id}`;
                bot.db.query(sql, function (err, result) {
                    if (err) {
                        throw err;
                    }
                });

                var sql = `DELETE FROM payout WHERE id = ${resultid[0].id}`;
                bot.db.query(sql, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    message.reply({ content: `Le payout n°${resultid[0].id} a bien été supprimé`, ephemeral: true });
                });


            }
        });

    } catch (error) {
        console.log(error);
    };
    }
}