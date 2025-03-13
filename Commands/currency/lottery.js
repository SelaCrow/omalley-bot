const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { User } = require('../../dbObjects.js');

let lotteryPool = [];
let prizePool = 0;
let drawTimeout = null;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lottery')
		.setDescription('Join the server lottery!')
		.addIntegerOption(option =>
			option.setName('tickets')
				.setDescription('Number of tickets to buy')
				.setRequired(true),
		),
	async execute(interaction) {
		const userId = interaction.user.id;
		const ticketCount = interaction.options.getInteger('tickets');
		const ticketPrice = 10;
		const totalCost = ticketCount * ticketPrice;

		// Retrieve user from database
		const user = await User.findOne({ where: { user_id: userId } });

		if (!user || user.balance < totalCost) {
			return interaction.reply({ content: 'You don\'t have enough gold to buy tickets!', ephemeral: true });
		}

		// Deduct gold and add user to lottery
		user.balance -= totalCost;
		await user.save();
		prizePool += totalCost;
		for (let i = 0; i < ticketCount; i++) {
			lotteryPool.push(userId);
		}

		return interaction.reply(`🎟️ You bought **${ticketCount}** tickets! The total prize pool is now **${prizePool}** gold.`);
	},
};

// 🎯 `/draw` Command - Manually Pick Winner (Mod Only)
module.exports.draw = {
	data: new SlashCommandBuilder()
		.setName('draw')
		.setDescription('Pick a random lottery winner')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	async execute(interaction) {
		await drawLottery(interaction);
	},
};

// 🎯 `/setdraw` Command - Schedule a Lottery Draw (Mod Only)
module.exports.setdraw = {
	data: new SlashCommandBuilder()
		.setName('setdraw')
		.setDescription('Schedule a lottery draw after a set amount of time.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addIntegerOption(option =>
			option.setName('minutes')
				.setDescription('Minutes until the draw happens')
				.setRequired(true),
		),

	async execute(interaction) {
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
	},
};

// 📌 Helper Function: Perform the Lottery Draw
async function drawLottery(interaction) {
	if (lotteryPool.length === 0) {
		return interaction.reply('No tickets have been sold yet!');
	}

	const winnerId = lotteryPool[Math.floor(Math.random() * lotteryPool.length)];
	const winner = await User.findOne({ where: { user_id: winnerId } });

	if (!winner) {
		return interaction.reply('Error: Winner not found in the database.');
	}

	// Give the winner the prize
	winner.balance += prizePool;
	await winner.save();

	// Announce the winner
	const prize = prizePool;
	lotteryPool = [];
	prizePool = 0;
	drawTimeout = null;

	return interaction.reply(`🎉 The lottery winner is <@${winnerId}>! They won **${prize}** gold! 🎊`);
}
