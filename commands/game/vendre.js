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
const { saveDb, loadUser, capitalize, fileUrl, minutesToMs } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;
// IMAGES
const imgSelling = './assets/img/marchand.png';
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}
// MENU
let sellerOpen = false;
let openedByUserId;

client.login(process.env.token);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell your crops to a merchant.'),
    async execute(interaction) {
        const date = new Date().toLocaleString();
        // Charger la base de données
        try {
            database = JSON.parse(fs.readFileSync("database/database.json", 'utf8'));
        } catch (error) {
            interaction.reply({ content: `>>> ${locales.en.sellerErrorLoading}\n \r${locales.fr.sellerError}`, ephemeral: true});
            console.log(`${date} [vendre] Erreur lors du chargement de la base de données.`);
            console.error(error);
            return;
        }

        // Récupère l'utilisateur
        const user = await loadUser(interaction.user.id);
        if (!user) { return interaction.reply({ content: `>>> ${locales.en.sellerNotGrower}\n \r${locales.fr.sellerNotGrower}`, ephemeral: true}); }
        if (!user.id) { return interaction.reply({ content: `>>> ${locales.en.sellerErrorLoading}\n \r${locales.fr.sellerErrorLoading}`, ephemeral: true}); }
        
        if (!user.lang) {
            user.lang = config.bot.defaultLang;
            console.log(`Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
            // Enregistrer dans la base de donnée
            // await saveDb(interaction.user.id, user);
        }

        
        // Vérifier si le menu marchand est ouvert
        const userId = interaction.user.id;

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            sellerOpen = false;
        }

        if (sellerOpen && userId === openedByUserId) {
            return interaction.reply({ content: `>>> ${locales.en.sellerAlreadyOpened}`, ephemeral: true });
        } 
        sellerOpen = true;
        openedByUserId = userId;

        // Créer le bouton "Vendre" et la ligne d'action
        const vendrePlanteButton = new ButtonBuilder()
            .setCustomId('vendre_plante')
            .setLabel(`${locales[user.lang].sellerSellingPlants}`)
            .setEmoji('🌿')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);
        const rowVendre = new ActionRowBuilder().addComponents(vendrePlanteButton);

        for (const [key, value] of Object.entries(database.objets.graine)) {
            const name = capitalize(key);
            const price = value.prix;
            const valeurGraines = database.objets.graine[key].prix * user.inventaire.graine[key];
            if (!user.inventaire.graine[key]) {
                user.inventaire.graine[key] = 0;
            }
            const button = new ButtonBuilder()
                .setCustomId(`vendre_${key}`)
                .setLabel(`${locales[user.lang].sellerSelling} ${user.inventaire.graine[key]} ${locales[user.lang].sellerSeedsOf} ${name} (${valeurGraines} ${devise})`)
                .setEmoji('🌱')
                .setDisabled(true)
                .setStyle(ButtonStyle.Success);
                if (user.inventaire.graine[key] > 0) {
                    button.setDisabled(false);
                }
            rowVendre.addComponents(button);
        }

        // Récupère l'inventaire de l'utilisateur (money et plante)
        const userMoney = user.inventaire.money;
        const userPlants = user.inventaire.plante;

        // Récupère les objets (plante) dans la base de donnée
        const dbPlants = database.objets.plante;

        // Valeur totale de l'inventaire de l'utilisateur
        let totalValueInventory = 0;

        // Vérifier si l'utilisateur possède plante kush
        if (userPlants.hasOwnProperty('kush')) {
            if (userPlants.kush > 0) {
                totalValueInventory += userPlants.kush * dbPlants.kush.valeur;
                vendrePlanteButton.setDisabled(false);
            }
        }
        // Vérifier si l'utilisateur possède plante amnezia
        if (userPlants.hasOwnProperty('amnezia')) {
            if (userPlants.amnezia > 0) {
                totalValueInventory += userPlants.amnezia * dbPlants.amnezia.valeur;
                vendrePlanteButton.setDisabled(false);
            }
        }
        // Vérifier si l'utilisateur possède plante purple
        if (userPlants.hasOwnProperty('purple')) {
            if (userPlants.purple > 0) {
                totalValueInventory += userPlants.purple * dbPlants.purple.valeur;
                vendrePlanteButton.setDisabled(false);
            }
        }

        const embedMarchand = new EmbedBuilder()
        .setTitle(`${locales[user.lang].sellerSelling}`)
        .setImage('https://media.discordapp.net/attachments/1214678292909785088/1221094357373816912/marchand.png?ex=661153bd&is=65fedebd&hm=ec0a4e4672480f4e9da53a71fe7cd2e62e3dd3057f7a16825d4811aa8f7594ad&=&format=webp&quality=lossless&width=810&height=491')
        .setColor(color)
        .setDescription(`${locales[user.lang].sellerDescription}`)

        // Récupère les infos de chaque plantes dans la base de donnée pour afficher les prix du marchand
        for (const [key, value] of Object.entries(dbPlants)) {
            const name = capitalize(key);
            const price = value.valeur;
            embedMarchand.addFields({ name: `${name} :`, value: `*${locales[user.lang].sellerPlantsField} \`${price} ${devise}\` ${locales[user.lang].sellerPlantsField2}*`})
        }
        embedMarchand.addFields({ name: `${locales[user.lang].sellerSeedsTitle}`, value: `*${locales[user.lang].sellerSeedsField}*`})

        embedMarchand.addFields({ name: `${locales[user.lang].sellerTotalValue}`, value: `🌿 ${locales[user.lang].sellerPlants} *${totalValueInventory} ${devise}*`})
        
        const marchandMessage = await interaction.reply({ embeds: [embedMarchand], components: [rowVendre], fetchReply: true, ephemeral: true});


        // Message de vente
        const embedMessage = new EmbedBuilder().setColor(color)

        // Créer un collecteur d'interaction pour les boutons de slot
        const filter = (i) => i.user.id === interaction.user.id;
        // 5 minutes de délai avant la suppression de l'interface
        const collector = marchandMessage.createMessageComponentCollector({filter , time: minutesToMs(2), dispose: true});
        // Gérer les interactions avec les boutons
        collector.on('collect', async (buttonInteraction) => {
            // Gère les boutons sélectionné
            if (buttonInteraction.customId === 'vendre_plante') {
                // Désactive le bouton vendre
                vendrePlanteButton.setDisabled(true).setStyle(ButtonStyle.Danger);
                await buttonInteraction.update({embeds: [embedMarchand], components: [rowVendre], fetchReply: true, ephemeral: true});

                // Supprime les plantes de l'utilisateur
                user.inventaire.plante = {};

                // Gain d'xp en fonction de la valeur de la vente
                let phraseSupp;
                switch (true) {
                    case (totalValueInventory < 100):
                        phraseSupp = `${locales[user.lang].sellerAdditionalSentence1}`;
                        // user.xp += totalValueInventory;
                        break;
                    case (totalValueInventory > 100 && totalValueInventory < 500):
                        phraseSupp = `${locales[user.lang].sellerAdditionalSentence2}`;
                        // user.xp += 1000;
                        break;
                    case (totalValueInventory > 500 && totalValueInventory < 1000):
                        phraseSupp = `${locales[user.lang].sellerAdditionalSentence3}`;
                        // user.xp += 5000;
                        break;
                    case (totalValueInventory > 1000):
                        phraseSupp = `${locales[user.lang].sellerAdditionalSentence4}`;
                        // user.xp += 10000;
                        break;
                    default:    
                        phraseSupp = `${locales[user.lang].sellerAdditionalSentence0}`;
                    break;
                }

                // Crédite l'utilisateur de la valeur totale
                user.inventaire.money += totalValueInventory;

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);
                    // Réponse privée
                    embedMessage.setTitle(`${locales[user.lang].sellerSaleCompleted}`).setDescription(`>>> ${locales[user.lang].sellerSaleCompletedAdditional1} ${interaction.user.globalName}.\n${locales[user.lang].sellerSaleCompletedAdditional2} \`${totalValueInventory} ${devise}\`.\n \r${locales[user.lang].sellerSaleCompletedAdditional3}`);
                    embedMarchand.data.fields[4].value = `🌿 ${locales[user.lang].sellerPlants} 0 ${devise}`;
                    await buttonInteraction.editReply({ embeds: [embedMarchand], ephemeral: true });
                    await interaction.followUp({ embeds: [embedMessage], ephemeral: true });

                    // Réponse publique
                    const imageSelling = new AttachmentBuilder(imgSelling);
                    const publicReponse = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${locales[user.lang].sellerTitle}`)
                    .setImage(`attachment://${fileUrl(imgSelling)}`)
                    .setDescription(`**${user.nomServeur}** ${locales[user.lang].sellerPublic} \`${totalValueInventory} ${devise}\`\n${phraseSupp}`);
                    await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [imageSelling] , fetchReply: true });
                    return;
                } catch (error) {
                    console.error(error);
                    return await buttonInteraction.reply({ content: `>>> ${locales[user.lang].sellerError2}`, ephemeral: true });
                }
            }
            // Boucle chaque variété de graine dispo
            let test = 0;
            for (const [key] of Object.entries(database.objets.graine)) {
                test++;
                if (buttonInteraction.customId === `vendre_${key}`) {
                    // Vérifie si l'utilisateur possède des graines
                    if (user.inventaire.graine.hasOwnProperty(key)) {
                        // Vérifie si l'utilisateur possède des graines de cette variété
                        if (user.inventaire.graine[key] > 0) {
                            // Ajoute la valeur de la graine à l'inventaire de l'utilisateur
                            const valeurGraine = database.objets.graine[key].prix * user.inventaire.graine[key];
                            user.inventaire.money += valeurGraine;
                            // Supprime la graine de l'inventaire de l'utilisateur
                            user.inventaire.graine[key] = 0;
                            rowVendre.components[test].setDisabled(true).setLabel(`${locales[user.lang].sellerSelling} 0 ${locales[user.lang].sellerSeedsOf} ${key} (0 ${devise})`);
                            await buttonInteraction.update({embeds: [embedMarchand], components: [rowVendre], fetchReply: true, ephemeral: true});
                            try {
                                await interaction.followUp({ content: `>>> **${capitalize(key)}** | ${locales[user.lang].sellerSaleCompleted2} \`${valeurGraine} ${devise}\``, ephemeral: true });
                                // Enregistre les modifications dans la base de donnée
                                await saveDb(interaction.user.id, user);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                }
            }
        });
        collector.on('end', (message) => {
            interaction.followUp({ content: `>>> ⌛ ${locales[user.lang].sellerExpired}`, ephemeral: true }); 
            sellerOpen = false;
        });
    },
};