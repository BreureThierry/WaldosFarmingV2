const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
// CONFIG
const config = require('../../config.json');
// FONCTIONS
const { loadUser,capitalize } = require("../../fonctions.js");
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription("Displays a user's inventory")
        .addUserOption(option => option.setName('utilisateur').setDescription('The user whose inventory you wish to display.')),
    async execute(interaction) {
        const userToCheck = interaction.options.getUser('utilisateur');
        const userId = userToCheck ? userToCheck.id : interaction.user.id;
        const date = new Date().toLocaleString();

        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: `>>> ${locales.en.inventoryUserNotFound}\n \r${locales.fr.inventoryUserNotFound}`, ephemeral: true}); }
        if (!user.id) { return interaction.reply({ content: `>>> ${locales.en.inventoryErrorLoading}\n \r${locales.fr.inventoryErrorLoading}`, ephemeral: true}); }
        
        if (!user.lang) {
            user.lang = config.bot.defaultLang;
            console.log(`[inventaire] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
        }
        
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
            // Charger la base de données
            const database = JSON.parse(fs.readFileSync("./database/database.json", 'utf8'));
            // console.log(database.outils.arrosoir.name[user.lang]);
            for (let [outils, quantite] of Object.entries(user.inventaire.outils)) {
                // console.log(outils);
                if (outils === 'arrosoir') {
                    outils = database.objets.outils.arrosoir.name[user.lang];
                }
                if (outils === 'fertilisant') {
                    outils = database.objets.outils.fertilisant.name[user.lang];
                }
                if (outils === 'produit_antiparasite') {
                    outils = database.objets.outils.produit_antiparasite.name[user.lang];
                }
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
        .setAuthor({ name: `${locales[user.lang].inventoryTitle} ` + user.nomServeur })
        .addFields({ name: `${locales[user.lang].inventoryMoney} `, value: `\`${fakeInventaire.money} ${config.bot.devise}\`` })

        // vérifie si l'utilisateur possède des graines
        if (fakeInventaire.graine === undefined || fakeInventaire.graine.length === 0) {
            fakeInventaire.graine = `${locales[user.lang].inventoryEmptyItem}`;
            embedInventory.addFields({ name: `${locales[user.lang].inventorySeeds}`, value: `${fakeInventaire.graine}`});
        } else {
            embedInventory.addFields({ name: `${locales[user.lang].inventorySeeds}`, value: `${fakeInventaire.graine.map(graineInfo => `\`${capitalize(graineInfo.nom)} : ${graineInfo.quantite}\``).join('\n')}`});
        }
        // vérifie si l'utilisateur possède des plantes
        if (fakeInventaire.plante === undefined || fakeInventaire.plante.length === 0) {
            fakeInventaire.plante = `${locales[user.lang].inventoryEmptyItem}`;
            embedInventory.addFields({ name: `${locales[user.lang].inventoryPlants}`, value: `${fakeInventaire.plante}`});
        } else {
            embedInventory.addFields({ name: `${locales[user.lang].inventoryPlants}`, value: `${fakeInventaire.plante.map(planteInfo => `\`${capitalize(planteInfo.nom)} : ${planteInfo.quantite}\``).join('\n')}`});
        }
        // vérifie si l'utilisateur possède des outils
        if (fakeInventaire.outils === undefined || fakeInventaire.outils.length === 0) {
            fakeInventaire.outils = `${locales[user.lang].inventoryEmptyItem}`;
            embedInventory.addFields({ name: `${locales[user.lang].inventoryTools}`, value: `${fakeInventaire.outils}`});
        } else {
            embedInventory.addFields({ name: `${locales[user.lang].inventoryTools}`, value: `${fakeInventaire.outils.map(outilsInfo => `\`${capitalize(outilsInfo.nom)} : ${outilsInfo.quantite}\``).join('\n')}`});
        }
        // Envoi le message d'inventaire
        await interaction.reply({ embeds: [embedInventory], ephemeral: true });
    },
};