const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require('node:path');
// FONCTIONS
const { loadUser } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('classement')
        .setDescription('Affiche le classement des 10 growers les plus riches'),
    async execute(interaction) {
        // Charger les données
        const directoryPath = path.join(__dirname, '../../database');
        const date = new Date().toLocaleString();
        try {
            // Lire les données
            fs.readdir(directoryPath, async (err, files) => {
                if (err) {
                    return console.log('Impossible de scanner le répertoire : ' + err);
                } 
    
                const users = [];
                let totalCirculationPoints = 0;
                let totalPlayers = 0;
                for (let file of files) {
                    if (path.extname(file) === '.json' && file !== 'database.json') {
                        // split le .json pour récupérer l'id de l'utilisateur
                        file = file.split('.json')[0];
                        let user = await loadUser(file);
                        if (!user.id || !user.inventaire.money || !user.nomServeur) {
                            user = { id: file, nomServeur: 'Inconnu', inventaire: { money: 0 }};
                        }
                        users.push({ id: user.id, money: user.inventaire.money, name: user.nomServeur});
                        totalCirculationPoints += user.inventaire.money;
                        totalPlayers++;
                    }
                }
                
                console.log(`${date} [/classement] par ${interaction.user.globalName} (${interaction.user.id})`);

                // Trie le classement par ordre décroissant
                users.sort((a, b) => b.money - a.money);
    
                const top10 = users.slice(0, 10).map((user, index) => `\`${index + 1}\` <@${user.id}> \`${user.money} ${devise}\``);
    
                // Construire le message d'embed pour afficher le classement
                const embedClassement = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({ name: 'Top 10 des utilisateurs les plus riches' })
                    .setDescription(`ㅤ\n${top10.join(' \n')}`)
                    .setFooter({ text: `ㅤ\nTotal de joueurs : ${totalPlayers} ㅤㅤㅤㅤㅤㅤㅤㅤㅤ${devise} : ${totalCirculationPoints}`});
    
                // Envoyer le message d'embed
                await interaction.reply({ content: `>>> ${interaction.user}`, embeds: [embedClassement] });
            });    
        } catch (error) {
            const date = new Date().toLocaleString();
            console.log(`${date} [/classement] Erreur lors de l'affichage du classement.`);
            // Envoyer le message d'embed
            await interaction.reply({ content: `>>>🤯 Erreur lors de l'affichage du classement. !\n \r*N'hésite pas à signaler ce bug avec une capture d'écran.*\n \r\`${date}\`` });
        }
    },
};