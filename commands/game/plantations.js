const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require("discord.js");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
const fs = require("fs");
// FONCTIONS
const { saveDb,loadUser,capitalize,minutesToMs,formatMs,calculateHarvestAmount,updateUserInventory,randomSelection,randomAward,fileUrl } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
// IMAGES
const imgharvest0Araigne = './assets/img/araignee.jpg';
const imgharvest0Limace = './assets/img/limace.jpg';
const imgharvest0Chenille = './assets/img/chenille.jpg';
const imgharvest0 = './assets/img/harvest0.png';
const imgharvest1 = './assets/img/harvest1.png';
const imgharvest2 = './assets/img/harvest2.png';
const imgharvest3 = './assets/img/harvest3.png';
const imgharvest4 = './assets/img/harvest4.png';
const imgplanting = './assets/img/planter.png';

let menuOpen = false;
let openedByUserId;

// Login pour les envoi dans le channel public
client.login(process.env.token);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantations')
        .setDescription('Affiche les plantations de l\'utilisateur'),
    async execute(interaction) {
        // Vérifier si la plantation est ouverte
        const userId = interaction.user.id;

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            menuOpen = false;
        }

        if (menuOpen && userId === openedByUserId) {
            return interaction.reply({ content: ">>> L'interface est déjà ouverte.", ephemeral: true });
        } 
        menuOpen = true;
        openedByUserId = userId;

        const date = new Date().toLocaleString();
        let slotActiv;
        // Charger la base de données
        try {
            database = JSON.parse(fs.readFileSync("database/database.json", 'utf8'));
        } catch (error) {
            interaction.reply({ content: `>>> 🤯 Quelque chose a mal tourné ! Il semblerait que des données importantes n'ont pas pu être récupérées...\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true});
            console.log(`${date} [/plantations] Erreur lors du chargement de la base de données.`);
            console.error(error);
            return;
        }

        // Récupère l'utilisateur
        const user = await loadUser(interaction.user.id);
        if (!user) { return interaction.reply({ content: ">>> Tu n'es pas enregistré en tant que grower !\nUtilise la commande \`/demarrer\` pour t'enregistrer.", ephemeral: true}); }
        if (!user.id) { return interaction.reply({ content: `>>> 🤯 Quelque chose a mal tourné ! Il semblerait que ta sauvegarde soit défectueuse...\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true}); }
        
        // DEBUG EMPTY DATA
        // try {
        //     // Arrose le slot
        //     let userTest = {};
        //     // Enregistrer dans la base de donnée
        //     await saveDb(interaction.user.id, userTest);
        //     return;
        // } catch (error) {
        //     await interaction.reply({ content: `>>> Donnée corrompue ! La sauvegarde a été empêchée par sécurité.\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true });
        //     console.error(error);
        // }
        // return;

        // Récupère les plantations de l'utilisateur
        const userPlantations = user.plantations;
        // Récupère l'utilisateur
        const userInventory = user.inventaire;
        let type,arrosage,statut,fert,antiP;
        // Créer un tableau de boutons pour chaque slot de plantation
        const buttons = [];

        // Créer le message d'embed principal
        const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('Tes plantations')
        .setDescription('Sélectionne une plantation pour effectuer une action.')
        
        // On boucle autant de fois qu'il y a de slots
        let nb = 0;
        for (const slot in userPlantations) {
            nb++
            // Créer les variables de plantation
            let userType, userFertilized, userAntiParasite, userArrosage, userTimeleft;
            // Créer un bouton pour chaque slot
            const button = new ButtonBuilder()
                .setCustomId(`slot_${slot}`)
                .setLabel(`Slot ${nb}`)
                .setStyle(ButtonStyle.Primary);
            buttons.push(button);

            // On gère les plantations au cas où l'utilisateur n'en a pas
            if (userPlantations[slot].type === undefined) {
                userType = "*`Vide`*";
                userFertilized = " ";
                userAntiParasite = " ";
                userArrosage = " ";
                userTimeleft = " ";
            } else {
                userFertilized = userPlantations[slot].fertilized ? "`Fertilisation : ✅`" : "`Fertilisation : ❌`";
                userAntiParasite = userPlantations[slot].antiParasite ? "`Anti-parasites : ✅`" : "`Anti-parasites : ❌`";

                const tempsActuel = Date.now();
                const temps = formatMs(userPlantations[slot].readyTime - tempsActuel);

                userType = `\`Variété : ${capitalize(userPlantations[slot].type)}\``;
                userPlantations[slot].niveau_arrosage = userPlantations[slot].niveau_arrosage || 0;
                userArrosage = `\`Arrosage : ${userPlantations[slot].niveau_arrosage} fois\``;
                userTimeleft = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `\`Statut : ✅ Prête\`` : `\`Statut : 🕒 ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                    userTimeleft = `\`Statut : 🕒 Non défini\``;
                }
            }
            embed.addFields({ name: `🌿 Slot ${nb} :`, value: `${userType}\n${userFertilized}\n${userAntiParasite}\n${userArrosage}\n${userTimeleft}` })
        }

        // Créer une rangée de boutons (avec nos boutons de slots)
        const row = new ActionRowBuilder()
        .addComponents(buttons);

        // Envoi le message avec les boutons de slot
        const messagePlantations = await interaction.reply({ content: interaction.user.toString(), embeds: [embed], components: [row], ephemeral: true });

        // Créer un collecteur d'interaction pour les boutons de slot
        const filter = (i) => i.user.id === interaction.user.id;
        // 5 minutes de délai avant la suppression de l'interface
        const collector = messagePlantations.createMessageComponentCollector({ 
            filter, 
            time: minutesToMs(5), 
        }); 
        // Gérer les interactions avec les boutons //==========================================================================//
        collector.on('collect', async (buttonInteraction) => {
            const slot = buttonInteraction.customId.split('_')[1];
            const user = await loadUser(interaction.user.id);
            
            // Construction de l'embed de réponse
            const embedReponse = new EmbedBuilder()
            .setColor(color);
            
            // Créer le message d'embed de slot
            const slotEmbed = new EmbedBuilder()

            // Créer 2 rangées de boutons pour intéragir avec le slot sélectionné
            const slotRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`planter_${slot}`)
                        .setLabel('Planter')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`arroser_${slot}`)
                        .setLabel('Arroser')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`recolter_${slot}`)
                        .setLabel('Récolter')
                        .setStyle(ButtonStyle.Primary),
                );
            const slotRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`fertiliser_${slot}`)
                        .setLabel('Fertiliser')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`antiparasite_${slot}`)
                        .setLabel('Anti parasite')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`retour`)
                        .setLabel('Retour')
                        .setStyle(ButtonStyle.Secondary)
                );
            // Créer une rangée de boutons (choix de la graine à plantée)
            const plantingRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId(`kush_planting`)
                    .setLabel('Kush')
                    .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setCustomId(`amnezia_planting`)
                    .setLabel('Amnezia')
                    .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setCustomId(`purple_planting`)
                    .setLabel('Purple')
                    .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setCustomId(`retour`)
                    .setLabel('Retour')
                    .setStyle(ButtonStyle.Secondary)
                );

            let userPlantations = user.plantations;
            try {
                if (!user.inventaire) {
                    return await buttonInteraction.reply({ content: `>>> Un problème est survenu. Erreur : plantation[215]`, ephemeral: true });
                }
                // Vérrouille les bouton fertiliser et anti-parasite si l'utilisateur n'a pas les outils
                slotRow2.components[0].setDisabled(user.inventaire.outils.fertilisant <= 0 || user.inventaire.outils.fertilisant === undefined);
                slotRow2.components[1].setDisabled(user.inventaire.outils.produit_antiparasite <= 0 || user.inventaire.outils.fertilisant === undefined);
            } catch (error) {
                console.error(error);
            }

            // Cette condition s'assure de récupérer les plantations du joueurs lorsqu'il appuis sur le bouton de retour
            if (user.plantations[slot]) {
                // console.log(slot);
                if (userPlantations[slot].type === undefined || userPlantations[slot].type === 'aucune') {
                    userPlantations[slot].type = "aucune";
                    slotRow.components[0].setDisabled(false);
                }

                userPlantations[slot].fertilized = userPlantations[slot].fertilized || false;
                userPlantations[slot].antiParasite = userPlantations[slot].antiParasite || false;
                userPlantations[slot].niveau_arrosage = userPlantations[slot].niveau_arrosage || 0;
                
                slotRow2.components[0].setDisabled(userPlantations[slot].fertilized);
                slotRow2.components[1].setDisabled(userPlantations[slot].antiParasite);

                if (user.inventaire.outils.fertilisant <= 0 || user.inventaire.outils.fertilisant === undefined) {
                    slotRow2.components[0].setDisabled(true);  
                }
                if (user.inventaire.outils.produit_antiparasite <= 0 || user.inventaire.outils.produit_antiparasite === undefined) {
                    slotRow2.components[1].setDisabled(true);  
                }

                let fert = userPlantations[slot].fertilized ? "`✅ Fertilisé`" : "`⭕ Non fertilisé`";
                let antiP = userPlantations[slot].antiParasite ? "`✅ Traité`" : "`⭕ Non traité`";

                // Gestion du systeme de temps 
                const tempsActuel = Date.now();
                const tempsRestant = userPlantations[slot].readyTime - tempsActuel;

                // Si le temps restant est négatif ou égal à 0, affiche "Prête à être récoltée" et déverrouille le bouton de récolte
                if (tempsRestant <= 0) {
                    statut = `✅ Prête à être récoltée`;
                    slotRow.components[2].setDisabled(false);
                } else {
                    // Verrouille le bouton de récolte
                    slotRow.components[2].setDisabled(true);
                }
                // Formater le temps restant en heures, minutes et secondes
                const temps = formatMs(tempsRestant);

                statut = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `\`✅ Prête\`` : `\`🕒 ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                        if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                            statut = `\`🕒 Non défini\``;
                        }
                
                // Actualise le slot
                slotEmbed.setDescription(`Que souhaite tu faire ?`)
                .setColor(color)
                .setTitle(`Plantation : ${capitalize(slot)}`)
                .addFields(
                    { name: `Variété :`, value: `\`${capitalize(userPlantations[slot].type)}\`` },
                    { name: `Fertilisation :`, value: `\`${fert}\`` },
                    { name: `Anti-parasites :`, value: `\`${antiP}\`` },
                    { name: `Arrosage :`, value: `\`${userPlantations[slot].niveau_arrosage} fois\`` },
                    { name: `Statut :`, value: `\`${statut}\`` }
                );
            }

            //=====================================================//
            // Gère les interactions des boutons pour tous les slots
            if (buttonInteraction.customId === `fertiliser_${slot}`) {
                // Vérifie si l'utilisateur possède du fertilisant
                if (user.inventaire.outils.fertilisant <= 0 || user.inventaire.outils.fertilisant === undefined) {
                    return await buttonInteraction.reply({ content: `>>> Tu n'as pas de fertilisant dans ton inventaire.\nPasse à la boutique pour en acheter. \`/boutique\``, ephemeral: true });
                }
                // Vérifie si le slot est déjà fertilisé
                if (userPlantations[slot].fertilized) {
                    return await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} est déjà fertilisé.`, ephemeral: true });
                } else {
                    // Supprimer l'objet de l'inventaire de l'utilisateur
                    let userInventory = user.inventaire;
                    userInventory = updateUserInventory(userInventory, 'outils', 'fertilisant', -1);
                    // Fertilise le slot
                    userPlantations[slot].fertilized = true;

                    // Vérrouiller le bouton
                    slotRow2.components[0].setDisabled(true);
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[1].value = "`✅ Fertilisé`";

                    if (userPlantations[slot].antiParasite) {
                        slotRow2.components[1].setDisabled(true);
                    }
                    
                    try {
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                        // Enregistrer dans la base de donnée
                        await saveDb(interaction.user.id, user);
                    } catch (error) {
                        console.error(error);
                        return await buttonInteraction.reply({ content: `>>> Un problème est survenu.`, ephemeral: true });
                    }
                }
                return;
            }
            if (buttonInteraction.customId === `antiparasite_${slot}`) {
                // Vérifie si l'utilisateur possède du produit anti-parasite
                if (user.inventaire.outils.produit_antiparasite <= 0 || user.inventaire.outils.produit_antiparasite === undefined) {
                    return await buttonInteraction.reply({ content: `>>> Tu n'as pas de produit anti parasite dans ton inventaire.\nPasse à la boutique pour en acheter. \`/boutique\``, ephemeral: true });
                }
                // Vérifie si le slot est déjà traité
                if (userPlantations[slot].antiParasite) {
                    return await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} est déjà traité contre les parasites.`, ephemeral: true });
                } else {
                    // Supprimer l'objet de l'inventaire de l'utilisateur
                    let userInventory = user.inventaire;
                    userInventory = updateUserInventory(userInventory, 'outils', 'produit_antiparasite', -1);
                    // Traite le slot
                    userPlantations[slot].antiParasite = true;

                    // Vérrouiller le bouton
                    slotRow2.components[1].setDisabled(true);
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[2].value = "`✅ Traité`";
                    
                    if (userPlantations[slot].fertilized) {
                        slotRow2.components[0].setDisabled(true);
                    }

                    try {
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                        // Enregistrer dans la base de donnée
                        await saveDb(interaction.user.id, user);
                    } catch (error) {
                        console.error(error);
                        return await buttonInteraction.reply({ content: `>>> Un problème est survenu.`, ephemeral: true });
                    }
                }
                return;
            }
            if (buttonInteraction.customId === `planter_${slot}`) {
                const user = await loadUser(interaction.user.id);
                // Vérifie si le slot à déjà une graine                
                if (user.plantations[slot].type === "aucune" || user.plantations[slot].type === undefined) {
                    // Vérrouillage des boutons si l'utilisateur n'a pas la graine asociée
                    if (user.inventaire.graine.kush <= 0 || user.inventaire.graine.kush === undefined) {
                        plantingRow.components[0].setDisabled(true)
                    }
                    if (user.inventaire.graine.amnezia <= 0 || user.inventaire.graine.amnezia === undefined) {
                        plantingRow.components[1].setDisabled(true)
                    }
                    if (user.inventaire.graine.purple <= 0 || user.inventaire.graine.purple === undefined) {
                        plantingRow.components[2].setDisabled(true)
                    }
                    // Mettre à jour la ligne de bouton pour que l'utilisateur choisisse la graine qu'il souhaite planter
                    await buttonInteraction.update({ embeds: [slotEmbed], components: [plantingRow] });
                    // Variable global pour récupérer le slot plus loin
                    slotActiv = slot;
                    return;
                } else {
                    try {
                        await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} a déjà une graine en maturation.`, ephemeral: true });
                    } catch (error) {
                        console.error(error);
                    }
                return;
                }
            }
            if (buttonInteraction.customId === `arroser_${slot}`) {
                let userInventory = user.inventaire;
                // Vérifie si l'utilisateur possède un arrosoir
                if (userInventory.outils.arrosoir <= 0 || userInventory.outils.arrosoir === undefined) {
                    return await buttonInteraction.reply({ content: `>>> Tu n'as pas d'arrosoir dans ton inventaire.\nPasse à la boutique pour t'en acheter un. \`/boutique\``, ephemeral: true });
                }
                try {
                    // Arrose le slot
                    userPlantations[slot].niveau_arrosage += 1;
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[3].value = `\`${userPlantations[slot].niveau_arrosage} fois\``;
                    await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);
                    return;
                } catch (error) {
                    await buttonInteraction.followUp({ content: `>>> 🤯 Quelque chose a mal tourné ! Il semblerait que des données importantes n'ont pas pu être récupérées...\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true });
                    console.error(error);
                }
                return;
            }
            if (buttonInteraction.customId === `recolter_${slot}`) {
                // Charger la base de données
                const user = await loadUser(interaction.user.id);
                slotActiv = slot;
                // Vérifier si l'utilisateur existe dans la base de données
                if (!user) {
                    return await interaction.reply({ content: 'Tu n\'es pas enregistré dans la base de donnée.', ephemeral: true });
                }
                // Vérifier si le slot est vide
                if (!slot || Object.keys(slot).length === 0) {
                    return await interaction.followUp({ content: 'Tu n\'as rien à récolter ici.', ephemeral: true });
                }
                // Récupère l'utilisateur
                const userId = user;
                // Récupère le slot
                const userSlot = user.plantations[slot];
                // Récupère l'inventaire
                let userInventory = user.inventaire;
                // Récupère les plantes
                const userPlants = userInventory.plante;
                // Récupérer le type de graine du slot actuel
                const typeGraine = userSlot.type;

                // Vérifier si le type de graine existe dans la base de données
                if (!database.objets.graine.hasOwnProperty(typeGraine)) {
                    return await interaction.reply({ content: 'Cette variété n\'existe pas dans la base de donnée.', ephemeral: true });
                }              
                
                // Construction de l'embed de réponse
                const embedReponse = new EmbedBuilder().setColor(color).setTitle(`\`${capitalize(slot)}\``).addFields( { name: `Rapport de récolte :`, value: `Aucun problème.` } );
                const publicReponse = new EmbedBuilder().setColor(color).setTitle(`\`${capitalize(slot)}\``).addFields( { name: `Rapport de récolte :`, value: `Aucun problème.` } );

                const exigenceGraine = database.objets.graine[typeGraine].exigence;
                // console.log(`La graine ${typeGraine} a une niveau d'exigence de : ${exigenceGraine}`)

                // Vérifier si le slot peut être récolté (temps)
                const tempsActuel = Date.now();
                const tempsRestant = userSlot.readyTime - tempsActuel;
                
                const attackParasite = randomAward(0.4); // 60% de chances d'une invasion parasitaire
                const dyingPlant = randomAward(0.6); // 40% de chances que la plante meurt
                
                // Si le temps restant est inférieur ou égal à 0 l'utilisateur peut récolter
                if (tempsRestant <= 0) {
                    const niveauArrosage = userSlot.niveau_arrosage;
                    // Défini le niveau de la récolte à 0
                    let harvestLevel = 0;
                    // Gère le niveau de la récolte selon le taux d'arrosage
                    switch(exigenceGraine) {
                        case 0:
                            harvestLevel = calculateHarvestAmount(typeGraine,exigenceGraine,niveauArrosage);
                        break;
                        case 1:
                            harvestLevel = calculateHarvestAmount(typeGraine,exigenceGraine,niveauArrosage);
                        break;
                        case 2:
                            harvestLevel = calculateHarvestAmount(typeGraine,exigenceGraine,niveauArrosage);
                        break;
                        default:
                            console.log(`Niveau d'exigence inconnu !`);
                        return;
                    }
                    // Si le slot est fertilisé on ajoute 1 au niveau de récolte
                    if (userSlot.fertilized) { harvestLevel += 1; }
                    // Si le slot n'est pas traité contre les parasites
                    if (!userSlot.antiParasite) {
                        if (attackParasite) {
                            const listParasites = ['chenilles','limaces','arraigné rouges'];
                            const typeParasite = randomSelection(listParasites);
                            if (dyingPlant) {
                                harvestLevel = 0;
                                // Mise à jour du rapport de récolte si la récolte n'a pas survécu à l'attaque parasitaire
                                embedReponse.data.fields[0].value = `Des ${typeParasite} on envahit la récolte et la plante est morte.`;
                                publicReponse.data.fields[0].value = `Des ${typeParasite} on envahit la récolte et la plante est morte.`;
                                publicReponse.setDescription(`**Tu n'as pas la main verte !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** n'a rien récolté.`);
                                if (typeParasite === 'chenilles') {
                                    image0 = new AttachmentBuilder(imgharvest0Chenille);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Chenille)}`);
                                }
                                if (typeParasite === 'limaces') {
                                    image0 = new AttachmentBuilder(imgharvest0Limace);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Limace)}`);
                                }
                                if (typeParasite === 'arraigné rouges') {
                                    image0 = new AttachmentBuilder(imgharvest0Araigne);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Araigne)}`);
                                }
                            } else {
                                harvestLevel = 1;
                                // Mise à jour du rapport de récolte si la récolte a survécu à l'attaque parasitaire
                                embedReponse.data.fields[0].value = `Des ${typeParasite} on envahit la récolte mais la plante a survécu.`;
                                publicReponse.data.fields[0].value = `Des ${typeParasite} on envahit la récolte mais la plante a survécu.`;
                                publicReponse.setDescription(`**Tu fera mieux la prochaine fois !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)}.`);
                                if (typeParasite === 'chenilles') {
                                    image1 = new AttachmentBuilder(imgharvest0Chenille);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Chenille)}`);
                                }
                                if (typeParasite === 'limaces') {
                                    image1 = new AttachmentBuilder(imgharvest0Limace);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Limace)}`);
                                }
                                if (typeParasite === 'arraigné rouges') {
                                    image1 = new AttachmentBuilder(imgharvest0Araigne);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Araigne)}`);
                                }
                            }                   
                        }
                    } else {
                        const qualityDown = randomAward(0.2); // 80% de chances de perdre un niveau de récolte
                        console.log(`qualityDown : ${qualityDown}`);
                        if (qualityDown) {
                            harvestLevel -= 1;
                        }
                        if (harvestLevel === 0) {
                            console.log(`Récolte de niveau 0 sans parasites`);
                            image0 = new AttachmentBuilder(imgharvest0);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`)
                            .setDescription(`**Tu n'as pas la main verte !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** n'a rien récolté.`);
                        }
                        if (harvestLevel === 1) {
                            console.log(`Récolte de niveau 1 sans parasites`);
                            image1 = new AttachmentBuilder(imgharvest1);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest1)}`)
                            .setDescription(`**Tu fera mieux la prochaine fois !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)}.`);
                        }
                    }
                    // Mise à jour du rapport de récolte
                    if (niveauArrosage === 0) { 
                        harvestLevel = 0;
                        embedReponse.data.fields[0].value = `Problème d'arrosage.`; 
                        publicReponse.data.fields[0].value = `Problème d'arrosage.`; 
                        
                    }
                    if (niveauArrosage > 7) {
                        embedReponse.data.fields[0].value = `Surement un problème d'arrosage.`; 
                        publicReponse.data.fields[0].value = `Surement un problème d'arrosage.`; 
                    }

                    award = randomAward(0.5); // 1 chance sur 2

                    switch (harvestLevel) {
                        case 0:
                            // Vide le slot
                            userId.plantations[slot] = {};

                            // Verrouille les boutons
                            slotRow2.components[0].setDisabled(true);
                            slotRow2.components[1].setDisabled(true);
                            slotRow2.components[2].setDisabled(true);
                            slotRow.components[2].setDisabled(true);
                            slotRow.components[1].setDisabled(true);
                            slotRow.components[0].setDisabled(true);

                            // RESET DE L'EMBED SLOT
                            slotEmbed.data.fields[0].value = "`Aucune`";
                            slotEmbed.data.fields[1].value = "`⭕ Non fertilisé`";
                            slotEmbed.data.fields[2].value = "`⭕ Non traité`";
                            slotEmbed.data.fields[3].value = "`0 fois`";
                            slotEmbed.data.fields[4].value = "`🕒 Non défini`";
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse

                            embedReponse.setDescription(`**Tu n'as pas la main verte !**\nNiveau de la récolte : ${harvestLevel}\n \rTu n'as rien récolté.`);
                            // Message de réponse à l'utilisateur
                            await buttonInteraction.reply({ content: `Ta récolte est visible par les autres growers ici <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            // Message de réponse publique
                            await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image0] , fetchReply: true });
                            
                            try {
                                menuOpen = false;
                                // Enregistrer dans la base de donnée
                                await saveDb(interaction.user.id, user);
                                slotRow.components[0].setDisabled(false);
                                slotRow.components[1].setDisabled(false);
                                slotRow2.components[0].setDisabled(false);
                                slotRow2.components[1].setDisabled(false);
                                slotRow2.components[2].setDisabled(false);
                                await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                                return;
                            } catch (error) {
                                await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                                console.error(error);
                            }
                        break;
                        case 1:
                            // Mettre à jour l'inventaire de l'utilisateur avec la récolte
                            userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 1);
                            userId.plantations[slot] = {};

                            // Verrouille les boutons
                            slotRow2.components[0].setDisabled(true);
                            slotRow2.components[1].setDisabled(true);
                            slotRow2.components[2].setDisabled(true);
                            slotRow.components[2].setDisabled(true);
                            slotRow.components[1].setDisabled(true);
                            slotRow.components[0].setDisabled(true);
                            // await interaction.editReply({ components: [slotRow, slotRow2] });

                            // RESET DE L'EMBED SLOT
                            slotEmbed.data.fields[0].value = "`Aucune`";
                            slotEmbed.data.fields[1].value = "`⭕ Non fertilisé`";
                            slotEmbed.data.fields[2].value = "`⭕ Non traité`";
                            slotEmbed.data.fields[3].value = "`0 fois`";
                            slotEmbed.data.fields[4].value = "`🕒 Non défini`";
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            embedReponse.setDescription(`**Tu fera mieux la prochaine fois !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)}.`);
                            // Message de réponse à l'utilisateur
                            await buttonInteraction.reply({ content: `Ta récolte est visible par les autres growers ici <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            // Message de réponse publique
                            await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image1] , fetchReply: true });

                            try {
                                menuOpen = false;
                                // Enregistrer dans la base de donnée
                                await saveDb(interaction.user.id, user);
                                slotRow.components[0].setDisabled(false);
                                slotRow.components[1].setDisabled(false);
                                slotRow2.components[0].setDisabled(false);
                                slotRow2.components[1].setDisabled(false);
                                slotRow2.components[2].setDisabled(false);
                                await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                                return;
                            } catch (error) {
                                await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                                console.error(error);
                            }
                        break
                        case 2:
                            // Mettre à jour l'inventaire de l'utilisateur avec la récolte
                            userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 1);
                            userId.plantations[slot] = {};

                            // Attribution des bonus / 1 graine du même type pour une récolte de niveau 2 (1 chance sur 2)
                            if (award) {
                                userInventory = updateUserInventory(userInventory, 'graine', typeGraine, 1);
                                embedReponse.setDescription(`**C'est pas mal !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)} et tu as récupéré 1 graine.`);
                                publicReponse.setDescription(`**C'est pas mal !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)} et 1 graine.`);
                            } else {
                                embedReponse.setDescription(`**C'est pas mal !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)}.`);
                                publicReponse.setDescription(`**C'est pas mal !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)}.`);
                            }

                            // Verrouille les boutons
                            slotRow2.components[0].setDisabled(true);
                            slotRow2.components[1].setDisabled(true);
                            slotRow2.components[2].setDisabled(true);
                            slotRow.components[2].setDisabled(true);
                            slotRow.components[1].setDisabled(true);
                            slotRow.components[0].setDisabled(true);
                            // await interaction.editReply({ components: [slotRow, slotRow2] });

                            // RESET DE L'EMBED SLOT
                            slotEmbed.data.fields[0].value = "`Aucune`";
                            slotEmbed.data.fields[1].value = "`⭕ Non fertilisé`";
                            slotEmbed.data.fields[2].value = "`⭕ Non traité`";
                            slotEmbed.data.fields[3].value = "`0 fois`";
                            slotEmbed.data.fields[4].value = "`🕒 Non défini`";
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image2 = new AttachmentBuilder(imgharvest2);
                            // Message de réponse à l'utilisateur
                            await buttonInteraction.reply({ content: `Ta récolte est visible par les autres growers ici <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            // Message de réponse publique
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest2)}`)
                            await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image2] , fetchReply: true });

                            try {
                                menuOpen = false;
                                // Enregistrer dans la base de donnée
                                await saveDb(interaction.user.id, user);
                                slotRow.components[0].setDisabled(false);
                                slotRow.components[1].setDisabled(false);
                                slotRow2.components[0].setDisabled(false);
                                slotRow2.components[1].setDisabled(false);
                                slotRow2.components[2].setDisabled(false);
                                await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                                return;
                            } catch (error) {
                                await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                                console.error(error);
                            }
                        break
                        case 3:
                            // Mettre à jour l'inventaire de l'utilisateur avec la récolte
                            userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 1);
                            userId.plantations[slot] = {};

                            // Attribution des bonus / Gain de 1 ou 2 graine du même type pour une récolte de niveau 3 
                            if (award) {
                                userInventory = updateUserInventory(userInventory, 'graine', typeGraine, 2);
                                embedReponse.setDescription(`**Belle récolte !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)} et tu as récupéré 2 graines.`);
                                publicReponse.setDescription(`**Belle récolte !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)} et 2 graines.`);
                            } else {
                                userInventory = updateUserInventory(userInventory, 'graine', typeGraine, 1);
                                embedReponse.setDescription(`**Belle récolte !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)} et tu as récupéré 1 graine.`);
                                publicReponse.setDescription(`**Belle récolte !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)} et 1 graine.`);
                            }

                            // Verrouille les boutons
                            slotRow2.components[0].setDisabled(true);
                            slotRow2.components[1].setDisabled(true);
                            slotRow2.components[2].setDisabled(true);
                            slotRow.components[2].setDisabled(true);
                            slotRow.components[1].setDisabled(true);
                            slotRow.components[0].setDisabled(true);
                            // await interaction.editReply({ components: [slotRow, slotRow2] });

                            // RESET DE L'EMBED SLOT
                            slotEmbed.data.fields[0].value = "`Aucune`";
                            slotEmbed.data.fields[1].value = "`⭕ Non fertilisé`";
                            slotEmbed.data.fields[2].value = "`⭕ Non traité`";
                            slotEmbed.data.fields[3].value = "`0 fois`";
                            slotEmbed.data.fields[4].value = "`🕒 Non défini`";
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image3 = new AttachmentBuilder(imgharvest3);
                            embedReponse.setImage(`attachment://${fileUrl(imgharvest3)}`);
                            // Message de réponse à l'utilisateur
                            await buttonInteraction.reply({ content: `Ta récolte est visible par les autres growers ici <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            // Message de réponse publique
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest3)}`)
                            await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image3] , fetchReply: true });

                            try {
                                menuOpen = false;
                                // Enregistrer dans la base de donnée
                                await saveDb(interaction.user.id, user);
                                slotRow.components[0].setDisabled(false);
                                slotRow.components[1].setDisabled(false);
                                slotRow2.components[0].setDisabled(false);
                                slotRow2.components[1].setDisabled(false);
                                slotRow2.components[2].setDisabled(false);
                                await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                                return;
                            } catch (error) {
                                await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                                console.error(error);
                            }
                        break
                        case 4:
                            // Vider le slot 
                            userId.plantations[slot] = {};

                            // Attribution des bonus //
                            // Double récolte OU 2 graines d'un type aléatoire
                            const awardArray = ['kush', 'amnezia', 'purple'];
                            const randomSelect = randomSelection(awardArray);

                            if (award) {
                                userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 2);
                                embedReponse.setDescription(`**Récolte incroyable !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 2 pieds de ${capitalize(typeGraine)}.`);
                                publicReponse.setDescription(`**Récolte incroyable !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 2 pieds de ${capitalize(typeGraine)}.`);
                            } else {
                                userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 1);
                                userInventory = updateUserInventory(userInventory, 'graine', randomSelect, 2);
                                embedReponse.setDescription(`**Récolte incroyable !**\nNiveau de la récolte : ${harvestLevel}\n \rTu as récolté 1 pied de ${capitalize(typeGraine)} et tu a récupéré 2 graines de ${capitalize(randomSelect)}.`);
                                publicReponse.setDescription(`**Récolte incroyable !**\nNiveau de la récolte : ${harvestLevel}\n \r**${user.nomServeur}** a récolté 1 pied de ${capitalize(typeGraine)} et 2 graines de ${capitalize(randomSelect)}.`);
                            }

                            // Verrouille les boutons
                            slotRow2.components[0].setDisabled(true);
                            slotRow2.components[1].setDisabled(true);
                            slotRow2.components[2].setDisabled(true);
                            slotRow.components[2].setDisabled(true);
                            slotRow.components[1].setDisabled(true);
                            slotRow.components[0].setDisabled(true);
                            // await interaction.editReply({ components: [slotRow, slotRow2] });

                            // RESET DE L'EMBED SLOT
                            slotEmbed.data.fields[0].value = "`Aucune`";
                            slotEmbed.data.fields[1].value = "`⭕ Non fertilisé`";
                            slotEmbed.data.fields[2].value = "`⭕ Non traité`";
                            slotEmbed.data.fields[3].value = "`0 fois`";
                            slotEmbed.data.fields[4].value = "`🕒 Non défini`";
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image4 = new AttachmentBuilder(imgharvest4);
                            embedReponse.setImage(`attachment://${fileUrl(imgharvest4)}`);
                            // Message de réponse à l'utilisateur
                            await buttonInteraction.reply({ content: `Ta récolte est visible par les autres growers ici <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            // Message de réponse publique
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest4)}`)
                            await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image4] , fetchReply: true });

                            try {
                                menuOpen = false;
                                // Enregistrer dans la base de donnée
                                await saveDb(interaction.user.id, user);
                                slotRow.components[0].setDisabled(false);
                                slotRow.components[1].setDisabled(false);
                                slotRow2.components[0].setDisabled(false);
                                slotRow2.components[1].setDisabled(false);
                                slotRow2.components[2].setDisabled(false);
                                await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                                return;
                            } catch (error) {
                                await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                                console.error(error);
                            }
                        break
                    }
                } else {
                    return await interaction.reply({ content: '>>> Tu ne peux pas récolter pour le moment !', ephemeral: true });
                }
            }
            // Boucle chaque variété de graine dispo
            for (const [key] of Object.entries(database.objets.graine)) {
                if (buttonInteraction.customId === `${key}_planting`) {
                    const variete = key;
                    const typesGrainesMaturation = [];
                    for (const [key] of Object.entries(database.objets.graine)) {
                        typesGrainesMaturation.push(key);
                    }
                // Charger les données
                const user = await loadUser(interaction.user.id);
                const userPlantations = user.plantations;

                // Vérifier si le slot est déjà en maturation
                if (typesGrainesMaturation.includes(userPlantations[slotActiv || slot].type)) {
                    await buttonInteraction.reply({ content: `>>> ${capitalize(slotActiv)} a déjà une graine en maturation.`, ephemeral: true });
                    return;
                }

                // Vérifier si l'utilisateur possède au moins une graine
                let userInventory = user.inventaire;
                if (userInventory.graine[variete] <= 0 || userInventory.graine[variete] === undefined) {
                    await buttonInteraction.reply({ content: `>>> Tu n'as aucune graine de ${capitalize(variete)} dans ton inventaire.`, ephemeral: true });
                    return;
                }

                const durationVariete = database.objets.graine[variete].temps;
                // Gestion des graines et du slot
                const userPlantationsSlot = userPlantations[slotActiv || slot];
                // Supprime la graine de l'inventaire de l'utilisateur
                userInventory = updateUserInventory(userInventory, 'graine', variete, -1);
                // Plante la graine dans le slot
                userPlantationsSlot.type = variete;
                // Défini le moment ou la  graine est plantée
                userPlantationsSlot.plantingTime = Date.now();
                // Défini le moment ou la plante pourra être récoltée
                userPlantationsSlot.readyTime = userPlantationsSlot.plantingTime + minutesToMs(durationVariete);

                // Actualisation du slot
                const tempsActuel = Date.now();
                const temps = formatMs(userPlantations[slotActiv || slot].readyTime - tempsActuel);
                if (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) {
                    statut = `\`Statut : ✅\``;
                } else {
                    statut = `\`Statut : 🕒 ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                    if (isNaN(temps.hours) && isNaN(temps.minutes) && isNaN(temps.seconds)) {
                        statut = `🕒 Non défini`;
                    }
                }
                let fert,antiP;
                if (userPlantations[slotActiv || slot].fertilized) {
                    fert = "`✅ Fertilisé`";
                } else {
                    fert = "`⭕ Non fertilisé`";
                }
                if (userPlantations[slotActiv || slot].antiParasite) {
                    antiP = "`✅ Traité`";
                } else {
                    antiP = "`⭕ Non traité`";
                }
                // Mettre à jour l'embed
                slotEmbed.setDescription(`Que souhaite tu faire ?`)
                .setColor(color)
                .setTitle(`Plantation : ${capitalize(slotActiv || slot)}`)
                .addFields(
                    { name: `Variété :`, value: `\`${capitalize(userPlantations[slotActiv || slot].type)}\`` },
                    { name: `Fertilisation :`, value: `\`${fert}\`` },
                    { name: `Anti-parasites :`, value: `\`${antiP}\`` },
                    { name: `Arrosage :`, value: `\`${userPlantations[slotActiv || slot].niveau_arrosage || 0} fois\`` },
                    { name: `Statut :`, value: `\`${statut}\`` }
                );
                await buttonInteraction.update({ embeds: [slotEmbed], components: [plantingRow] });

                // Empêcher l'utilisateur de cliqué une seconde fois après avoir planté la graine | ça évite de lui supprimer l'objet plusieurs fois
                // Verrouille les boutons
                plantingRow.components[3].setDisabled(true);
                plantingRow.components[0].setDisabled(true)
                plantingRow.components[1].setDisabled(true)
                plantingRow.components[2].setDisabled(true)
                await interaction.editReply({ components: [plantingRow] });

                // Réponse
                const imagePlanting = new AttachmentBuilder(imgplanting);
                const publicReponse = new EmbedBuilder()
                .setColor(color)
                .setTitle(`\`${capitalize(slotActiv || slot)}\``)
                .setImage(`attachment://${fileUrl(imgplanting)}`)
                .setDescription(`**${user.nomServeur}** à planté une graine de **${capitalize(variete)}** dans sa plantation.`);
                await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [imagePlanting] , fetchReply: true });

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);

                    if (userPlantationsSlot.type === "aucune" || userPlantationsSlot.type === undefined) {
                        // Vérrouillage des boutons si l'utilisateur n'a pas la graine asociée
                        if (userInventory.graine.kush <= 0 || userInventory.graine.kush === undefined) {
                            plantingRow.components[0].setDisabled(true)
                        }
                        if (userInventory.graine.amnezia <= 0 || userInventory.graine.amnezia === undefined) {
                            plantingRow.components[1].setDisabled(true)
                        }
                        if (userInventory.graine.purple <= 0 || userInventory.graine.purple === undefined) {
                            plantingRow.components[2].setDisabled(true)
                        }
                    }
                    // Sécurité sur le bouton Retour
                    plantingRow.components[3].setDisabled(false);
                    await interaction.editReply({ components: [plantingRow] });
                    return;
                } catch (error) {
                    await buttonInteraction.followUp({ content: `La sauvegarde a échoué.`, ephemeral: true });
                    console.error(error);
                }
                return;
                }
            }
            if (buttonInteraction.customId === 'retour') {
                // Recharger les données
                const user = await loadUser(interaction.user.id);
                // Créer le message d'embed principal
                const embed2 = new EmbedBuilder()
                .setColor(color)
                .setTitle('Tes plantations')
                .setDescription('Sélectionne une plantation pour effectuer une action.')
                // On boucle autant de fois qu'il y a de slots
                let nb = 0;
                for (const slot in userPlantations) {
                    nb++
                    // Créer les variables de plantation
                    let userType, userFertilized, userAntiParasite, userArrosage, userTimeleft;
                    // Créer un bouton pour chaque slot
                    const button = new ButtonBuilder()
                        .setCustomId(`slot_${slot}`)
                        .setLabel(`Slot ${nb}`)
                        .setStyle(ButtonStyle.Primary);
                    buttons.push(button);

                    // On gère les plantations au cas où l'utilisateur n'en a pas
                    if (userPlantations[slot].type === undefined) {
                        userType = "*`Vide`*";
                        userFertilized = " ";
                        userAntiParasite = " ";
                        userArrosage = " ";
                        userTimeleft = " ";
                    } else {
                        userFertilized = userPlantations[slot].fertilized ? "`Fertilisation : ✅`" : "`Fertilisation : ⭕`";
                        userAntiParasite = userPlantations[slot].antiParasite ? "`Anti-parasites : ✅`" : "`Anti-parasites : ⭕`";
                        userPlantations[slot].niveau_arrosage = userPlantations[slot].niveau_arrosage || 0;
                        const tempsActuel = Date.now();
                        const temps = formatMs(userPlantations[slot].readyTime - tempsActuel);

                        userType = `\`Variété : ${capitalize(userPlantations[slot].type)}\``;
                        userArrosage = `\`Arrosage : ${userPlantations[slot].niveau_arrosage} fois\``;
                        userTimeleft = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `\`Statut : ✅ Prête\`` : `\`Statut : 🕒 ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                        if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                            userTimeleft = `\`Statut : 🕒 Non défini\``;
                        }
                    }
                    embed2.addFields({ name: `🌿 Slot ${nb} :`, value: `${userType}\n${userFertilized}\n${userAntiParasite}\n${userArrosage}\n${userTimeleft}` })
                }

                await buttonInteraction.update({ embeds: [embed2], components: [row] });
                return;
            }
            // Met à jour le message
            await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2], fetchReply: true  });
        });

        collector.on('end', (message) => {
            interaction.followUp({ content: ">>> ⌛ **Ta plantation a expiré...**\n tape la commande \`/plantations\` pour y retourner. ", ephemeral: true }); 
            menuOpen = false;
            messagePlantations.delete(message);
        });
    },
};