const discord = require("discord.js")


module.exports = {
    name: "addpayout",
    description: "Ajout un payout",
    permission: discord.PermissionFlagsBits.ManageMessages,
    dm: false,

    run: async (bot,interaction)=>{
        const modals = new discord.ModalBuilder({
            customId: `modal-${interaction.user.is}`,
            title: 'Ajouter un payout'
        });

        const mod_acti_nom = new discord.TextInputBuilder({
            customId: 'acti_nom',
            label:'Nom de l\'activitée',
            style: discord.TextInputStyle.Short,
        });
        const mod_ile = new discord.TextInputBuilder({
            customId: 'ile',
            label:'Ile où récupérer le payout',
            style: discord.TextInputStyle.Short,
        });
        const mod_coffre = new discord.TextInputBuilder({
            customId: 'coffre',
            label:'Coffre où récupérer le payout',
            style: discord.TextInputStyle.Short,
        });
        const mod_montant_total = new discord.TextInputBuilder({
            customId: 'total',
            label:'Gain total',
            style: discord.TextInputStyle.Short,
        });
        const mod_montant_perso = new discord.TextInputBuilder({
            customId: 'perso',
            label:'Gain par personne',
            style: discord.TextInputStyle.Short,
        });

        const actionRow1 = new discord.ActionRowBuilder().addComponents(mod_acti_nom)
        const actionRow2 = new discord.ActionRowBuilder().addComponents(mod_ile)
        const actionRow3 = new discord.ActionRowBuilder().addComponents(mod_coffre)
        const actionRow4 = new discord.ActionRowBuilder().addComponents(mod_montant_total)
        const actionRow5 = new discord.ActionRowBuilder().addComponents(mod_montant_perso)

        modals.addComponents(actionRow1,actionRow2,actionRow3,actionRow4,actionRow5)

        await interaction.showModal(modals);

        const filter = (interaction) => interaction.customId=== `modal-${interaction.user.is}`

        interaction
        .awaitModalSubmit({ filter,time: 120_000})
        .then((ModalInteraction) => {
            const acti_nom = ModalInteraction.fields.getTextInputValue('acti_nom')
            const ile = ModalInteraction.fields.getTextInputValue('ile')
            const coffre = ModalInteraction.fields.getTextInputValue('coffre')
            const montant_total = ModalInteraction.fields.getTextInputValue('total')
            const montant_perso = ModalInteraction.fields.getTextInputValue('perso')
            
            


            var sql = `INSERT INTO payout VALUES ('','${acti_nom}', '${ile}', '${coffre}', '${montant_total}', '${montant_perso}')`;
            bot.db.query(sql, function (err, result) {
                if (err) {
                console.log('err INSERT')
                throw err;
                }
                console.log("1 payout ajouté");
                console.log(`Avant la function : ${result.insertId}`)
                //result.insertId
            });

            ModalInteraction.reply({ content: 'Payout ajouté, Pense à rajouter directement les membres sinon il va faloir le refaire'});
            

        })
        .catch((err)=>{
            console.log(`Erreur : ${err}`)
        })

        const channel = bot.channels.cache.find(channel => channel.id=== interaction.channelId)

        const embedMembre = new discord.EmbedBuilder()
        .setDescription("Clique sur \"ajouter\" pour ajouter un membre")
        .setColor("DarkPurple")

        const row = new discord.ActionRowBuilder();
        row.addComponents(
            new discord.ButtonBuilder()
            .setCustomId("add_membre")
            .setStyle("Success")
            .setLabel("Ajouter"),
            new discord.ButtonBuilder()
            .setCustomId("fin_payout")
            .setStyle("Danger")
            .setLabel("Fin du payout")
        )


        let reply =""
        if (channel){
            reply = await channel.send({embeds:[embedMembre],components:[row]})
        } else {
            console.log("Le canal est introuvable.");
        }

        // Gestion des bouttons
        if (reply==="")return

        const collecteur = reply.createMessageComponentCollector({
            ComponentType: discord.ComponentType.Button,
        })

        collecteur.on('collect', (btninteraction) =>{
            if (btninteraction.customId === "add_membre"){                
                const modal = new discord.ModalBuilder({
                    customId: `add_membre_modal`,
                    title: 'Ajoute un membre au payout'
                });
                const textinpout = new discord.TextInputBuilder({
                    customId: 'nom_add_membre_payout',
                    label:'Nom du membre',
                    style: discord.TextInputStyle.Short,
                    required: true,
                    placeholder: "Membre"
                });
                const actionRowMembre = new discord.ActionRowBuilder().addComponents(textinpout)
                modal.addComponents(actionRowMembre)




                btninteraction.showModal(modal);
                const filter = (btninteraction) => btninteraction.customId=== `add_membre_modal`

                btninteraction
                .awaitModalSubmit({ filter,time: 120_000})
                .then((ModalInteraction) => {
                    const nomMembre = ModalInteraction.fields.getTextInputValue('nom_add_membre_payout')
                        var getId = `SELECT MAX(id) as id FROM payout`;
                        bot.db.query(getId, function (err, resultid) {
                            if (err) {
                                throw err;
                            } else {

                                var sql = `SELECT * FROM participant WHERE id_payout = ${resultid[0].id} AND participant_nom = '${nomMembre}'`;
                                bot.db.query(sql, function (err, resultTestPresence) {
                                    if (err) {
                                        throw err;
                                    }

                                    if (resultTestPresence.length>0){
                                        ModalInteraction.reply({ content: `${nomMembre} existe déja dans ce payout`});
                                    } else {
                                        var sql = `INSERT INTO participant VALUES ('${resultid[0].id}','${nomMembre}')`;
                                        bot.db.query(sql, function (err, result) {
                                            if (err) {
                                                throw err;
                                            }
                                            console.log(`${nomMembre} est ajouté au payout n°${resultid[0].id}`);
                                            ModalInteraction.reply({ content: `${nomMembre} est ajouté au payout n°${resultid[0].id}`});
                                        });
                                    }
                                });
                            }
                        });
                    })
                    .catch((err)=>{
                        console.log(`Erreur add: ${err}`)
                    })
                return 
            }

            if (btninteraction.customId === "fin_payout"){
                channel.bulkDelete(50, true);
                btninteraction.reply({ content: `Fin du payout, cette action peut durer quelques secondes`,ephemeral:true});
                return 
            }
        })
    },
}