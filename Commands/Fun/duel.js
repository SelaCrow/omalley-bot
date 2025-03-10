const { SlashCommandBuilder, Collection } = require('discord.js');
const { Users } = require('../../dbObjects.js');

const cooldowns = new Collection();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('duel')
		.setDescription('Challenge another player to a quick draw showdown!')
		.addUserOption(option =>
			option.setName('opponent')
				.setDescription('The user you want to challenge')
				.setRequired(true)),
	async execute(interaction) {
		const challenger = interaction.user;
		const opponent = interaction.options.getUser('opponent');

		if (challenger.id === opponent.id) {
			return interaction.reply({ content: 'A showdown takes two, not one! Go find someone else to challenge.', ephemeral: false });
		}

		if (opponent.id === interaction.client.user.id) {
			return interaction.reply({ content: 'Me? In a duel? Reckon I\'d win too fast. Pick someone else, partner.', ephemeral: false });
		}

		// Check cooldown
		const now = Date.now();
		const cooldownAmount = 10 * 1000;
		if (cooldowns.has(challenger.id)) {
			const expirationTime = cooldowns.get(challenger.id) + cooldownAmount;
			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return interaction.reply({ content: `Can't be throwin' challenges left and right! Wait ${timeLeft.toFixed(1)} more seconds before callin' another showdown.`, ephemeral: true });
			}
		}
		cooldowns.set(challenger.id, now);
		setTimeout(() => cooldowns.delete(challenger.id), cooldownAmount);

		await interaction.reply(`Hope you're quick on the draw, ${opponent}, 'cause ${challenger} just called you out! Type 'DRAW!' before they fill you full of lead!`);

		const filter = response => response.content.toLowerCase() === 'draw' && (response.author.id === challenger.id || response.author.id === opponent.id);
		const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

		collector.on('collect', async response => {
			collector.stop();
			const winner = response.author;
			const loser = winner.id === challenger.id ? opponent : challenger;

			// Update the winner's balance
			const winnerUser = await Users.findOne({ where: { user_id: winner.id } });
			if (winnerUser) {
				winnerUser.balance += 5;
				await winnerUser.save();
			}
			else {
				await Users.create({ user_id: winner.id, balance: 5 });
			}

			await interaction.followUp(`${winner} came out on top, leavin' ${loser} in the dust! They ride off with 5 gold nuggets in hand!`);
		});

		collector.on('end', collected => {
			if (collected.size === 0) {
				interaction.followUp('Well, that was a whole lotta nothin\'. No winner, no gold, no glory. Reckon you two got cold feet.');
			}
		});
	},
};