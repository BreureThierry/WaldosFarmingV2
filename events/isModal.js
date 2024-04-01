const { Events, EmbedBuilder } = require('discord.js');
const fs = require("fs");
// FONCTIONS
const { saveDb,loadUser } = require('../fonctions.js');
// CONFIG
const config = require('../config.json');
const boutique  = require('../commands/game/boutique.js');
const color = config.bot.botColor;
const devise = config.bot.devise;
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../locale/${file}`);
}

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isModalSubmit()) return;
        const nbArticles = interaction.fields.getTextInputValue('combien');
        const modal = interaction.fields.getField('combien');
        const embedMessage = new EmbedBuilder().setColor(color)
        const amount = parseInt(nbArticles);

        if (modal.customId === 'combien') {
            if (isNaN(amount)) {
                return await interaction.reply({ content: `>>> ${locales[user.lang].shopBadValue}\n`, ephemeral: true});
            }
            if (amount <= 0) {
                return await interaction.reply({ content: `>>> ${locales[user.lang].shopNegativeValue}\n`, ephemeral: true});
            }

            // Charger les données
            const database = JSON.parse(fs.readFileSync("./database/database.json", 'utf8'));
            
            _quantite = amount;

            // Charger les données de l'utilisateur
            const user = await loadUser(interaction.user.id);
            if (!user) { return interaction.reply({ content: `>>> ${locales[user.lang].shopNotGrower}`, ephemeral: true}); }
            const date = new Date().toLocaleString();
            if (!user.id) { return interaction.reply({ content: `>>> ${locales[user.lang].shopErrorLoading}`, ephemeral: true}); }

            // Vérifier si la categorie existe dans la base de données
            if (!database.objets.hasOwnProperty(_categorie)) { return; }

            // Vérifier si l'objet existe dans la base de données
            if (!database.objets[_categorie].hasOwnProperty(_objet)) { return; }

            const objet = database.objets[_categorie][_objet];

            // Vérifier si l'utilisateur possède suffisamment de "money" pour lui débiter le montant
            const prixTotal = objet.prix * _quantite;
            if (user.inventaire.money < prixTotal) {
                embedMessage.setTitle(`🔴 ${locales[user.lang].shopPaymentRefused}`).setDescription(`${locales[user.lang].shopPaymentRefusedDesc} \`${prixTotal} ${devise}\``);
                return interaction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
            }
            // Débiter l'utilisateur
            user.inventaire.money -= prixTotal;

            // Ajouter l'objet à l'inventaire de l'utilisateur
            if (!user.inventaire.hasOwnProperty(_categorie)) {
                user.inventaire[_categorie] = {};
            }
            if (!user.inventaire[_categorie].hasOwnProperty(_objet)) {
                user.inventaire[_categorie][_objet] = _quantite;
            } else {
                user.inventaire[_categorie][_objet] += _quantite;
            }

            try {
                embedMessage.setTitle(`🟢 ${locales[user.lang].shopPaymentAccepted}`).setDescription(`\`${locales[user.lang].shopPaymentAcceptedDesc} ${prixTotal} ${devise}\`\n \r*${locales[user.lang].shopPaymentThanx}\n${locales[user.lang].shopPaymentSeeYouSoon}*`)
                interaction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
                // Enregistrer dans la base de donnée
                await saveDb(interaction.user.id, user);
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: `>>> ${locales[user.lang].shopPaymentError}`, ephemeral: true});
            }
        }
	},
};