const { PermissionFlagsBits , EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
// FONCTIONS
const { saveDb, loadUser } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('money')
        .setDescription(`Add or remove ${devise} to a user.`)
        .addUserOption(option => option.setName('utilisateur').setDescription('User').setRequired(true))
        .addIntegerOption(option => option.setName('montant').setDescription('Amount').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: ">>> You are not authorized to execute this command."});
        }
        
        // Récupère l'utilisateur
        const userL = await loadUser(interaction.user.id);

        if (!userL.lang) {
            userL.lang = config.bot.defaultLang;
            console.log(`[money] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
        }

        // Récuperation des options de commande
        const _userToCheck = interaction.options.getUser('utilisateur');
        const userId = _userToCheck ? _userToCheck.id : interaction.user.id;
        const montant = interaction.options.getInteger('montant') || 0;

        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: ">>> The user is not registered.", ephemeral: true}); }
        
        const userMoney = user.inventaire.money;
        const embedMoney = new EmbedBuilder()
            .setColor(color)
            .setTitle('Money')

        // Si le montant est négatif
        if (montant < 0 && userMoney >= Math.abs(montant)) {
            // L'utilisateur est débité du montant
            user.inventaire.money -= Math.abs(montant);
            embedMoney.setDescription(`\`${Math.abs(montant)} ${devise}\` ${locales[userL.lang].moneyRemoved} <@${userId}>`);
        } else if (montant > 0) {
            // Le montant est positif | L'utilisateur est crédité du montant
            user.inventaire.money += montant;
            embedMoney.setDescription(`\`${montant} ${devise}\` ${locales[userL.lang].moneyAdded} <@${userId}>`);
        } else {
            // Si l'utilisateur n'a pas suffisamment de money
            embedMoney.setDescription(`${locales[userL.lang].moneyNotNegativ}`);
        }
        interaction.reply({ embeds: [embedMoney], ephemeral: false });
        
        try {
            // Enregistrer dans la base de donnée
            await saveDb(userId, user);
        } catch (error) {
            console.error(error);
            return;
        }
    },
};