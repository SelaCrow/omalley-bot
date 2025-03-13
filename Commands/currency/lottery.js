const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { User } = require('../../dbObjects.js');

const lotteryPool = new Map();
let prizePool = 0;
let drawTimeout = null;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Manage the server lottery')
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
		)
		.addSubcommand(subcommand =>
			subcommand.setName('draw')
				.setDescription('Manually pick a random lottery winner')
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		)
		.addSubcommand(subcommand =>
			subcommand.setName('setdraw')
				.setDescription('Schedule a lottery draw after a set amount of time.')
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addIntegerOption(option =>
					option.setName('minutes')
						.setDescription('Minutes until the draw happens')
						.setRequired(true),
				),
		),

	async execute(interaction) {
		const userId = interaction.user.id;
		const subcommand = interaction.options.getSubcommand();

		// 🎟️ Buy Tickets
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

		// 📌 Check Ticket Count
		if (subcommand === 'check') {
			const tickets = lotteryPool.get(userId) || 0;

			if (tickets === 0) {
				return interaction.reply({ content: 'You haven\'t bought any lottery tickets yet!', ephemeral: true });
			}

			return interaction.reply(`🎟️ You currently have **${tickets}** tickets in the lottery.`);
		}

		// 🎯 Draw a Winner (Mod Only)
		if (subcommand === 'draw') {
			await drawLottery(interaction);
		}

		// ⏳ Schedule a Draw (Mod Only)
		if (subcommand === 'setdraw') {
			const minutes = interaction.options.getInteger('minutes');

			if (drawTimeout) {
				return interaction.reply({ content: 'A lottery draw is already scheduled!', ephemeral: true });
			}

			// Schedule the draw
			drawTimeout = setTimeout(async () => {
				await drawLottery(interaction);
				drawTimeout = null;
			}, minutes * 60 * 1000);

			return interaction.reply(`⏳ A lottery draw has been scheduled in **${minutes} minutes**!`);
		}
	},
};

// 📌 Helper Function: Perform the Lottery Draw
async function drawLottery(interaction) {
	if (lotteryPool.size === 0) {
		return interaction.reply('No tickets have been sold yet!');
	}

	// Convert the lottery pool to an array where each entry appears based on their ticket count
	const weightedEntries = [];
	lotteryPool.forEach((ticketCount, userId) => {
		for (let i = 0; i < ticketCount; i++) {
			weightedEntries.push(userId);
		}
	});

	// Pick a winner
	const winnerId = weightedEntries[Math.floor(Math.random() * weightedEntries.length)];
	const winner = await User.findOne({ where: { user_id: winnerId } });

	if (!winner) {
		return interaction.reply('Error: Winner not found in the database.');
	}

	// Award the prize
	winner.balance += prizePool;
	await winner.save();

	// Announce the winner
	const prize = prizePool;
	lotteryPool.clear();
	prizePool = 0;
	drawTimeout = null;

	return interaction.reply(`🎉 The lottery winner is <@${winnerId}>! They won **${prize}** gold! 🎊`);
}