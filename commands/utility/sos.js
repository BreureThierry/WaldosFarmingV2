const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
// FONCTIONS
const { loadUser } = require('../../fonctions.js');
// CONFIG
const config = require('../../config.json');
const color = config.bot.botColor;
const devise = config.bot.devise;
const fs = require("fs");
// LANG
const locales = {};
for (const file of fs.readdirSync('./locale')) {
    locales[file.split('.')[0]] = require(`../../locale/${file}`);
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('sos')
        .setDescription('Here is the list of available commands.'),
    async execute(interaction) {

        // Récupère l'utilisateur
        const user = await loadUser(interaction.user.id);

        if (!user.lang) {
            user.lang = config.bot.defaultLang;
            console.log(`[sos] Utilisateur sans langue définie. Langue par défaut : ${config.bot.defaultLang}`);
        }

        const sosEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${locales[user.lang].sosTitle}`)
            .setAuthor({ name: 'Let\'s Grow! v2'})
            .setDescription(`${locales[user.lang].sosDescription}`)
            .addFields(
                { name: '`/sos`', value: `${locales[user.lang].sosCommandeSOS}` },
                { name: '`/start`', value: `${locales[user.lang].sosCommandeStart}` },
                { name: '`/language`', value: `${locales[user.lang].sosCommandeLanguage}` },
                { name: '`/plantations`', value: `${locales[user.lang].sosCommandePlantations}` },
                { name: '`/inventory`', value: `${locales[user.lang].sosCommandeInventory}` },
                { name: '`/sell`', value: `${locales[user.lang].sosCommandeSell}` },
                { name: '`/ranking`', value: `${locales[user.lang].sosCommandeRanking}` },
                { name: '`/shop`', value: `${locales[user.lang].sosCommandeShop}` },
            )
            .addFields(
                { name: '`/money`', value: `${locales[user.lang].sosCommandeMoney} ${devise}.` },
                { name: '`/objet`', value: `${locales[user.lang].sosCommandeObjet}` },
            )
        await interaction.reply({ content: `${interaction.user}`, embeds: [sosEmbed] });
    },
};