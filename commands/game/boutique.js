const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;
// FONCTIONS
const { loadUser, saveDb, capitalize } = require('../../fonctions.js');
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}
// MENU
let shopOpen = false;
let openedByUserId;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Welcome to the Let’s Grow! shop'),
    async execute(interaction) {
        // Charger la base de données
        const date = new Date().toLocaleString();
        try {
            database = JSON.parse(fs.readFileSync("database/database.json", 'utf8'));
        } catch (error) {
            interaction.reply({ content: `**${locales[user.lang].shopErrorDatabase}`, ephemeral: true});
            console.log(`${date} [boutique] Erreur lors du chargement de la base de données.`);
            console.error(error);
            return;
        }
        
        // Charger les données de l'utilisateur
        const user = await loadUser(interaction.user.id);
        if (!user) { return await interaction.reply({ content: `>>> ${locales.en.shopNotGrower}\n \r${locales.fr.shopNotGrower}`, ephemeral: true}); }   
        
        if (!user.lang) {
            user.lang = config.bot.defaultLang;
            console.log(`[boutique] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
            // Enregistrer dans la base de donnée
            await saveDb(interaction.user.id, user);
        }


        // Vérifier si la boutique est ouverte
        const userId = interaction.user.id;

        if (openedByUserId === undefined) {
            openedByUserId = userId;
            shopOpen = false;
        }

        if (shopOpen && userId === openedByUserId) {
            return interaction.reply({ content: `>>> ${locales[user.lang].shopAlreadyOpened}`, ephemeral: true });
        }
        shopOpen = true;
        openedByUserId = userId;


        // Créer le message de la boutique
        const embedBoutique = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${locales[user.lang].shopTitle}`)
        .setDescription(`${locales[user.lang].shopDescription}`)
        .addFields(
            { name: `${locales[user.lang].shopSeedsAvaible}`, value: `\`${database.objets.graine.kush.prix}${devise}\` | Kush\n\`${database.objets.graine.amnezia.prix}${devise}\` | Amnezia\n\`${database.objets.graine.purple.prix}${devise}\` | Purple`, inline: true },
            { name: `${locales[user.lang].shopToolsAvaible}`, value: `\`${database.objets.outils.arrosoir.prix}${devise}\` | ${database.objets.outils.arrosoir.name[user.lang]}\n\`${database.objets.outils.fertilisant.prix}${devise}\` | ${database.objets.outils.fertilisant.name[user.lang]}\n\`${database.objets.outils.produit_antiparasite.prix}${devise}\` | ${database.objets.outils.produit_antiparasite.name[user.lang]}`, inline: true },
            { name: `${locales[user.lang].shopInfos}`, value: `${locales[user.lang].shopInfosValue}` },
        );
        
        // Créer le menu de selection de la categorie
        const selectCategorie = new StringSelectMenuBuilder()
            .setCustomId('categorie_select')
            .setPlaceholder(`${locales[user.lang].shopPickcategory}`)
            .addOptions({ label: `${locales[user.lang].shopSeedCat}`, value: 'graine', description: `${locales[user.lang].shopSeedsType}`, emoji: '🌱'})
            .addOptions({ label: `${locales[user.lang].shopToolCat}`, value: 'outils', description: `${locales[user.lang].shopToolsType}`, emoji: '🧰'});

        // Créer la rangée d'action du menu categorie
        const rowCategorie = new ActionRowBuilder().addComponents(selectCategorie);

        // Envoyer le message de la boutique avec le menu de selection de la categorie
        const messageShop = await interaction.reply({ content: '', embeds: [embedBoutique], components: [rowCategorie], ephemeral: true });

        // Créer le menu de selection de graine
        const selectGraines = new StringSelectMenuBuilder()
            .setCustomId('objet_select')
            .setPlaceholder(`${locales[user.lang].shopPickType}`)         

        for (const [key, value] of Object.entries(database.objets.graine)) {
            const name = capitalize(key);
            const price = value.prix;
            const description = value.description[user.lang];
            selectGraines.addOptions({ label: `${price} ${devise} | 🌱 ${name}`, description: `${description}`, value: key })
        }
        selectGraines.addOptions({ label: `${locales[user.lang].shopBack}`, value: 'retour', emoji: '🔙'});

        // Créer la rangée d'action du menu de selection de graine
        const rowObjectGraines = new ActionRowBuilder().addComponents(selectGraines);

        // Créer le menu de selection d'outils
        const selectOutils = new StringSelectMenuBuilder()
            .setCustomId('objet_select')
            .setPlaceholder(`${locales[user.lang].shopPickTypeTool}`)

        for (const [key, value] of Object.entries(database.objets.outils)) {
            const name = value.name[user.lang];
            const price = value.prix;
            const description = value.description[user.lang];

            selectOutils.addOptions({ label: `${price} ${devise} | 🧰 ${name}`, description: `${description}`, value: key })
        }
        selectOutils.addOptions({ label: `${locales[user.lang].shopBack}`, value: 'retour', emoji: '🔙'});

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
            const modal = new ModalBuilder().setCustomId('modalBoutique').setTitle(`${locales[user.lang].shopModalTitle}`);

            // Créer l'input de la quantité de l'objet
            const amountChoiceInput = new TextInputBuilder().setCustomId('combien').setLabel(`${locales[user.lang].shopModalDescription}`).setMaxLength(2).setStyle(TextInputStyle.Short);

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
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'amnezia':
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'purple':
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;

                // Gère les interactions de la selection d'un outils
                case 'arrosoir':
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'fertilisant':
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                case 'produit_antiparasite':
                    await menuInteraction.showModal(modal);
                    _objet = choice;
                break;
                
                default:
                    embedMessage.setTitle(`${locales[user.lang].shopErrorTitle}`)
                    .setDescription(`${locales[user.lang].shopErrorDescription}`)
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