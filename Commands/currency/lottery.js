const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

const lotteryPool = {};
const ticketPrice = 10;
let prizePool = 0;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Participate in the server lottery!')
		.addSubcommand(subcommand =>
			subcommand
				.setName('buy')
				.setDescription('Buy lottery tickets')
				.addIntegerOption(option =>
					option.setName('tickets')
						.setDescription('Number of tickets to buy')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('check')
				.setDescription('Check how many lottery tickets you have'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('pool')
				.setDescription('Check the total gold in the prize pool'),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		// 🛒 `/lottery buy` - Purchase Tickets
		if (subcommand === 'buy') {
			const ticketCount = interaction.options.getInteger('tickets');

			if (ticketCount <= 0) {
				return interaction.reply({ content: '❌ Slow down, cowboy! Your purse ain\'t heavy enough for that many tickets!', ephemeral: true });
			}

			const totalCost = ticketCount * ticketPrice;

			// Retrieve user from the database
			const user = await User.findOne({ where: { user_id: userId } });

			if (!user || user.balance < totalCost) {
				return interaction.reply({ content: '❌ Whoa there, partner—you ain\'t got enough gold to be buyin\' that many tickets!', ephemeral: true });
			}

			// Deduct gold & add tickets
			user.balance -= totalCost;
			await user.save();

			lotteryPool[userId] = (lotteryPool[userId] || 0) + ticketCount;
			prizePool += totalCost;

			return interaction.reply(`🎟️ You just bought yourself ${ticketCount} tickets! That puts you at ${lotteryPool[userId]} total. The prize pool's sittin' at ${prizePool} gold now!`);
		}

		// 🔎 `/lottery check` - Check User's Tickets
		if (subcommand === 'check') {
			const userTickets = lotteryPool[userId] || 0;
			return interaction.reply(`🎟️ You've got ${userTickets} lottery tickets in your saddlebag, bucko.`);
		}

		// 💰 `/lottery pool` - Check Total Prize Pool (Gold)
		if (subcommand === 'pool') {
			return interaction.reply(`🏆 The total prize pool's up to ${prizePool} gold! That's a mighty fine jackpot!`);
		}
	},
};
