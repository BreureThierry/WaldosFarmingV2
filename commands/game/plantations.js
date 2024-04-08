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
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}
// MENU
let menuOpen = false;
let openedByUserId;

// Login pour les envoi dans le channel public
client.login(process.env.token);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantations')
        .setDescription("Displays the user's plantations"),
    async execute(interaction) {
        // Vérifier si la plantation est ouverte
        const userId = interaction.user.id;

        // Récupère l'utilisateur
        const user = await loadUser(interaction.user.id);
        if (!user) { return interaction.reply({ content: `>>> ${locales.en.plantationNotGrower}\n \r${locales.fr.plantationNotGrower}`, ephemeral: true}); }
        if (!user.id) { return interaction.reply({ content: `>>> ${locales.en.plantationErrorLoadingUser}\n \r${locales.fr.plantationErrorLoadingUser}`, ephemeral: true}); }
        
        if (!user.lang) {
            user.lang = config.bot.defaultLang;
            console.log(`[plantations] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
        }

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            menuOpen = false;
        }

        if (menuOpen && userId === openedByUserId) {
            return interaction.reply({ content: `>>> ${locales[user.lang].plantationAlreadyOpened}`, ephemeral: true });
        } 
        menuOpen = true;
        openedByUserId = userId;

        const date = new Date().toLocaleString();
        let slotActiv;
        // Charger la base de données
        try {
            database = JSON.parse(fs.readFileSync("database/database.json", 'utf8'));
        } catch (error) {
            interaction.reply({ content: `>>> ${locales[user.lang].plantationErrorLoading}`, ephemeral: true});
            console.log(`${date} [plantations] Erreur lors du chargement de la base de données.`);
            console.error(error);
            return;
        }

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
        .setTitle(`${locales[user.lang].plantationTitle}`)
        .setDescription(`${locales[user.lang].plantationDescription}`)
        
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
                userType = `${locales[user.lang].plantationEmpty}`;
                userFertilized = " ";
                userAntiParasite = " ";
                userArrosage = " ";
                userTimeleft = " ";
            } else {
                userFertilized = userPlantations[slot].fertilized ? `${locales[user.lang].plantationFertilized}` : `${locales[user.lang].plantationNotFertilized}`;
                userAntiParasite = userPlantations[slot].antiParasite ? `${locales[user.lang].plantationPestTreatment}` : `${locales[user.lang].plantationNotPestTreatment}`;

                const tempsActuel = Date.now();
                const temps = formatMs(userPlantations[slot].readyTime - tempsActuel);

                userType = `\`${locales[user.lang].plantationVariety} ${capitalize(userPlantations[slot].type)}\``;
                userPlantations[slot].niveau_arrosage = userPlantations[slot].niveau_arrosage || 0;
                userArrosage = `\`${locales[user.lang].plantationWatering} ${userPlantations[slot].niveau_arrosage} ${locales[user.lang].plantationWateringTimes}\``;
                userTimeleft = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `${locales[user.lang].plantationStatusOk}` : `\`${locales[user.lang].plantationStatusInProgress} ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                    userTimeleft = `${locales[user.lang].plantationStatusUndefined}`;
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
                        .setLabel(`${locales[user.lang].plantationBtnPlanting}`)
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`arroser_${slot}`)
                        .setLabel(`${locales[user.lang].plantationBtnWatering}`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`recolter_${slot}`)
                        .setLabel(`${locales[user.lang].plantationBtnHarvest}`)
                        .setStyle(ButtonStyle.Primary),
                );
            const slotRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`fertiliser_${slot}`)
                        .setLabel(`${locales[user.lang].plantationBtnFertilize}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`antiparasite_${slot}`)
                        .setLabel(`${locales[user.lang].plantationBtnPestTreatment}`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`retour`)
                        .setLabel(`${locales[user.lang].plantationBtnBack}`)
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
                    .setLabel(`${locales[user.lang].plantationBtnBack}`)
                    .setStyle(ButtonStyle.Secondary)
                );

            let userPlantations = user.plantations;
            try {
                if (!user.inventaire) {
                    return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationError}`, ephemeral: true });
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
                if (userPlantations[slot].type === undefined || userPlantations[slot].type === 'aucune' || userPlantations[slot].type === '❌') {
                    userPlantations[slot].type = "❌";
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

                let fert = userPlantations[slot].fertilized ? `${locales[user.lang].plantationSlotFertilized}` : `${locales[user.lang].plantationSlotNotFertilized}`;
                let antiP = userPlantations[slot].antiParasite ? `${locales[user.lang].plantationSlotPestTreatment}` : `${locales[user.lang].plantationSlotNotPestTreatment}`;

                // Gestion du systeme de temps 
                const tempsActuel = Date.now();
                const tempsRestant = userPlantations[slot].readyTime - tempsActuel;

                // Si le temps restant est négatif ou égal à 0, affiche "Prête à être récoltée" et déverrouille le bouton de récolte
                if (tempsRestant <= 0) {
                    statut = `${locales[user.lang].plantationSlotStatusReady}`;
                    slotRow.components[2].setDisabled(false);
                } else {
                    // Verrouille le bouton de récolte
                    slotRow.components[2].setDisabled(true);
                }
                // Formater le temps restant en heures, minutes et secondes
                const temps = formatMs(tempsRestant);

                statut = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `${locales[user.lang].plantationSlotReady}` : `\`🕒 ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                        if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                            statut = `${locales[user.lang].plantationSlotUndefined}`;
                        }
                
                // Actualise le slot
                slotEmbed.setDescription(`${locales[user.lang].plantationSlotDescription}`)
                .setColor(color)
                .setTitle(`${locales[user.lang].plantationSlotTitle} ${capitalize(slot)}`)
                .addFields(
                    { name: `${locales[user.lang].plantationSlotStatusPlantation}`, value: `\`${capitalize(userPlantations[slot].type)}\`` },
                    { name: `${locales[user.lang].plantationSlotFertilized0}`, value: `\`${fert}\`` },
                    { name: `${locales[user.lang].plantationSlotPestTreatment0}`, value: `\`${antiP}\`` },
                    { name: `${locales[user.lang].plantationSlotWatering}`, value: `\`${userPlantations[slot].niveau_arrosage} ${locales[user.lang].plantationWateringTimes}\`` },
                    { name: `${locales[user.lang].plantationSlotStatus0}`, value: `\`${statut}\`` }
                );
            }

            //=====================================================//
            // Gère les interactions des boutons pour tous les slots
            if (buttonInteraction.customId === `fertiliser_${slot}`) {
                // Vérifie si l'utilisateur possède du fertilisant
                if (user.inventaire.outils.fertilisant <= 0 || user.inventaire.outils.fertilisant === undefined) {
                    return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationSlotFertilizedNotItem}`, ephemeral: true });
                }
                // Vérifie si le slot est déjà fertilisé
                if (userPlantations[slot].fertilized) {
                    return await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} ${locales[user.lang].plantationSlotAlreadyFertilized}`, ephemeral: true });
                } else {
                    // Supprimer l'objet de l'inventaire de l'utilisateur
                    let userInventory = user.inventaire;
                    userInventory = updateUserInventory(userInventory, 'outils', 'fertilisant', -1);
                    // Fertilise le slot
                    userPlantations[slot].fertilized = true;

                    // Vérrouiller le bouton
                    slotRow2.components[0].setDisabled(true);
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[1].value = `${locales[user.lang].plantationSlotFertilized}`;

                    if (userPlantations[slot].antiParasite) {
                        slotRow2.components[1].setDisabled(true);
                    }
                    
                    try {
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                        // Enregistrer dans la base de donnée
                        await saveDb(interaction.user.id, user);
                    } catch (error) {
                        console.error(error);
                        return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationError1}`, ephemeral: true });
                    }
                }
                return;
            }
            if (buttonInteraction.customId === `antiparasite_${slot}`) {
                // Vérifie si l'utilisateur possède du produit anti-parasite
                if (user.inventaire.outils.produit_antiparasite <= 0 || user.inventaire.outils.produit_antiparasite === undefined) {
                    return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationSlotPestTreatmentNotItem}`, ephemeral: true });
                }
                // Vérifie si le slot est déjà traité
                if (userPlantations[slot].antiParasite) {
                    return await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} ${locales[user.lang].plantationSlotAlreadyPestTreatment}`, ephemeral: true });
                } else {
                    // Supprimer l'objet de l'inventaire de l'utilisateur
                    let userInventory = user.inventaire;
                    userInventory = updateUserInventory(userInventory, 'outils', 'produit_antiparasite', -1);
                    // Traite le slot
                    userPlantations[slot].antiParasite = true;

                    // Vérrouiller le bouton
                    slotRow2.components[1].setDisabled(true);
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[2].value = `${locales[user.lang].plantationSlotPestTreatment}`;
                    
                    if (userPlantations[slot].fertilized) {
                        slotRow2.components[0].setDisabled(true);
                    }

                    try {
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                        // Enregistrer dans la base de donnée
                        await saveDb(interaction.user.id, user);
                    } catch (error) {
                        console.error(error);
                        return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationError2}`, ephemeral: true });
                    }
                }
                return;
            }
            if (buttonInteraction.customId === `planter_${slot}`) {
                const user = await loadUser(interaction.user.id);
                // Vérifie si le slot à déjà une graine                
                if (user.plantations[slot].type === "❌" || user.plantations[slot].type === "aucune" || user.plantations[slot].type === undefined) {
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
                    try {
                        // Mettre à jour la ligne de bouton pour que l'utilisateur choisisse la graine qu'il souhaite planter
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [plantingRow] });
                    } catch (error) {
                        console.error(error);
                    }
                    // Variable global pour récupérer le slot plus loin
                    slotActiv = slot;
                    return;
                } else {
                    try {
                        await buttonInteraction.reply({ content: `>>> ${capitalize(slot)} ${locales[user.lang].plantationAlreadyPlanting}`, ephemeral: true });
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
                    return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].plantationDontHaveWateringCan}`, ephemeral: true });
                }
                try {
                    // Arrose le slot
                    userPlantations[slot].niveau_arrosage += 1;
                    // Mettre à jour l'embed
                    slotEmbed.data.fields[3].value = `\`${userPlantations[slot].niveau_arrosage} ${locales[user.lang].plantationWateringTimes}\``;
                    try {
                        await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2] });
                    } catch (error) {
                        console.error(error);
                    }
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);
                    return;
                } catch (error) {
                    await buttonInteraction.followUp({ content: `>>> ${locales[user.lang].plantationErrorLoading}`, ephemeral: true });
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
                    return await interaction.reply({ content: `>>> ${locales[user.lang].plantationNotGrower}`, ephemeral: true });
                }
                // Vérifier si le slot est vide
                if (!slot || Object.keys(slot).length === 0) {
                    return await interaction.followUp({ content: `>>> ${locales[user.lang].plantationNothingToHarvest}`, ephemeral: true });
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
                    return await interaction.reply({ content: `>>> ${locales[user.lang].plantationVarietyDoesNotExist}`, ephemeral: true });
                }              
                
                // Construction de l'embed de réponse
                const embedReponse = new EmbedBuilder().setColor(color).setTitle(`\`${capitalize(slot)}\``);
                const publicReponse = new EmbedBuilder().setColor(color).setTitle(`\`${capitalize(slot)}\``);
                embedReponse.addFields( { name: `${locales[user.lang].plantationHarvestreport}`, value: `${locales[user.lang].plantationHarvestreportNoIssues}` } );
                publicReponse.addFields( { name: `${locales[user.lang].plantationHarvestreport}`, value: `${locales[user.lang].plantationHarvestreportNoIssues}` } );

                const exigenceGraine = database.objets.graine[typeGraine].exigence;

                // Vérifier si le slot peut être récolté (temps)
                const tempsActuel = Date.now();
                const tempsRestant = userSlot.readyTime - tempsActuel;
                
                const attackParasite = randomAward(0.3); // 70% de chances d'une invasion parasitaire
                const dyingPlant = randomAward(0.5); // 50% de chances que la plante meurt
                const listParasites = [database.objets.parasites[1].name[user.lang],database.objets.parasites[2].name[user.lang],database.objets.parasites[3].name[user.lang]];
                const typeParasite = randomSelection(listParasites);
                let image0,image1;
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
                    // console.log(`-- CHECK --\n[plantations] ${slot} :\n- Attaque parasitaire : ${attackParasite} \n- Plante mourante : ${dyingPlant} \n- Type de parasite : ${typeParasite} \n- Niveau de récolte : ${harvestLevel}`);

                    // Si le slot est fertilisé on ajoute 1 au niveau de récolte
                    if (userSlot.fertilized) { harvestLevel += 1; }
                    // Si le slot n'est pas traité contre les parasites
                    if (!userSlot.antiParasite) {
                        if (attackParasite) {               
                            if (dyingPlant) {
                                harvestLevel = 0;
                                // Mise à jour du rapport de récolte si la récolte n'a pas survécu à l'attaque parasitaire
                                embedReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestreportSome} ${typeParasite} ${locales[user.lang].plantationHarvestreportPlantDie}`;
                                publicReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestreportSome} ${typeParasite} ${locales[user.lang].plantationHarvestreportPlantDie}`;
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote0}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestUserCollectedNothingPublic}`);
                                if (typeParasite === database.objets.parasites[1].name[user.lang]) {
                                    image0 = new AttachmentBuilder(imgharvest0Chenille);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Chenille)}`);
                                }
                                if (typeParasite === database.objets.parasites[2].name[user.lang]) {
                                    image0 = new AttachmentBuilder(imgharvest0Limace);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Limace)}`);
                                }
                                if (typeParasite === database.objets.parasites[3].name[user.lang]) {
                                    image0 = new AttachmentBuilder(imgharvest0Araigne);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Araigne)}`);
                                }
                            } else {
                                harvestLevel = 1;
                                // Mise à jour du rapport de récolte si la récolte a survécu à l'attaque parasitaire
                                embedReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestreportSome} ${typeParasite} ${locales[user.lang].plantationHarvestreportPlantSurvive}`;
                                publicReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestreportSome} ${typeParasite} ${locales[user.lang].plantationHarvestreportPlantSurvive}`;
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote1}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)}.`);                 
                                if (typeParasite === database.objets.parasites[1].name[user.lang]) {
                                    image1 = new AttachmentBuilder(imgharvest0Chenille);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Chenille)}`);
                                }
                                if (typeParasite === database.objets.parasites[2].name[user.lang]) {
                                    image1 = new AttachmentBuilder(imgharvest0Limace);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Limace)}`);
                                }
                                if (typeParasite === database.objets.parasites[3].name[user.lang]) {
                                    image1 = new AttachmentBuilder(imgharvest0Araigne);
                                    publicReponse.setImage(`attachment://${fileUrl(imgharvest0Araigne)}`);
                                }
                            }                   
                        } else {
                            image1 = new AttachmentBuilder(imgharvest1);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest1)}`);
                            image0 = new AttachmentBuilder(imgharvest0);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`);
                        }
                    } else {
                        const qualityDown = randomAward(0.25); // 75% de chances de perdre un niveau de récolte
                        if (qualityDown) {
                            harvestLevel -= 1;
                        }
                        if (harvestLevel <= 0) {
                            harvestLevel = 0;
                            image0 = new AttachmentBuilder(imgharvest0);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`)
                            .setDescription(`**${locales[user.lang].plantationHarvestLevelNote0}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestUserCollectedNothingPublic}`);
                        }
                        if (harvestLevel === 1) {
                            image1 = new AttachmentBuilder(imgharvest1);
                            publicReponse.setImage(`attachment://${fileUrl(imgharvest1)}`)
                            .setDescription(`**${locales[user.lang].plantationHarvestLevelNote1}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)}.`);
                        }
                    }

                    // Sécurité pour éviter un niveau de récolte négatif
                    if (harvestLevel <= 0) {
                        harvestLevel = 0;
                    }

                    // Mise à jour du rapport de récolte
                    if (niveauArrosage === 0) { 
                        harvestLevel = 0;
                        embedReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestWateringProblem}`; 
                        publicReponse.data.fields[0].value = `${locales[user.lang].plantationHarvestWateringProblem}`; 
                        image0 = new AttachmentBuilder(imgharvest0);
                        publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`)
                        publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote0}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestUserCollectedNothingPublic}`);
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
                            slotEmbed.data.fields[0].value = `${locales[user.lang].plantationRefreshVariety}`;
                            slotEmbed.data.fields[1].value = `${locales[user.lang].plantationRefreshFertilization}`;
                            slotEmbed.data.fields[2].value = `${locales[user.lang].plantationRefreshPestTreatment}`;
                            slotEmbed.data.fields[3].value = `\`0 ${locales[user.lang].plantationWateringTimes}\``;
                            slotEmbed.data.fields[4].value = `${locales[user.lang].plantationSlotUndefined}`;
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote0}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestUserCollectedNothing}`);
                            try {
                                // Message de réponse à l'utilisateur
                                await buttonInteraction.reply({ content: `${locales[user.lang].plantationHarvestVisible} <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            } catch (error) {
                                console.error(error);
                            }
                            
                            if (image0 === undefined) {
                                console.log('case 1 image1 undefined replaced by imgharvest1');
                                image1 = new AttachmentBuilder(imgharvest0);
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`);
                            }
                            if (!attackParasite) {
                                // console.log('Attaque parasitaire non déclenchée');
                                image0 = new AttachmentBuilder(imgharvest0);
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest0)}`)
                                .setDescription(`**${locales[user.lang].plantationHarvestLevelNote0}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestUserCollectedNothingPublic}`);
                            }
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
                                await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
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
                            slotEmbed.data.fields[0].value = `${locales[user.lang].plantationRefreshVariety}`;
                            slotEmbed.data.fields[1].value = `${locales[user.lang].plantationRefreshFertilization}`;
                            slotEmbed.data.fields[2].value = `${locales[user.lang].plantationRefreshPestTreatment}`;
                            slotEmbed.data.fields[3].value = `\`0 ${locales[user.lang].plantationWateringTimes}\``;
                            slotEmbed.data.fields[4].value = `${locales[user.lang].plantationSlotUndefined}`;
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote1}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)}.`);
                            
                            try {
                                // Message de réponse à l'utilisateur
                                await buttonInteraction.reply({ content: `${locales[user.lang].plantationHarvestVisible} <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                            } catch (error) {
                                console.error(error);
                            }
                            // Message de réponse publique
                            if (image1 === undefined) {
                                console.log('case 1 image1 undefined replaced by imgharvest1');
                                image1 = new AttachmentBuilder(imgharvest1);
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest1)}`);
                            }
                            if (!attackParasite) {
                                // console.log('Attaque parasitaire non déclenchée');
                                image1 = new AttachmentBuilder(imgharvest1);
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest1)}`)
                                .setDescription(`**${locales[user.lang].plantationHarvestLevelNote1}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)}.`);
                            }
                            
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
                                await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
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
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote2}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel3Public}`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote2}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel3Public}`);
                            } else {
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote2}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)}.`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote2}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)}.`);
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
                            slotEmbed.data.fields[0].value = `${locales[user.lang].plantationRefreshVariety}`;
                            slotEmbed.data.fields[1].value = `${locales[user.lang].plantationRefreshFertilization}`;
                            slotEmbed.data.fields[2].value = `${locales[user.lang].plantationRefreshPestTreatment}`;
                            slotEmbed.data.fields[3].value = `\`0 ${locales[user.lang].plantationWateringTimes}\``;
                            slotEmbed.data.fields[4].value = `${locales[user.lang].plantationSlotUndefined}`;
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image2 = new AttachmentBuilder(imgharvest2);
                            try {
                                // Message de réponse à l'utilisateur
                                await buttonInteraction.reply({ content: `${locales[user.lang].plantationHarvestVisible} <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                                // Message de réponse publique
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest2)}`)
                                await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image2] , fetchReply: true });
                            } catch (error) {
                                console.error(error);
                            }

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
                                await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
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
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote3}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel4Public}`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote3}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel4Public}`);
                            } else {
                                userInventory = updateUserInventory(userInventory, 'graine', typeGraine, 1);
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote3}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel3Public}`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote3}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel3Public}`);
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
                            slotEmbed.data.fields[0].value = `${locales[user.lang].plantationRefreshVariety}`;
                            slotEmbed.data.fields[1].value = `${locales[user.lang].plantationRefreshFertilization}`;
                            slotEmbed.data.fields[2].value = `${locales[user.lang].plantationRefreshPestTreatment}`;
                            slotEmbed.data.fields[3].value = `\`0 ${locales[user.lang].plantationWateringTimes}\``;
                            slotEmbed.data.fields[4].value = `${locales[user.lang].plantationSlotUndefined}`;
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image3 = new AttachmentBuilder(imgharvest3);
                            embedReponse.setImage(`attachment://${fileUrl(imgharvest3)}`);
                            try {
                                // Message de réponse à l'utilisateur
                                await buttonInteraction.reply({ content: `${locales[user.lang].plantationHarvestVisible} <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                                // Message de réponse publique
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest3)}`)
                                await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image3] , fetchReply: true });
                            } catch (error) {
                                console.error(error);
                            }

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
                                await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
                                console.error(error);
                            }
                        break
                        case 4:
                            // Vider le slot 
                            userId.plantations[slot] = {};

                            // Attribution des bonus //

                            if (award) {
                                userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 2);
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote4}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel2} ${capitalize(typeGraine)}.`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote4}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel2Public} ${capitalize(typeGraine)}.`);
                            } else {
                                userInventory = updateUserInventory(userInventory, 'plante', typeGraine, 1);
                                userInventory = updateUserInventory(userInventory, 'graine', typeGraine, 4);
                                embedReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote4}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r${locales[user.lang].plantationHarvestLevel1} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel5Public}`);
                                publicReponse.setDescription(`**${locales[user.lang].plantationHarvestLevelNote4}**\n${locales[user.lang].plantationHarvestLevel} ${harvestLevel}\n \r**${user.nomServeur}** ${locales[user.lang].plantationHarvestLevel1Public} ${capitalize(typeGraine)} ${locales[user.lang].plantationHarvestLevel5Public}`);
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
                            slotEmbed.data.fields[0].value = `${locales[user.lang].plantationRefreshVariety}`;
                            slotEmbed.data.fields[1].value = `${locales[user.lang].plantationRefreshFertilization}`;
                            slotEmbed.data.fields[2].value = `${locales[user.lang].plantationRefreshPestTreatment}`;
                            slotEmbed.data.fields[3].value = `\`0 ${locales[user.lang].plantationWateringTimes}\``;
                            slotEmbed.data.fields[4].value = `${locales[user.lang].plantationSlotUndefined}`;
                            await interaction.editReply({ embeds: [slotEmbed], components: [slotRow, slotRow2] });

                            // Réponse
                            const image4 = new AttachmentBuilder(imgharvest4);
                            embedReponse.setImage(`attachment://${fileUrl(imgharvest4)}`);
                            try {
                                // Message de réponse à l'utilisateur
                                await buttonInteraction.reply({ content: `${locales[user.lang].plantationHarvestVisible} <#${config.bot.farmingChannel}>.`,embeds: [embedReponse], ephemeral: true });
                                // Message de réponse publique
                                publicReponse.setImage(`attachment://${fileUrl(imgharvest4)}`)
                                await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [image4] , fetchReply: true });
                            } catch (error) {
                                console.error(error);
                            }

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
                                await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
                                console.error(error);
                            }
                        break
                    }
                } else {
                    return await interaction.reply({ content: `>>> ${locales[user.lang].plantationCantHarvest}`, ephemeral: true });
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
                    await buttonInteraction.reply({ content: `>>> ${capitalize(slotActiv)} ${locales[user.lang].plantationAlreadySeedMaturation}`, ephemeral: true });
                    return;
                }

                // Vérifier si l'utilisateur possède au moins une graine
                let userInventory = user.inventaire;
                if (userInventory.graine[variete] <= 0 || userInventory.graine[variete] === undefined) {
                    await buttonInteraction.reply({ content: `>>> ${capitalize(slotActiv)} ${locales[user.lang].plantationHaveNotSeed}`, ephemeral: true });
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
                    statut = `${locales[user.lang].plantationStatusOk1}`;
                } else {
                    statut = `\`${locales[user.lang].plantationStatusInProgress} ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                    if (isNaN(temps.hours) && isNaN(temps.minutes) && isNaN(temps.seconds)) {
                        statut = `${locales[user.lang].plantationSlotUndefined}`;
                    }
                }
                let fert,antiP;
                if (userPlantations[slotActiv || slot].fertilized) {
                    fert = `${locales[user.lang].plantationSlotFertilized}`;
                } else {
                    fert = `${locales[user.lang].plantationRefreshFertilization}`;
                }
                if (userPlantations[slotActiv || slot].antiParasite) {
                    antiP = `${locales[user.lang].plantationSlotPestTreatment}`;
                } else {
                    antiP = `${locales[user.lang].plantationRefreshPestTreatment}`;
                }
                // Mettre à jour l'embed
                slotEmbed.setDescription(`${locales[user.lang].plantationSlotDescription}`)
                .setColor(color)
                .setTitle(`${locales[user.lang].plantationSlotTitle} ${capitalize(slotActiv || slot)}`)
                .addFields(
                    { name: `${locales[user.lang].plantationVariety}`, value: `\`${capitalize(userPlantations[slotActiv || slot].type)}\`` },
                    { name: `${locales[user.lang].plantationSlotFertilized0}`, value: `\`${fert}\`` },
                    { name: `${locales[user.lang].plantationSlotPestTreatment0}`, value: `\`${antiP}\`` },
                    { name: `${locales[user.lang].plantationSlotWatering}`, value: `\`${userPlantations[slotActiv || slot].niveau_arrosage || 0} ${locales[user.lang].plantationWateringTimes}\`` },
                    { name: `${locales[user.lang].plantationSlotStatus0}`, value: `\`${statut}\`` }
                );
                try {
                    await buttonInteraction.update({ embeds: [slotEmbed], components: [plantingRow] });
                } catch (error) {
                    console.error(error);
                }

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
                .setDescription(`**${user.nomServeur}** ${locales[user.lang].plantationUserPlanted} **${capitalize(variete)}**`);
                await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [imagePlanting] , fetchReply: true });

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);

                    if (userPlantationsSlot.type === "❌" || userPlantationsSlot.type === "aucune" || userPlantationsSlot.type === undefined) {
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
                    await buttonInteraction.followUp({ content: `${locales[user.lang].plantationError3}`, ephemeral: true });
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
                .setTitle(`${locales[user.lang].plantationTitle}`)
                .setDescription(`${locales[user.lang].plantationDescription}`)
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
                        userType = `${locales[user.lang].plantationEmpty}`;
                        userFertilized = " ";
                        userAntiParasite = " ";
                        userArrosage = " ";
                        userTimeleft = " ";
                    } else {
                        userFertilized = userPlantations[slot].fertilized ? `${locales[user.lang].plantationFertilized}` : `${locales[user.lang].plantationNotFertilized}`;
                        userAntiParasite = userPlantations[slot].antiParasite ? `${locales[user.lang].plantationPestTreatment}` : `${locales[user.lang].plantationNotPestTreatment}`;
                        userPlantations[slot].niveau_arrosage = userPlantations[slot].niveau_arrosage || 0;
                        const tempsActuel = Date.now();
                        const temps = formatMs(userPlantations[slot].readyTime - tempsActuel);

                        userType = `\`${locales[user.lang].plantationVariety} ${capitalize(userPlantations[slot].type)}\``;
                        userArrosage = `\`${locales[user.lang].plantationWatering} ${userPlantations[slot].niveau_arrosage} ${locales[user.lang].plantationWateringTimes}\``;
                        userTimeleft = (temps.hours <= 0 && temps.minutes <= 0 && temps.seconds <= 0) ? `${locales[user.lang].plantationStatusOk}` : `\`${locales[user.lang].plantationStatusInProgress} ${temps.hours}h ${temps.minutes}m ${temps.seconds}s\``;
                        if (isNaN(temps.hours) || isNaN(temps.minutes) || isNaN(temps.seconds)) {
                            userTimeleft = `${locales[user.lang].plantationStatusUndefined}`;
                        }
                    }
                    embed2.addFields({ name: `🌿 Slot ${nb} :`, value: `${userType}\n${userFertilized}\n${userAntiParasite}\n${userArrosage}\n${userTimeleft}` })
                }
                try {
                    await buttonInteraction.update({ embeds: [embed2], components: [row] });
                } catch (error) {
                    console.error(error);
                }
                return;
            }
            try {
                // Met à jour le message
                if (!buttonInteraction.replied) {
                    await buttonInteraction.update({ embeds: [slotEmbed], components: [slotRow, slotRow2], fetchReply: true  });
                    return;
                } else {
                    console.log("Interaction déjà répondu ou expiré");
                }
            } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 10062) {
                    console.log("L'interaction est inconnue ou a expiré");
                } else {
                    // Gérer les autres types d'erreurs
                    console.error(error);
                }
            }
        });
        collector.on('end', (message) => {
            interaction.followUp({ content: `>>> ⌛ ${locales[user.lang].plantationExpired}`, ephemeral: true }); 
            menuOpen = false;
            messagePlantations.delete(message);
        });
    },
};
