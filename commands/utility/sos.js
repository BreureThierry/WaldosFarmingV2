const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sos')
        .setDescription('Affiche les commandes disponibles et leur fonction'),
    async execute(interaction) {

        const sosEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle('Besoin d\'aide ?')
            // .setURL('https://discord.com/invite/waldoslegend')
            .setAuthor({ name: 'Waldos Farming V2'})
            .setDescription('*Voici la liste des commande disponible.*')
            .addFields(
                { name: '`/sos`', value: `C'est la commande que tu consultes actuellement,\nelle liste toutes les commandes disponibles.` },
                { name: '`/demarrer`', value: `Créer ta plantation Waldos et commence l'aventure.` },
                { name: '`/plantation`', value: `Cette commande regroupe plusieurs actions.\nDans un premier temps elle affiche tes plantations puis te permet d'interagir sur tes différentes parcelles (*Slot 1, Slot 2, Slot 3, Slot 4*) grace aux boutons (*Planter, Arroser, Récolter, Fertiliser, etc...*).` },
                { name: '`/inventaire`', value: `Consulte ton inventaire ou celui d'un autre grower.` },
                { name: '`/vendre`', value: `Vend tes récoltes au marchand.` },
                { name: '`/classement`', value: `Affiche le classement des 10 growers les plus riches.` },
                { name: '`/boutique`', value: `Accéde à la boutique Waldos, tu pourras y acheter divers objets pour tes plantations (*Arrosoir, Graine, Fertilisant et Produit anti-parasite*).` },
            )
            .addFields(
                { name: '`/money`', value: `Cette commande est réservée aux **administrateurs**,\nelle permet de créditer/débiter un utilisateur en ${devise}.` },
                { name: '`/objet`', value: `Cette commande est réservée aux **administrateurs**,\nelle permet d'ajouter/supprimer un objet à l'utilisateur.` },
            )
        await interaction.reply({ content: `${interaction.user}`, embeds: [sosEmbed] });
    },
};