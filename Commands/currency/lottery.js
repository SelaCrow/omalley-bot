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
				return interaction.reply({ content: '❌ You must buy at least 1 ticket.', ephemeral: true });
			}

			const totalCost = ticketCount * ticketPrice;

			// Retrieve user from the database
			const user = await User.findOne({ where: { user_id: userId } });

			if (!user || user.balance < totalCost) {
				return interaction.reply({ content: '❌ You don\'t have enough gold to buy that many tickets!', ephemeral: true });
			}

			// Deduct gold & add tickets
			user.balance -= totalCost;
			await user.save();

			lotteryPool[userId] = (lotteryPool[userId] || 0) + ticketCount;
			prizePool += totalCost;

			return interaction.reply(`🎟️ You bought **${ticketCount}** tickets! You now have **${lotteryPool[userId]}** total. The prize pool is now **${prizePool}** gold!`);
		}

		// 🔎 `/lottery check` - Check User's Tickets
		if (subcommand === 'check') {
			const userTickets = lotteryPool[userId] || 0;
			return interaction.reply(`🎟️ You have **${userTickets}** lottery tickets.`);
		}

		// 💰 `/lottery pool` - Check Total Prize Pool (Gold)
		if (subcommand === 'pool') {
			return interaction.reply(`🏆 The total prize pool is **${prizePool}** gold!`);
		}
	},
};
