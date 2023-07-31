const discord = require("discord.js")

module.exports = {
    name: "getpayout",
    description: "Affiche tout les payouts",
    permission: discord.PermissionFlagsBits.ManageMessages,
    dm: false,

    async run (bot,message){

//Affichage EMBEDs
        const inter = message
        bot.db.query(`SELECT * FROM payout WHERE EXISTS (SELECT id_payout FROM participant WHERE id = id_payout)`, async (err,result) => {    

            
            var listEmbed=[]
            if(result.length < 1) {
                return message.reply({content:"Pas de payout en cours\nTu peux en rajouter avec la commande /addpayout", ephemeral:true})
            } else {
                for (let i=0;i< result.length;i++){
                    
                    bot.db.query(`SELECT * FROM participant WHERE id_payout=${result[i].id}`, async (err,req) => {
                        let Embed = new discord.EmbedBuilder()
                        .setTitle(`${result[i].payout_nom}`)
                        .setDescription(`**${result[i].payout_ile}** - **${result[i].payout_coffre}**\nMontant total : ${result[i].payout_mtotal}\nMontant par personne : ${result[i].payout_mperso}`)
                        .setColor("Green")
                        .setThumbnail(bot.user.displayAvatarURL())
                        .setTimestamp()
                        .setFooter({text:`payout n°${result[i].id}`})
                        

                        const participants = [];
                        for (let j = 0; j < req.length; j++) participants.push(req[j].participant_nom)
                        
                        
                        // Ajouter les champs à l'embed
                        const channel = bot.channels.cache.find(channel => channel.id=== message.channelId)
                        Embed.addFields({ name: "Participants :", value: participants.join("\n") });
                        if (channel){
                            listEmbed[i] = await channel.send({embeds:[Embed]})
                        } else {
                            console.log("Le canal est introuvable.");
                        }
                    })
                }


            const btn = new discord.ActionRowBuilder();
            const memberBTN = new discord.ButtonBuilder()
                .setCustomId("del_membre")
                .setStyle("Primary")
                .setLabel("J'ai récupéré mon payout")            
            const reloadBTN = new discord.ButtonBuilder()
                .setCustomId("reload")
                .setStyle("Secondary")
                .setLabel("Actualiser (comming soon)")
                .setDisabled(true) //pas encore fini

            btn.addComponents(memberBTN,reloadBTN)
            const channel = bot.channels.cache.find(channel => channel.id=== inter.channelId)
            let reply =""
            if (channel){
                reply = await message.reply({components:[btn]})
                
            } else {
                console.log("Le canal est introuvable.");
            }

            // Gestion des bouttons
            if (reply==="")return

            const collecteur = reply.createMessageComponentCollector({
                ComponentType: discord.ComponentType.Button,
            })

            collecteur.on('collect', (btninteraction) =>{
                if (btninteraction.customId === "del_membre"){
                    memberBTN.setDisabled(true)
                    reply.edit({components:[btn]})
                    const select = new discord.StringSelectMenuBuilder()
                    .setCustomId('del_from_payout')
                    .setPlaceholder('Sélectionnez votre payout')
                            
                    var sql = `SELECT * FROM payout WHERE EXISTS (SELECT id_payout FROM participant WHERE id = id_payout)`;
                    bot.db.query(sql, async function (err, result) {

                        if(result.length < 1) {
                            memberBTN.setDisabled(true)
                            return await btninteraction.reply("Pas de payout en cours")
                        }

                        if (err) throw err

                        let tab =[]

                        for (let i = 0; i < result.length; i++) {
                            const label = String(result[i].payout_nom.substring(0, 25));
                    
                            tab[i] = new discord.StringSelectMenuOptionBuilder()
                            .setLabel(`${label}`)
                            .setDescription(`Id : ${result[i].id}`)
                            .setValue(`${result[i].id}`)
                        }
                        select.addOptions(tab)
                        const row = new discord.ActionRowBuilder().addComponents(select);

                        const btn_reponse_inter = await btninteraction.reply({content: `:warning: Attention toute modification est définitive :warning:`});
                        const channel = bot.channels.cache.find(channel => channel.id=== message.channelId)
                        const repPayout = await channel.send({components: [row]})
                        

            //selection du membre du payout selectionné
                        const collecteur_rep_payout = repPayout.createMessageComponentCollector({ componentType: discord.ComponentType.StringSelect});



                        collecteur_rep_payout.on('collect', (selectPseudoInteraction) =>{
                            const id = selectPseudoInteraction.values
                            
                            const select = new discord.StringSelectMenuBuilder()
                            .setCustomId('Select_member_from_payout')
                            .setPlaceholder('Sélectionnez votre pseudo')
        //Test si l'id est bien un nombre
                            if (!isNaN(id)){
                                var sql = `SELECT * FROM participant WHERE id_payout = ${id}`;
                                console.log(sql)
                                bot.db.query(sql, async function (err, result) {
                                    if (err) throw err
                        
                                    for (let i = 0; i < result.length; i++) {
                                        const pseudo = result[i].participant_nom;
                                        console.log(pseudo)
                                
                                        select.addOptions(new discord.StringSelectMenuOptionBuilder()
                                        .setLabel(`${pseudo}`)
                                        .setDescription(`Sélectionner ce pseudo pour le supprimer du payout n°${id}`)
                                        .setValue(`${pseudo}`))
                                    }
                                    const rowPseudo = new discord.ActionRowBuilder().addComponents(select);
                                    
                                    const channel = bot.channels.cache.find(channel => channel.id=== message.channelId)
                                    const repMembre = await channel.send({content: "Les membres du payouts",components: [rowPseudo]})

                                    repPayout.delete()


                // Suppresion du membre du payout selectionné 
                                    const collecteurDelMembre = repMembre.createMessageComponentCollector({ componentType: discord.ComponentType.StringSelect});

                                    
                                    collecteurDelMembre.on('collect', (selectDelMembreInteraction) =>{
                                        const nom = selectDelMembreInteraction.values
                                        
                                        console.log(`nom : ${selectDelMembreInteraction.values}`)

                                        var sql = `DELETE FROM participant WHERE participant_nom='${nom}' AND id_payout=${id}`;
                                        console.log(sql)
                                        
                                        if (isNaN(nom)){
                                            bot.db.query(sql, async function (err, result) {
                                                if (err) throw err

                                                var sql_fin_payout = `SELECT * FROM participant WHERE id_payout = ${id}`;
                                                bot.db.query(sql_fin_payout, function (err, resultFinPayout) {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    if (resultFinPayout.length==0){
                                                        var sql = `DELETE FROM payout WHERE id=${id}`;
                                                        bot.db.query(sql, function (err, result) {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                            console.log(sql)
                                                            console.log(`payout n°${id} a été supprimé car il n'y a plus de participant`);
                                                        });
                                                    } 
                                                });
                                    
                                                selectDelMembreInteraction.reply({content: `${nom} a bien été supprimé du Payout`,ephemeral:true});
                                                repMembre.delete()
                                                btn_reponse_inter.delete()
                                                memberBTN.setDisabled(false)
                                                reply.edit({components:[btn]})
                                            })
                                        }
                                    });
                                })
                            }
                        });
                    })
                }
                if (btninteraction.customId === "reload"){
                    console.log(listEmbed)
                    for (let i=0;i< listEmbed.length;i++)listEmbed[i].delete()


                    if(result.length < 1) {
                        return message.reply({content:"Pas de payout en cours\nTu peux en rajouter avec la commande /addpayout", ephemeral:true})
                    } else {
                        for (let i=0;i< result.length;i++){
                            
                            bot.db.query(`SELECT * FROM participant WHERE id_payout=${result[i].id}`, async (err,req) => {
                                let Embed = new discord.EmbedBuilder()
                                .setTitle(`${result[i].payout_nom}`)
                                .setDescription(`**${result[i].payout_ile}** - **${result[i].payout_coffre}**\nMontant total : ${result[i].payout_mtotal}\nMontant par personne : ${result[i].payout_mperso}`)
                                .setColor("Green")
                                .setThumbnail(bot.user.displayAvatarURL())
                                .setTimestamp()
                                .setFooter({text:`payout n°${result[i].id}`})
                                
        
                                const participants = [];
                                for (let j = 0; j < req.length; j++) participants.push(req[j].participant_nom)
                                
                                
                                // Ajouter les champs à l'embed
                                const channel = bot.channels.cache.find(channel => channel.id=== message.channelId)
                                Embed.addFields({ name: "Participants :", value: participants.join("\n") });
                                if (channel){
                                    listEmbed[i] = await channel.send({embeds:[Embed]})
                                } else {
                                    console.log("Le canal est introuvable.");
                                }
                            })
                        }
                        btninteraction.reply({content: `Actualisation fini !!`,ephemeral:true});
                    }
                }
            })        
        }        
    })
    }
}