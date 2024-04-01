const {  EmbedBuilder, ActionRowBuilder, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
// CONFIG
const Grower = require("../../growerClass.js");
const config = require('../../config.json');
const color = config.bot.botColor;
// FONCTIONS
const { loadUser, saveDb } = require("../../fonctions.js");
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Set up your plantation and start the adventure. 🌱'),
    async execute(interaction) {
        const filePath = `./database/${interaction.user.id}.json`;
        // Si l'utilisateur existe déjà
        if (fs.existsSync(filePath)) {
            // Charger les données de l'utilisateur
            const user = await loadUser(interaction.user.id);

            if (!user.lang) {
                user.lang = 'en';
                console.log('[demarrer] Utilisateur sans langue définie. Langue par défaut : EN');
                // Enregistrer dans la base de donnée
                await saveDb(interaction.user.id, user);
            }

            try {
                const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${locales[user.lang].welcomeExistTitle}`)
                .addFields({ name: `${locales[user.lang].welcomeExisteTitleFields}`, value: `${locales[user.lang].welcomeExisteFields}` },)
                .setDescription(`${locales[user.lang].welcomeExistDescription}`)
                await interaction.reply({ content: '', embeds: [embed], ephemeral: true });
                return;
            } catch (error) {
                console.error(error);
                console.log('[demarrer] Erreur lors de la création de l\'embed (Locale file ?)');
            }
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
        langMenu.setPlaceholder(`${locales.en.langMenuPlaceholder}`);

        // Création de l'embed
        const embedNewPlayerLang = new EmbedBuilder()
        .setColor(config.bot.botColor)
        .setTitle(`${locales.en.langTitle}`)
        .setDescription(`${locales.en.langMessage}`);

        // Afficher le message de configuration de la langue
        const message = await interaction.reply({ embeds: [embedNewPlayerLang], components: [rowMenu], ephemeral: true });

        // Création du collecteur
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        // Collecteur
        collector.on('collect', async (menuInteraction) => {
            choice = menuInteraction.values[0];
            // Création d'un nouvel utilisateur
            // Si l'utilisateur n'existe pas
            const newGrower = new Grower(interaction.user.id, interaction.user.globalName, interaction.user.username, config.bot.startMoney, config.bot.lang);

            for (const locale in locales) {
                if (locale === choice) {
                    try {
                        // Sauvegarde du choix de l'utilisateur
                        newGrower.setLang(choice);
                        newGrower.save();
                        // Affichage du menu avec la langue de l'utilisateur
                        langMenu.setPlaceholder(`${locales[newGrower.lang].langMenuPlaceholder}`);
                        // // Mise à jour de l'embed
                        embedNewPlayerLang.setTitle(`${locales[newGrower.lang].langTitle}`)
                        .setDescription(`${locales[newGrower.lang].langMessage}`);
                        
                        const file = new AttachmentBuilder('./assets/img/graine.png');
                        const embedNewGrower = new EmbedBuilder()
                            .setColor(color)
                            .setTitle(`${locales[newGrower.lang].welcomeTitle}`)
                            .setDescription(`${locales[newGrower.lang].welcomeDescription}`)
                            .addFields({ name: '\u200B', value: `${locales[newGrower.lang].welcomeFields}` })
                            .setImage('attachment://graine.png');

                        await menuInteraction.update({ embeds: [embedNewGrower], components: [rowMenu], files: [file], ephemeral: true });
                    } catch (error) {
                        await interaction.followUp({ content: `**${locales[newGrower.lang].langError}**`, ephemeral: true });
                        console.error(error);
                    }
                    break;
                }
            }
        });      
    },
};