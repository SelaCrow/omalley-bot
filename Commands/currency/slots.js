const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

const symbols = ['🍒', '🍋', '🍉', '⭐', '💎', '🍀', '🔥', '👑', '💰'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Play the slot machine and test your luck!')
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of gold to bet')
				.setRequired(true),
		),
	async execute(interaction) {
		const userId = interaction.user.id;
		const betAmount = interaction.options.getInteger('bet');

		// Retrieve user from database
		const user = await User.findOne({ where: { user_id: userId } });

		// Check if user exists and has enough gold
		if (!user || user.balance < betAmount) {
			return interaction.reply({ content: '💰 Whoa there, buckaroo! Yer pockets ain\'t jinglin\' enough for that bet. Better rustle up some more gold first.', ephemeral: true });
		}

		// Slot symbols
		const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
		const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

		// Display slot result
		const result = `🎰 | ${slot1} | ${slot2} | ${slot3} | 🎰`;

		let winnings = 0;
		let message = '';

		// 🎯 **Jackpot - 3 Matching Symbols**
		if (slot1 === slot2 && slot2 === slot3) {
			if (slot1 === '💰') {
				winnings = betAmount * 20;
				message = `💰💰💰 **WELL SLAP MY SADDLE!** You done hit the **ULTRA JACKPOT** and pocketed **${winnings}** gold! 🤠`;
			}
			else if (slot1 === '👑') {
				winnings = betAmount * 10;
				message = `👑👑👑 **CROWN JACKPOT!** You're sittin' pretty with a royal **${winnings}** gold haul! Yeehaw!`;
			}
			else {
				winnings = betAmount * 5;
				message = `🎉 **JACKPOT!** Luck's on yer side today, partner! You just raked in **${winnings}** gold! 🍀`;
			}
		}
		// 🔥 **Special Bonuses**
		else if (slot1 === '🍀' && slot2 === '🍀' && slot3 === '🍀') {
			winnings = betAmount * 3 + 5;
			message = `🍀 **LUCKY CLOVER!** Ain't everyday ya see that! You bagged **${winnings}** gold PLUS a lil' **5 gold bonus** fer good measure.`;
		}
		else if (slot1 === '🔥' && slot2 === '🔥' && slot3 === '🔥') {
			winnings = betAmount * 2;
			message = `🔥 **BLISTERIN' HOT WIN!** The reels done caught fire! You wrangled up **${winnings}** gold!`;
		}
		// ⭐ **Lucky Star - Free Spin**
		else if ((slot1 === '⭐' && slot2 === '⭐') || (slot2 === '⭐' && slot3 === '⭐') || (slot1 === '⭐' && slot3 === '⭐')) {
			winnings = betAmount;
			message = '⭐ **LUCKY STAR!** Ain\'t no way yer walkin\' out empty-handed—ya just earned **a free spin** on the house!';
		}
		// 🎲 **Two Matching Symbols**
		else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
			winnings = Math.floor(betAmount * 2);
			message = `✨ **YEEHAW!** You matched two symbols and walked away with **${winnings}** gold in yer saddlebag!`;
		}
		// ❌ **Loss**
		else {
			user.balance -= betAmount;
			await user.save();
			return interaction.reply(`${result}\n💀 **Tough luck, partner!** This here round wasn't in yer favor—best try again later!`);
		}

		// Update user balance
		user.balance += winnings;
		await user.save();

		// 📈 **Leaderboard - Update Highest Win**
		if (!user.highestWin || winnings > user.highestWin) {
			user.highestWin = winnings;
			await user.save();
			message += '\n🏆 **HOT DIGGITY DOG!** That\'s yer **highest win ever**! Yer on fire, cowboy!';
		}

		// ✅ **Final Result**
		return interaction.reply(`${result}\n${message}`);
	},
};

