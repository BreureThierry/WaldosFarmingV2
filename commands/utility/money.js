const { PermissionFlagsBits , EmbedBuilder, SlashCommandBuilder } = require("discord.js");

// FONCTIONS
const { saveDb, loadUser } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money')
        .setDescription(`Ajoutez des ${devise} à un utilisateur.`)
        .addUserOption(option => option.setName('utilisateur').setDescription('Utilisateur.').setRequired(true))
        .addIntegerOption(option => option.setName('montant').setDescription('Montant.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: ">>> Tu n'es pas autorisé à exécuter cette commande."});
        }
        
        // Récuperation des options de commande
        const _userToCheck = interaction.options.getUser('utilisateur');
        const userId = _userToCheck ? _userToCheck.id : interaction.user.id;
        const montant = interaction.options.getInteger('montant') || 0;

        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: ">>> L'utilisateur n'est pas enregistré.", ephemeral: true}); }
        
        const userMoney = user.inventaire.money;
        const embedMoney = new EmbedBuilder()
            .setColor(color)
            .setTitle('Money')

        // Si le montant est négatif
        if (montant < 0 && userMoney >= Math.abs(montant)) {
            // L'utilisateur est débité du montant
            user.inventaire.money -= Math.abs(montant);
            embedMoney.setDescription(`\`${Math.abs(montant)}\` ${devise} retiré à ***${user.nomServeur}***`);
        } else if (montant > 0) {
            // Le montant est positif | L'utilisateur est crédité du montant
            user.inventaire.money += montant;
            embedMoney.setDescription(`\`${montant}\` ${devise} ajouté à ***${user.nomServeur}***`);
        } else {
            // Si l'utilisateur n'a pas suffisamment de money
            embedMoney.setDescription(`L'utilisateur ne peut pas être en négatif.`);
        }
        interaction.reply({ embeds: [embedMoney], ephemeral: true });
        
        try {
            // Enregistrer dans la base de donnée
            await saveDb(userId, user);
        } catch (error) {
            console.error(error);
            return;
        }
    },
};