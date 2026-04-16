const { SlashCommandBuilder, Collection } = require('discord.js');
const { User } = require('../../dbObjects.js');

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

		// ❌ Self-duel check
		if (challenger.id === opponent.id) {
			return interaction.reply({ content: 'A showdown takes two, not one! Go find someone else to challenge.', ephemeral: false });
		}

		// ❌ Don't let them challenge the bot
		if (opponent.id === interaction.client.user.id) {
			return interaction.reply({ content: 'Me? In a duel? Reckon I\'d win too fast. Pick someone else, partner.', ephemeral: false });
		}

		// ⏳ Cooldown check
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

		// ⚔️ Challenge Message & Accept System
		await interaction.reply(`${opponent}, you've been called out by ${challenger} for a duel! Type \`accept\` to take up the challenge, or be known as a yella-bellied coward!`);

		const acceptFilter = response => response.content.toLowerCase() === 'accept' && response.author.id === opponent.id;
		const acceptCollector = interaction.channel.createMessageCollector({ filter: acceptFilter, time: 15000 });

		acceptCollector.on('collect', async () => {
			acceptCollector.stop();
			await interaction.followUp('Alright, partners. Get ready... I\'ll call the draw soon! 🤠');

			// 🎯 Randomized Draw Timer (between 3 to 10 seconds)
			const drawTime = Math.floor(Math.random() * (10000 - 3000 + 1)) + 3000;
			setTimeout(async () => {
				await interaction.followUp('DRAW! Type `draw` as fast as you can!');

				const drawFilter = response => response.content.toLowerCase() === 'draw' && (response.author.id === challenger.id || response.author.id === opponent.id);
				const drawCollector = interaction.channel.createMessageCollector({ filter: drawFilter, time: 5000 });

				drawCollector.on('collect', async collectedResponse => {
					drawCollector.stop();
					const winner = collectedResponse.author;
					const loser = winner.id === challenger.id ? opponent : challenger;

					try {
						// Update the winner's balance
						const winnerUser = await User.findOne({ where: { user_id: winner.id } });
						if (winnerUser) {
							winnerUser.balance += 5;
							await winnerUser.save();
						}
						else {
							await User.create({ user_id: winner.id, balance: 5 });
						}

						await interaction.followUp(`💥 ${winner} was faster on the trigger! ${loser} bites the dust! ${winner} wins 5 gold! 🏆`);
					}
					catch (error) {
						console.error('Error updating winner\'s balance:', error);
						await interaction.followUp('There was an error updating the winner\'s balance. Please try again later.');
					}
				});

				drawCollector.on('end', collected => {
					if (collected.size === 0) {
						interaction.followUp('Neither of y\'all drew! Guess it was a false alarm.');
					}
				});
			}, drawTime);
		});

		acceptCollector.on('end', collected => {
			if (collected.size === 0) {
				interaction.followUp(`${opponent} didn't accept the duel. Guess they ain't got the guts! 🤠`);
			}
		});
	},
};
