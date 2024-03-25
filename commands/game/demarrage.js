const {  EmbedBuilder, AttachmentBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const Grower = require("../../growerClass.js");
const config = require('../../config.json');
const color = config.bot.botColor;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demarrer')
        .setDescription('Installe ta plantation et commence l\'aventure.'),
    async execute(interaction) {
        const filePath = `./database/${interaction.user.id}.json`;
        // Si l'utilisateur existe déjà
        if (fs.existsSync(filePath)) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('T\'es déjà un Grower !')
                .addFields({ name: 'Besoin d\'aide ?', value: 'La commande `/sos` te donnera la liste des commandes disponible.' },)
                .setDescription('Ta plantation t\'attend quelque part.\nUtilise la commande `/plantations` pour y accéder.')
            await interaction.reply({ content: '', embeds: [embed], ephemeral: true });
            return;
        }
        // Si l'utilisateur n'existe pas
        const newGrower = new Grower(interaction.user.id, interaction.user.globalName, interaction.user.username, config.bot.startMoney);
        try {
            await newGrower.save();
            const file = new AttachmentBuilder('./assets/img/graine.png');
            const embedNewGrower = new EmbedBuilder()
                .setColor(color)
                .setTitle('Bienvenue Apprenti Grower !')
                .setDescription('Tu viens de créer ta plantation.\nÀ toi de jouer maintenant !\n \rRend toi dans la `/boutique` pour acheter un arrosoir et des graines.')
                .addFields({ name: '\u200B', value: 'Accède à tes plantations avec la commande `/plantations`' })
                .setImage('attachment://graine.png');
            await interaction.reply({ content: interaction.user.toString(), embeds: [embedNewGrower], files: [file]});
        } catch (error) {
            console.error(error);
        }        
    },
};