const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { User, LotteryTickets, LotteryState } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('draw')
		.setDescription('Manages the lottery draw (Mods Only)')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand.setName('manual')
				.setDescription('Manually pick a random winner'),
		)
		.addSubcommand(subcommand =>
			subcommand.setName('automatic')
				.setDescription('Schedule a lottery draw')
				.addIntegerOption(option =>
					option.setName('minutes')
						.setDescription('Minutes until draw')
						.setRequired(true),
				),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		// 🎯 `/draw manual` - Instantly picks a winner
		if (subcommand === 'manual') {
			await drawLottery(interaction);
		}

		// ⏳ `/draw automatic <minutes>` - Schedules a draw
		else if (subcommand === 'automatic') {
			const minutes = interaction.options.getInteger('minutes');
			setTimeout(() => drawLottery(interaction), minutes * 60 * 1000);
			return interaction.reply(`✅ The lottery will be drawn in **${minutes} minutes**!`);
		}
	},
};

// 📌 Helper Function: Perform the Lottery Draw
async function drawLottery(interaction) {
	const tickets = await LotteryTickets.findAll();
	if (tickets.length === 0) {
		return interaction.reply('⚠️ No tickets have been sold yet!');
	}

	// 🎟️ Create a weighted pool
	const lotteryPool = [];
	tickets.forEach(user => {
		for (let i = 0; i < user.tickets; i++) {
			lotteryPool.push(user.user_id);
		}
	});

	// Pick a winner
	const winnerId = lotteryPool[Math.floor(Math.random() * lotteryPool.length)];
	const winner = await User.findOne({ where: { user_id: winnerId } });

	if (!winner) {
		return interaction.reply('⚠️ Error: Winner not found.');
	}

	// Award prize
	const lotteryState = await LotteryState.findOne();
	const prize = lotteryState ? lotteryState.prize_pool : 0;
	winner.balance += prize;
	await winner.save();

	// Reset tickets & prize pool
	await LotteryTickets.destroy({ where: {} });
	await LotteryState.update({ prize_pool: 0 }, { where: {} });

	return interaction.reply(`🎉 The winner is <@${winnerId}>! They won **${prize}** gold!`);
}