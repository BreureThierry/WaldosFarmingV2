const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;
// FONCTIONS
const { loadUser } = require('../../fonctions.js');
let shopOpen = false;
let openedByUserId;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Affiche la boutique Waldos'),
    async execute(interaction) {
        // Charger la base de données
        const date = new Date().toLocaleString();
        try {
            database = JSON.parse(fs.readFileSync("database/database.json", 'utf8'));
        } catch (error) {
            interaction.reply({ content: `**Une erreur est survenue lors du chargement de la database.\n\r<@407824558918467586> | */p ${date}***`, ephemeral: true});
            console.log(`${date} [/boutique] Erreur lors du chargement de la base de données.`);
            console.error(error);
            return;
        }
        
        // Vérifier si la boutique est ouverte
        const userId = interaction.user.id;

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            shopOpen = false;
        }

        if (shopOpen && userId === openedByUserId) {
            return interaction.reply({ content: ">>> L'interface de la boutique est déjà ouverte.", ephemeral: true });
        } 
        shopOpen = true;
        openedByUserId = userId;

        // Charger les données de l'utilisateur
        const user = await loadUser(interaction.user.id);
        if (!user) { return await interaction.reply({ content: `>>> Tu n'es pas enregistré en tant que grower !\nUtilise la commande \`/demarrer\` pour t'enregistrer.`, ephemeral: true}); }

        // Créer le message de la boutique
        const embedBoutique = new EmbedBuilder()
        .setColor(color)
        .setTitle(`Boutique`)
        .setDescription(`Bienvenue dans la boutique Waldos Farming V2.\nJ\'ai tout ce dont tu as besoin pour tes plantations !`)
        .addFields(
            { name: '\`Graines disponibles :\`', value: `\`3${devise}\` | Kush\n\`4${devise}\` | Amnezia\n\`5${devise}\` | Purple`, inline: true },
            { name: '\`Outils disponibles :\`', value: `\`5${devise}\` | Arrosoir\n\`5${devise}\` | Fertilisant\n\`10${devise}\` | Produit anti-parasite`, inline: true },
            { name: 'Infos :', value: '*Sélectionne la catégorie qui t\'intéresse et attend que le menu s\'actualise, ensuite choisi l\'objet que tu veux acheter et passe à la caisse.\n \rDans 2 minutes la boutique sera réinitialisée.*' },
        );
        
        // Créer le menu de selection de la categorie
        const selectCategorie = new StringSelectMenuBuilder()
            .setCustomId('categorie_select')
            .setPlaceholder('Sélectionne la categorie')
            .addOptions({ label: 'Graines', value: 'graine', description: 'Les variétés de graines', emoji: '🌱'})
            .addOptions({ label: 'Outils', value: 'outils', description: 'Les outils et produit', emoji: '🧰'});

        // Créer la rangée d'action du menu categorie
        const rowCategorie = new ActionRowBuilder().addComponents(selectCategorie);

        // Envoyer le message de la boutique avec le menu de selection de la categorie
        const messageShop = await interaction.reply({ content: '', embeds: [embedBoutique], components: [rowCategorie], ephemeral: true });

        // Créer le menu de selection de graine
        const selectGraines = new StringSelectMenuBuilder()
            .setCustomId('objet_select')
            .setPlaceholder('Choisi une variété')         

        for (const [key, value] of Object.entries(database.objets.graine)) {
            const name = key;
            const price = value.prix;
            const description = value.description;
            selectGraines.addOptions({ label: `${price} ${devise} | 🌱 ${name}`, description: `${description}`, value: key })
        }
        selectGraines.addOptions({ label: 'Retour', value: 'retour', emoji: '🔙'});

        // Créer la rangée d'action du menu de selection de graine
        const rowObjectGraines = new ActionRowBuilder().addComponents(selectGraines);

        // Créer le menu de selection d'outils
        const selectOutils = new StringSelectMenuBuilder()
            .setCustomId('objet_select')
            .setPlaceholder('Choisi l\'outils que tu veux acheter')

        for (const [key, value] of Object.entries(database.objets.outils)) {
            const name = key;
            const price = value.prix;
            const description = value.description;

            selectOutils.addOptions({ label: `${price} ${devise} | 🧰 ${name}`, description: `${description}`, value: key })
        }
        selectOutils.addOptions({ label: 'Retour', value: 'retour', emoji: '🔙'});

        // Créer la rangée d'action du menu de selection d'outils
        const rowObjectOutils = new ActionRowBuilder().addComponents(selectOutils);

        const filter = (i) => i.user.id === interaction.user.id;

        const collector = messageShop.createMessageComponentCollector({ filter, time: 120000 }); // 2 minutes avant la suppression de la boutique

        // Gérer les interactions des menus
        collector.on('collect', async (menuInteraction) => {
            choice = menuInteraction.values[0];

            // Créer le message d'achat
            const embedMessage = new EmbedBuilder().setColor(color)

            // Créer la modal du choix de la quantité de l'objet
            const modal = new ModalBuilder().setCustomId('modalBoutique').setTitle('Boutique | Caisse');

            // Créer l'input de la quantité de l'objet
            const amountChoiceInput = new TextInputBuilder().setCustomId('combien').setLabel("Combien ?").setMaxLength(1).setStyle(TextInputStyle.Short);

            // Créer la rangée d'action de la modal
            const amountChoiceActionRow = new ActionRowBuilder().addComponents(amountChoiceInput);
            modal.addComponents(amountChoiceActionRow);
            
            switch (choice) {
                // Gère les interactions de la selection d'une categorie
                case 'graine':
                    await menuInteraction.update({ embeds: [embedBoutique], components: [rowObjectGraines], fetchReply: true });
                    _categorie = choice;
                break;
                case 'outils':
                    await menuInteraction.update({ embeds: [embedBoutique], components: [rowObjectOutils], fetchReply: true });
                    _categorie = choice;
                break;
                case 'retour':
                    await menuInteraction.update({ embeds: [embedBoutique], components: [rowCategorie], fetchReply: true });
                break;

                // Gère les interactions de la selection d'une graine
                case 'kush':
                    amountChoiceInput.setPlaceholder(`Combien de graines de ${choice} tu veux acheter ?`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'amnezia':
                    amountChoiceInput.setPlaceholder(`Combien de graines d'${choice} tu veux acheter ?`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'purple':
                    amountChoiceInput.setPlaceholder(`Combien de graines de ${choice} tu veux acheter ?`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;

                // Gère les interactions de la selection d'un outils
                case 'arrosoir':
                    amountChoiceInput.setPlaceholder(`Combien d'${choice}(s) tu veux acheter ?\n Un seul suffit.`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'fertilisant':
                    amountChoiceInput.setPlaceholder(`Combien de ${choice} tu veux acheter ?`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'produit_antiparasite':
                    amountChoiceInput.setPlaceholder(`Combien de Produits anti-parasites tu veux acheter ?`)
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                
                default:
                    embedMessage.setTitle(`Quelque chose m'échappe...`)
                    .setDescription(`Je n'ai pas cet article en stock.`)
                    await menuInteraction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
                break;
            }
        });
        // Gérer les interactions expirées
        collector.on('end', (message) => {
            shopOpen = false;
            messageShop.delete(message);
        });
    },
};