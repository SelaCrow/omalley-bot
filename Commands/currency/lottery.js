const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

const lotteryPool = new Map();
let prizePool = 0;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Join the server lottery!')
		.addSubcommand(subcommand =>
			subcommand.setName('buy')
				.setDescription('Buy tickets for the lottery')
				.addIntegerOption(option =>
					option.setName('tickets')
						.setDescription('Number of tickets to buy')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand.setName('check')
				.setDescription('Check how many lottery tickets you have'),
		),

	async execute(interaction) {
		const userId = interaction.user.id;
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'buy') {
			const ticketCount = interaction.options.getInteger('tickets');
			const ticketPrice = 10;
			const totalCost = ticketCount * ticketPrice;

			// Retrieve user from database
			const user = await User.findOne({ where: { user_id: userId } });

			if (!user || user.balance < totalCost) {
				return interaction.reply({ content: 'You don\'t have enough gold to buy tickets!', ephemeral: true });
			}

			// Deduct gold and add tickets to the user's count
			user.balance -= totalCost;
			await user.save();
			prizePool += totalCost;

			// Update ticket count
			lotteryPool.set(userId, (lotteryPool.get(userId) || 0) + ticketCount);

			return interaction.reply(`🎟️ You bought **${ticketCount}** tickets! The total prize pool is now **${prizePool}** gold.`);
		}

		if (subcommand === 'check') {
			const tickets = lotteryPool.get(userId) || 0;

			if (tickets === 0) {
				return interaction.reply({ content: 'You haven\'t bought any lottery tickets yet!', ephemeral: true });
			}

			return interaction.reply(`🎟️ You currently have **${tickets}** tickets in the lottery.`);
		}
	},
};
