const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder  } = require("discord.js");
const fs = require("fs");
// FONCTIONS
const { saveDb, loadUser, capitalize } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('objet')
        .setDescription('Ajoute ou supprime un objet à l\'utilisateur')
        .addUserOption((option) => option.setName('utilisateur').setDescription('L\'utilisateur.').setRequired(true))
        .addStringOption((option) => option.setName('categorie').setDescription('La catégorie de l\'objet (graine, plante, outils).').setRequired(true))
        .addStringOption((option) => option.setName('objet').setDescription('L\'objet (kush, arrosoir, fertilisant, produit_antiparasite).').setRequired(true))
        .addIntegerOption((option) => option.setName('quantite').setDescription('Quantité.').setRequired(true))
        .addBooleanOption((option) => option.setName('debit').setDescription('Débité l\'utilisateur de la valeur des objets ?').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: ">>> Tu n'es pas autorisé à exécuter cette commande."});
        }

        const _userToCheck = interaction.options.getUser('utilisateur');
        const _categorie = interaction.options.getString('categorie');
        const _objet = interaction.options.getString('objet');
        const _quantite = interaction.options.getInteger('quantite');
        let _debit = interaction.options.getBoolean('debit');
        const userId = _userToCheck ? _userToCheck.id : interaction.user.id;

        const embedMessage = new EmbedBuilder().setColor(color)

        if (isNaN(_quantite)) {
            embedMessage.setTitle(`Quelque chose m'échappe...`).setDescription(`Veuillez entrer un nombre correct.`)
            await interaction.reply({ embeds: [embedMessage], fetchReply: true, ephemeral: true  });
            return;
        }

        quantite = _quantite;

        // Charger la base de données
        const database = JSON.parse(fs.readFileSync("./database/database.json", 'utf8'));
        
        // Récupère l'utilisateur
        const user = await loadUser(userId);
        if (!user) { return interaction.reply({ content: ">>> L'utilisateur n'est pas enregistré.", ephemeral: true}); }
        
        
        // Vérifier si la categorie existe dans la base de données
        if (!database.objets.hasOwnProperty(_categorie)) {
            return interaction.reply({ content: `>>> La categorie \`${_categorie}\` n'existe pas !`, ephemeral: true});
        }

        // Vérifier si l'objet existe dans la base de données
        if (!database.objets[_categorie].hasOwnProperty(_objet)) {
            return interaction.reply({ content: `>>> L'objet \`${_objet}\` n'existe pas !`, ephemeral: true});
        }

        const objet = database.objets[_categorie][_objet];
        const moneyBefore = user.inventaire.money;

        if (_quantite < 0) {
            // Si la quantité est négative, on souhaite retiré l'objet d'un utilisateur donc on ne le débite pas
            _debit = false;
            // Si l'utilistateur ne possède pas l'objet (catégorie), on ne fait rien
            if (!user.inventaire.hasOwnProperty(_categorie)) {
                return interaction.reply({ content: `>>> L'utilisateur n'a pas de ${capitalize(_objet)}, impossible de lui retirer.`, ephemeral: true});
            }
            // Si l'utilistateur ne possède pas l'objet (objet), on ne fait rien
            if (!user.inventaire[_categorie].hasOwnProperty(_objet)) {
                return interaction.reply({ content: `>>> L'utilisateur n'a pas de ${capitalize(_objet)}, impossible de lui retirer.`, ephemeral: true});
            } else {
                // Si l'utilistateur possède l'objet mais la quantité = 0, on ne fait rien
                if (user.inventaire[_categorie][_objet] < Math.abs(_quantite)) {
                    return interaction.reply({ content: `>>> L'utilisateur n'a pas suffisament de ${capitalize(_objet)}, impossible de lui retirer.`, ephemeral: true});
                }
                // Supprimer l'objet de l'inventaire de l'utilisateur
                user.inventaire[_categorie][_objet] += _quantite;
                await interaction.reply({content: `>>> \`x${_quantite}\` ${capitalize(_objet)} supprimé de l'inventaire de <@${userId}>`, ephemeral: true});

                try {
                    // Enregistrer dans la base de donnée
                    await saveDb(userId, user);
                } catch (error) {
                    console.error(error);
                    return await buttonInteraction.reply({ content: `>>> Un problème est survenu.`, ephemeral: true });
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
                return await interaction.reply({content: `>>> L'utilisateur n'a pas suffisamment de ${devise} pour être débité de **${prixTotal} ${devise}**.`, ephemeral: true});
                
            }
            // Déduire le prix de l'objet de la money de l'utilisateur si l'option _debit est vrai
            user.inventaire.money -= prixTotal;
            await interaction.reply({content: `>>> \`x${_quantite} ${capitalize(_objet)}\` ajouté à l'inventaire de <@${userId}>\n*L'utilisateur a été débité de \`${prixTotal} ${devise}\`.*`, ephemeral: true});
        } else {
            await interaction.reply({content: `>>> \`x${_quantite} ${capitalize(_objet)}\` ajouté à l'inventaire de <@${userId}>\n*L'utilisateur n'a pas été débité.*`, ephemeral: true});
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