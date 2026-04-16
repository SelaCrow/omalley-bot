const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll one of them fancy dice')
		.addSubcommand(sub =>
			sub.setName('d2').setDescription('Flip a coin, partner'))
		.addSubcommand(sub =>
			sub.setName('d4').setDescription('Roll a d4'))
		.addSubcommand(sub =>
			sub.setName('d6').setDescription('Roll a d6'))
		.addSubcommand(sub =>
			sub.setName('d8').setDescription('Roll a d8'))
		.addSubcommand(sub =>
			sub.setName('d10').setDescription('Roll a d10'))
		.addSubcommand(sub =>
			sub.setName('d12').setDescription('Roll a d12'))
		.addSubcommand(sub =>
			sub.setName('d20').setDescription('Roll a d20')),

	async execute(interaction) {
		const sub = interaction.options.getSubcommand();
		const sides = parseInt(sub.slice(1));

		const roll = Math.floor(Math.random() * sides) + 1;

		await interaction.reply(`You rolled a **${sub.toUpperCase()}**... and get **${roll}**! Yeehaw!`);
	},
};
