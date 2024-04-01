const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder  } = require("discord.js");
const fs = require("fs");
// FONCTIONS
const { saveDb, loadUser, capitalize } = require('../../fonctions.js');
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
        .setName('objet')
        .setDescription('Add or remove an item for the user')
        .addUserOption((option) => option.setName('utilisateur').setDescription('User').setRequired(true))
        .addStringOption((option) => option.setName('categorie').setDescription('The category of the item (graine, plante, outils)').setRequired(true))
        .addStringOption((option) => option.setName('objet').setDescription('The item (kush, arrosoir, fertilisant, produit_antiparasite)').setRequired(true))
        .addIntegerOption((option) => option.setName('quantite').setDescription('Quantity').setRequired(true))
        .addBooleanOption((option) => option.setName('debit').setDescription('Charge the user for the value of the items ?').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: ">>> You are not authorized to execute this command."});
        }

        const _userToCheck = interaction.options.getUser('utilisateur');
        const _categorie = interaction.options.getString('categorie');
        const _objet = interaction.options.getString('objet');
        const _quantite = interaction.options.getInteger('quantite');
        let _debit = interaction.options.getBoolean('debit');
        const userId = _userToCheck ? _userToCheck.id : interaction.user.id;

        const embedMessage = new EmbedBuilder().setColor(color)

        if (isNaN(_quantite)) {
            embedMessage.setTitle(`Something is missing...`).setDescription(`Please enter a correct number.`)
            await interaction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
            return;
        }

        quantite = _quantite;

        // Charger la base de données
        const database = JSON.parse(fs.readFileSync("./database/database.json", 'utf8'));
        
        // Récupère l'utilisateur
        const userL = await loadUser(interaction.user.id);

        if (!userL.lang) {
            userL.lang = config.bot.defaultLang;
            console.log(`[objet] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
        }
        
        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: ">>> The user is not registered.", ephemeral: true}); }
        
        // Vérifier si la categorie existe dans la base de données
        if (!database.objets.hasOwnProperty(_categorie)) {
            return interaction.reply({ content: `>>> ${locales[userL.lang].objetCategory} \`${_categorie}\` ${locales[userL.lang].objetDoesntExist}`, ephemeral: true});
        }

        // Vérifier si l'objet existe dans la base de données
        if (!database.objets[_categorie].hasOwnProperty(_objet)) {
            return interaction.reply({ content: `>>> ${locales[userL.lang].objetObject} \`${_objet}\` ${locales[userL.lang].objetDoesntExist}`, ephemeral: true});
        }

        const objet = database.objets[_categorie][_objet];
        const moneyBefore = user.inventaire.money;

        if (_quantite < 0) {
            // Si la quantité est négative, on souhaite retiré l'objet d'un utilisateur donc on ne le débite pas
            _debit = false;
            // Si l'utilistateur ne possède pas l'objet (catégorie), on ne fait rien
            if (!user.inventaire.hasOwnProperty(_categorie)) {
                return interaction.reply({ content: `>>> ${locales[userL.lang].objetUserDoesNotHave} ${capitalize(_objet)}, ${locales[userL.lang].objetUserDoesNotHave2}`, ephemeral: true});
            }
            // Si l'utilistateur ne possède pas l'objet (objet), on ne fait rien
            if (!user.inventaire[_categorie].hasOwnProperty(_objet)) {
                return interaction.reply({ content: `>>> ${locales[userL.lang].objetUserDoesNotHave} ${capitalize(_objet)}, ${locales[userL.lang].objetUserDoesNotHave2}`, ephemeral: true});
            } else {
                // Si l'utilistateur possède l'objet mais la quantité = 0, on ne fait rien
                if (user.inventaire[_categorie][_objet] < Math.abs(_quantite)) {
                    return interaction.reply({ content: `>>> ${locales[userL.lang].objetUserDoesNotHaveEnough} ${capitalize(_objet)}, ${locales[userL.lang].objetUserDoesNotHave2}`, ephemeral: true});
                }
                // Supprimer l'objet de l'inventaire de l'utilisateur
                user.inventaire[_categorie][_objet] += _quantite;
                await interaction.reply({content: `>>> \`${_quantite}\` ${capitalize(_objet)} ${locales[userL.lang].objetRemovedInventory} <@${userId}>`, ephemeral: false});

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(userId, user);
                } catch (error) {
                    console.error(error);
                    return await buttonInteraction.reply({ content: `>>> ${locales[userL.lang].objetError}`, ephemeral: true });
                }
                return;
            }
        }

        // Ajouter l'objet à l'inventaire de l'utilisateur avec sa catégorie
        if (!user.inventaire.hasOwnProperty(_categorie)) {
            user.inventaire[_categorie] = {};
        }
        if (!user.inventaire[_categorie].hasOwnProperty(_objet)) {
            user.inventaire[_categorie][_objet] = _quantite;
        } else {
            user.inventaire[_categorie][_objet] += _quantite;
        }

        if (_debit) {
            // Vérifier si l'utilisateur possède suffisamment de "money" pour lui débiter le montant
            const prixTotal = objet.prix * _quantite;
            if (user.inventaire.money < prixTotal) {
                return await interaction.reply({content: `>>> ${locales[userL.lang].objetUserDoesNotHaveEnough} ${devise} ${locales[userL.lang].objetUserDoesNotHaveEnoughToBeCharged} **${prixTotal} ${devise}**.`, ephemeral: true});
                
            }
            // Déduire le prix de l'objet de la money de l'utilisateur si l'option _debit est vrai
            user.inventaire.money -= prixTotal;
            await interaction.reply({content: `>>> \`${_quantite} ${capitalize(_objet)}\` ${locales[userL.lang].objetAddedInventory} <@${userId}>\n*${locales[userL.lang].objetAddedInventoryCharged} \`${prixTotal} ${devise}\`.*`, ephemeral: false });
        } else {
            await interaction.reply({content: `>>> \`${_quantite} ${capitalize(_objet)}\` ${locales[userL.lang].objetAddedInventory} <@${userId}>\n*${locales[userL.lang].objetAddedInventoryNotCharged}*`, ephemeral: false });
        }

        try {
            // Enregistrer dans la base de donnée
            await saveDb(userId, user);
        } catch (error) {
            console.error(error);
        }
        return;
    },
};