const { Events, EmbedBuilder } = require('discord.js');
const fs = require("fs");
const Grower = require("../growerClass.js");
// FONCTIONS
const { saveDb,loadUser } = require('../fonctions.js');
// CONFIG
const config = require('../config.json');
const boutique  = require('../commands/game/boutique.js');
const color = config.bot.botColor;
const devise = config.bot.devise;

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
                return await interaction.reply({ content: `>>> La valeur saisie n'est pas correcte.\n`, ephemeral: true});
            }
            if (amount <= 0) {
                return await interaction.reply({ content: `>>> La valeur saisie ne peut pas être un nombre négatif.\n`, ephemeral: true});
            }

            // Charger les données
            const database = JSON.parse(fs.readFileSync("./database/database.json", 'utf8'));
            
            _quantite = amount;

            // Charger les données de l'utilisateur
            const user = await loadUser(interaction.user.id);
            if (!user) { return interaction.reply({ content: `>>> Tu n'es pas enregistré dans la base de données.\nCréé ta plantation avec la commande \`/demarrer\` et rejoins les growers.`, ephemeral: true}); }
            const date = new Date().toLocaleString();
            if (!user.id) { return interaction.reply({ content: `>>> 🤯 Quelque chose a mal tourné ! Il semblerait que ta sauvegarde soit défectueuse...\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true}); }

            // Vérifier si la categorie existe dans la base de données
            if (!database.objets.hasOwnProperty(_categorie)) { return; }

            // Vérifier si l'objet existe dans la base de données
            if (!database.objets[_categorie].hasOwnProperty(_objet)) { return; }

            const objet = database.objets[_categorie][_objet];
            const moneyBefore = user.inventaire.money;

            // Vérifier si l'utilisateur possède suffisamment de "money" pour lui débiter le montant
            const prixTotal = objet.prix * _quantite;
            if (user.inventaire.money < prixTotal) {
                embedMessage.setTitle(`🔴 Paiement refusé`).setDescription(`Tu n'as pas suffisamment d'argent pour payer.\n \r\`Montant total : ${prixTotal} ${devise}\``);
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
                embedMessage.setTitle(`🟢 Paiement accepté`).setDescription(`\`Montant payé : ${prixTotal} ${devise}\`\n \r• ${nbArticles} ${choice}(s)\n \r*Merci de ta visite ${interaction.user.globalName},\nà bientôt.*`)
                interaction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
                // Enregistrer dans la base de donnée
                await saveDb(interaction.user.id, user);
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: `>>> Une erreur est survenu.`, ephemeral: true});
            }
        }
	},
};