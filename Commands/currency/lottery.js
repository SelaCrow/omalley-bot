const { SlashCommandBuilder } = require('discord.js');
const { User, LotteryTickets, LotteryState } = require('../../dbObjects.js');

const ticketPrice = 10;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Participate in the server lottery!')
		.addSubcommand(subcommand =>
			subcommand.setName('buy')
				.setDescription('Buy lottery tickets')
				.addIntegerOption(option =>
					option.setName('tickets')
						.setDescription('Number of tickets to buy')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand.setName('check')
				.setDescription('Check your lottery tickets'),
		)
		.addSubcommand(subcommand =>
			subcommand.setName('pool')
				.setDescription('Check the total gold in the prize pool'),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		// 🛒 `/lottery buy` - Purchase Tickets
		if (subcommand === 'buy') {
			const ticketCount = interaction.options.getInteger('tickets');
			if (ticketCount <= 0) return interaction.reply({ content: '❌ You need to buy at least **1** ticket!', ephemeral: true });

			const totalCost = ticketCount * ticketPrice;
			const user = await User.findOne({ where: { user_id: userId } });

			if (!user || user.balance < totalCost) {
				return interaction.reply({ content: '❌ Slow down, cowboy! Your purse ain\'t heavy enough for that many tickets!', ephemeral: true });
			}

			// Deduct gold
			user.balance -= totalCost;
			await user.save();

			// Update tickets in DB
			const userTickets = await LotteryTickets.findOne({ where: { user_id: userId } });
			if (userTickets) {
				userTickets.tickets += ticketCount;
				await userTickets.save();
			}
			else {
				await LotteryTickets.create({ user_id: userId, tickets: ticketCount });
			}

			// Update prize pool
			const lotteryState = await LotteryState.findOne() || await LotteryState.create({ prize_pool: 0 });
			lotteryState.prize_pool += totalCost;
			await lotteryState.save();

			return interaction.reply(`🎟️ You just bought yourself ${ticketCount} tickets! That puts you at ${lotteryPool[userId]} total. The prize pool's sittin' at ${prizePool} gold now!`);
		}

		// 🔎 `/lottery check` - Check User's Tickets
		if (subcommand === 'check') {
			const userTickets = await LotteryTickets.findOne({ where: { user_id: userId } });
			const ticketCount = userTickets ? userTickets.tickets : 0;
			return interaction.reply(`🎟️ You have **${ticketCount}** tickets in your saddlebag.`);
		}

		// 💰 `/lottery pool` - Check Total Prize Pool
		if (subcommand === 'pool') {
			const lotteryState = await LotteryState.findOne();
			const prizePool = lotteryState ? lotteryState.prize_pool : 0;
			return interaction.reply(`🏆 The prize pool is **${prizePool}** gold!`);
		}
	},
};
