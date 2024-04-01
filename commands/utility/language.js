const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
// FONCTIONS
const { loadUser, saveDb } = require("../../fonctions.js");
// CLASS
const Grower = require("../../growerClass.js");
// CONFIG
const config = require('../../config.json');
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Select your language. Sélectionnez votre langue.'),
    async execute(interaction) {
        // Charger les données de l'utilisateur
        const user = await loadUser(interaction.user.id);
        // Si l'utilisateur n'existe pas
        if (!user) {
            console.log('[language] Utilisateur non trouvé.');
            return await interaction.reply({ content: `>>> ${locales.en.langUserNotFound}\r \n${locales.fr.langUserNotFound}`, ephemeral: true });
        }
        // Si l'utilisateur n'a pas de langue définie
        if (!user.lang) {
            if (!user.id) {
                return await interaction.reply({ content: `>>> ${locales.en.langError}\r \n${locales.fr.langError}`, ephemeral: true });
            }
            user.lang ='en';
            console.log('[language] Utilisateur sans langue définie. Langue par défaut : EN');
            // Enregistrer dans la base de donnée
            await saveDb(interaction.user.id, user);
        }

        // Création du menu
        const langMenu = new StringSelectMenuBuilder()
        .setCustomId('langage-select')
        .addOptions();

        // Ajout des options de langue
        for (const locale in locales) {
            langMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${locales[locale].langLabelMenu}`).setDescription(`${locales[locale].langMenuDesc}`).setEmoji(`${locales[locale].langEmoji}`).setValue(`${locale}`));
        }

        // Création de la ligne d'action du menu
        const rowMenu = new ActionRowBuilder()
        .addComponents(langMenu);

        // Création du filtre utilisateur
        const filter = (i) => i.user.id === interaction.user.id;

        // Langue d'affichage par défaut : en
        langMenu.setPlaceholder(`${locales[user.lang].langMenuPlaceholder}`);

        // Création de l'embed
        const embedNewPlayerLang = new EmbedBuilder()
        .setColor(config.bot.botColor)
        .setTitle(`${locales[user.lang].langTitle}`)
        .setDescription(`${locales[user.lang].langMessage}`);

        // Afficher le message de configuration de la langue
        const message = await interaction.reply({ embeds: [embedNewPlayerLang], components: [rowMenu], ephemeral: true });

        // Création du collecteur
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        // Collecteur
        collector.on('collect', async (menuInteraction) => {
            choice = menuInteraction.values[0];

            for (const locale in locales) {
                if (locale === choice) {
                    try {
                        // Sauvegarde du choix de l'utilisateur
                        user.lang = choice;
                        await saveDb(interaction.user.id, user);

                        // Affichage du menu avec la langue de l'utilisateur
                        langMenu.setPlaceholder(`${locales[user.lang].langMenuPlaceholder}`);
                        // // Mise à jour de l'embed
                        embedNewPlayerLang.setTitle(`${locales[user.lang].langTitle}`)
                        .setDescription(`${locales[user.lang].langMessage}`);

                        await menuInteraction.update({ embeds: [embedNewPlayerLang], components: [rowMenu], ephemeral: true });
                    } catch (error) {
                        await interaction.followUp({ content: `**${locales[user.lang].langError}**`, ephemeral: true });
                        console.error(error);
                    }
                    break;
                }
            }
        });   
    },
};