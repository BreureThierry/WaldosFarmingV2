const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
// CONFIG
const config = require('../../config.json');
// FONCTIONS
const { loadUser,capitalize } = require("../../fonctions.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventaire')
        .setDescription('Affiche l\'inventaire d\'un utilisateur')
        .addUserOption(option => option.setName('utilisateur').setDescription('L\'utilisateur dont vous voulez afficher l\'inventaire.')),
    async execute(interaction) {
        const userToCheck = interaction.options.getUser('utilisateur');
        const userId = userToCheck ? userToCheck.id : interaction.user.id;
        const date = new Date().toLocaleString();

        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: ">>> L'utilisateur n'est pas enregistré.", ephemeral: true}); }
        if (!user.id) { return interaction.reply({ content: `>>> 🤯 Quelque chose a mal tourné ! Il semblerait que la sauvegarde soit défectueuse...\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\` `, ephemeral: true}); }
        const fakeInventaire = {}

        // Ajoute le montant d'argent à l'inventaire
        fakeInventaire.money = user.inventaire.money;

        // Ajoute les graines à l'inventaire
        if (user.inventaire.graine) {
            fakeInventaire.graine = [];
            for (const [graine, quantite] of Object.entries(user.inventaire.graine)) {
            const graineInfo = {
                nom: graine,
                quantite,
            };
            fakeInventaire.graine.push(graineInfo);
            }
        }
        // Ajoute les plantes à l'inventaire
        if (user.inventaire.plante) {
            fakeInventaire.plante = [];
            for (const [plante, quantite] of Object.entries(user.inventaire.plante)) {
            const planteInfo = {
                nom: plante,
                quantite,
            };
            fakeInventaire.plante.push(planteInfo);
            }
        }
        // Ajoute les outils à l'inventaire
        if (user.inventaire.outils) {
            fakeInventaire.outils = [];
            for (const [outils, quantite] of Object.entries(user.inventaire.outils)) {
            const outilsInfo = {
                nom: outils,
                quantite,
            };
            fakeInventaire.outils.push(outilsInfo);
            }
        }

        // Construire le message d'embed pour afficher l'inventaire
        const embedInventory = new EmbedBuilder()
        .setColor(config.bot.botColor)
        .setAuthor({ name: `Inventaire | ` + user.nomServeur })
        .addFields({ name: `🪙 Argent :`, value: `\`${fakeInventaire.money} ${config.bot.devise}\`` })

        // vérifie si l'utilisateur possède des graines
        if (fakeInventaire.graine === undefined || fakeInventaire.graine.length === 0) {
            fakeInventaire.graine = "*`Vide`*";
            embedInventory.addFields({ name: `🌱 Graines :`, value: `${fakeInventaire.graine}`});
        } else {
            embedInventory.addFields({ name: `🌱 Graines :`, value: `${fakeInventaire.graine.map(graineInfo => `\`${capitalize(graineInfo.nom)} : ${graineInfo.quantite}\``).join('\n')}`});
        }
        // vérifie si l'utilisateur possède des plantes
        if (fakeInventaire.plante === undefined || fakeInventaire.plante.length === 0) {
            fakeInventaire.plante = "*`Vide`*";
            embedInventory.addFields({ name: `🌿 Plantes :`, value: `${fakeInventaire.plante}`});
        } else {
            embedInventory.addFields({ name: `🌿 Plantes :`, value: `${fakeInventaire.plante.map(planteInfo => `\`${capitalize(planteInfo.nom)} : ${planteInfo.quantite}\``).join('\n')}`});
        }
        // vérifie si l'utilisateur possède des outils
        if (fakeInventaire.outils === undefined || fakeInventaire.outils.length === 0) {
            fakeInventaire.outils = "*`Vide`*";
            embedInventory.addFields({ name: `🛠️ Outils :`, value: `${fakeInventaire.outils}`});
        } else {
            embedInventory.addFields({ name: `🛠️ Outils :`, value: `${fakeInventaire.outils.map(outilsInfo => `\`${capitalize(outilsInfo.nom)} : ${outilsInfo.quantite}\``).join('\n')}`});
        }
        // Envoi le message d'inventaire
        await interaction.reply({ embeds: [embedInventory], ephemeral: true });
    },
};