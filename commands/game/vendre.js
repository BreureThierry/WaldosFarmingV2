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
let sellerOpen = false;
let openedByUserId;

client.login(process.env.token);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vendre')
        .setDescription('Vendre tes récoltes à un marchand.'),
    async execute(interaction) {
        const date = new Date().toLocaleString();
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

        // Vérifier si le menu marchand est ouvert
        const userId = interaction.user.id;

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            sellerOpen = false;
        }

        if (sellerOpen && userId === openedByUserId) {
            return interaction.reply({ content: ">>> L'interface du marchand est déjà ouverte.", ephemeral: true });
        } 
        sellerOpen = true;
        openedByUserId = userId;

        // Créer le bouton "Vendre" et la ligne d'action
        const vendrePlanteButton = new ButtonBuilder()
            .setCustomId('vendre_plante')
            .setLabel('Vendre les plantes')
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
                .setLabel(`Vendre ${user.inventaire.graine[key]} graines de ${name} (${valeurGraines} ${devise})`)
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
        .setTitle(`Marchand`)
        .setImage('https://media.discordapp.net/attachments/1214678292909785088/1221094357373816912/marchand.png?ex=661153bd&is=65fedebd&hm=ec0a4e4672480f4e9da53a71fe7cd2e62e3dd3057f7a16825d4811aa8f7594ad&=&format=webp&quality=lossless&width=810&height=491')
        .setColor(color)
        .setDescription(`Bonjour grower.\nJe recherche des variétés de plantes spécifique, tu en a ?\nLaisse moi jetter un oeil à ton inventaire... `)

        // Récupère les infos de chaque plantes dans la base de donnée pour afficher les prix du marchand
        for (const [key, value] of Object.entries(dbPlants)) {
            const name = capitalize(key);
            const price = value.valeur;
            embedMarchand.addFields({ name: `${name} :`, value: `*J'achète cette variété pour \`${price} ${devise}\` la plante.*`})
        }
        embedMarchand.addFields({ name: `Graines`, value: `*Je rachète les graines à leurs prix d'achat en boutique.*`})

        embedMarchand.addFields({ name: `Valeur total :`, value: `🌿 Plantes : *${totalValueInventory} ${devise}*`})
        
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
                        phraseSupp = 'C\'est toujours ça de pris !';
                        user.xp += totalValueInventory;
                        break;
                    case (totalValueInventory > 100 && totalValueInventory < 500):
                        phraseSupp = 'Une bonne affaire !';
                        user.xp += 1000;
                        break;
                    case (totalValueInventory > 500 && totalValueInventory < 1000):
                        phraseSupp = 'Une belle vente !';
                        user.xp += 5000;
                        break;
                    case (totalValueInventory > 1000):
                        phraseSupp = 'Un très bon deal !';
                        user.xp += 10000;
                        break;
                    default:    
                        phraseSupp = 'Pas terrible...';
                    break;
                }

                // Crédite l'utilisateur de la valeur totale
                user.inventaire.money += totalValueInventory;

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(interaction.user.id, user);
                    // Réponse privée
                    embedMessage.setTitle('Vente effectuée').setDescription(`>>> C'était un plaisir de faire affaire avec toi ${interaction.user.globalName}.\nVoilà tes \`${totalValueInventory} ${devise}\`.\n \rJ'espère te revoir bientôt, je suis toujours à la recherche de plante alors n'hésite pas à revenir me voir.`);
                    embedMarchand.data.fields[4].value = `🌿 Plantes : 0 ${devise}`;
                    await buttonInteraction.editReply({ embeds: [embedMarchand], ephemeral: true });
                    await interaction.followUp({ embeds: [embedMessage], ephemeral: true });

                    // Réponse publique
                    const imageSelling = new AttachmentBuilder(imgSelling);
                    const publicReponse = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`Marchand`)
                    .setImage(`attachment://${fileUrl(imgSelling)}`)
                    .setDescription(`**${user.nomServeur}** a vendu ses récoltes au marchand pour \`${totalValueInventory} ${devise}\`\n${phraseSupp}`);
                    await client.channels.cache.get(config.bot.farmingChannel).send({ content: interaction.user.toString(), embeds: [publicReponse], files: [imageSelling] , fetchReply: true });
                    return;
                } catch (error) {
                    console.error(error);
                    return await buttonInteraction.reply({ content: `>>> Un problème est survenu.`, ephemeral: true });
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
                            rowVendre.components[test].setDisabled(true).setLabel(`Vendre 0 graines de ${key} (0 ${devise})`);
                            await buttonInteraction.update({embeds: [embedMarchand], components: [rowVendre], fetchReply: true, ephemeral: true});
                            try {
                                await interaction.followUp({ content: `>>> Tu a vendu toutes tes graines de ${capitalize(key)} pour \`${valeurGraine} ${devise}\``, ephemeral: true });
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
            console.log('Fin de collecteur : vendre');
            interaction.followUp({ content: ">>> ⌛ **L'interface du marchand a expiré...**\n tape la commande \`/vendre\` pour y retourner. ", ephemeral: true }); 
            sellerOpen = false;
        });
    },
};