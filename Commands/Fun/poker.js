const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../../dbObjects.js');

const pokerGame = {
	players: new Map(),
	deck: [],
	communityCards: [],
	pot: 0,
	currentBet: 0,
	turnOrder: [],
	turnIndex: 0,
	gameStarted: false,
	stage: 'preflop',
};

// 🎴 Shuffle Deck Function
function shuffleDeck() {
	const deck = [];
	const suits = ['♠', '♥', '♦', '♣'];
	const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

	for (const suit of suits) {
		for (const value of values) {
			deck.push({ suit, value });
		}
	}
	// Shuffle using Fisher-Yates algorithm
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}

	return deck;
}

// 🎮 Poker Command Setup
module.exports = {
	data: new SlashCommandBuilder()
		.setName('poker')
		.setDescription('Join a high-stakes game of Texas Hold\'em.')
		.addSubcommand(subcommand =>
			subcommand.setName('join')
				.setDescription('Step up to the table and join the game'))
		.addSubcommand(subcommand =>
			subcommand.setName('start')
				.setDescription('Kick off the game (Host only)'))
		.addSubcommand(subcommand =>
			subcommand.setName('bet')
				.setDescription('Place your bet')
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('Gold you want to bet')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('next')
				.setDescription('Reveal the next community card.'))
		.addSubcommand(subcommand =>
			subcommand.setName('showdown')
				.setDescription('Reveal hands and determine the winner.')),

	async execute(interaction) {
		await interaction.deferReply();

		try {
			const subcommand = interaction.options.getSubcommand();
			const userId = interaction.user.id;
			const user = await User.findOne({ where: { user_id: userId } });

			if (!user) {
				return interaction.editReply({ content: 'You ain\'t got a single gold nugget to your name, partner.' });
			}

			// 🎲 Player joins the game
			if (subcommand === 'join') {
				if (pokerGame.players.has(userId)) {
					return interaction.editReply({ content: 'You\'re already sittin\' at the table, cowboy.' });
				}
				pokerGame.players.set(userId, { hand: [], bet: 0, folded: false });
				return interaction.editReply(`${interaction.user} just pulled up a chair at the table.`);
			}

			// 🎮 Start the game
			if (subcommand === 'start') {
				if (pokerGame.gameStarted) {
					return interaction.editReply({ content: 'This game\'s already started, cowboy.' });
				}

				if (pokerGame.players.size < 2) {
					return interaction.editReply({ content: 'Not enough players for a showdown. Need at least two varmints.' });
				}

				pokerGame.gameStarted = true;
				pokerGame.deck = shuffleDeck();
				pokerGame.pot = 0;
				pokerGame.turnOrder = Array.from(pokerGame.players.keys());
				pokerGame.turnIndex = 0;
				pokerGame.communityCards = [pokerGame.deck.pop(), pokerGame.deck.pop(), pokerGame.deck.pop()];

				for (const [playerId, player] of pokerGame.players) {
					player.hand = [pokerGame.deck.pop(), pokerGame.deck.pop()];
					const dmUser = await interaction.client.users.fetch(playerId);
					try {
						await dmUser.send(`You're holdin': ${player.hand[0].value} of ${player.hand[0].suit}, ${player.hand[1].value} of ${player.hand[1].suit}`);
					}
					catch (error) {
						console.error(`Couldn't DM ${dmUser.tag}, their DMs might be closed.`, error);
					}
				}

				return interaction.editReply('The game has started! Players, check your DMs for your cards. First three community cards coming soon.');
			}

			// 🎲 Player places a bet
			if (subcommand === 'bet') {
				if (!pokerGame.gameStarted) {
					return interaction.editReply({ content: 'Ain\'t no poker game runnin\', partner.' });
				}

				const betAmount = interaction.options.getInteger('amount');
				const player = pokerGame.players.get(userId);

				if (!player) {
					return interaction.editReply({ content: 'You ain\'t even sittin\' at this table, partner.' });
				}

				if (user.balance < betAmount) {
					return interaction.editReply({ content: 'You ain\'t got enough gold to be bettin\' that high, cowboy.' });
				}

				// Deduct gold and place bet
				user.balance -= betAmount;
				await user.save();
				pokerGame.pot += betAmount;
				player.bet += betAmount;
				pokerGame.currentBet = Math.max(pokerGame.currentBet, betAmount);

				return interaction.editReply(`${interaction.user} put **${betAmount}** gold into the pot. The pot's now sittin' at **${pokerGame.pot}** gold.`);
			}

			// 🃏 Reveal the Next Card
			if (subcommand === 'next') {
				if (!pokerGame.gameStarted) {
					return interaction.editReply({ content: 'Ain\'t no poker game running, partner.' });
				}

				if (pokerGame.communityCards.length < 5) {
					pokerGame.communityCards.push(pokerGame.deck.pop());
					return interaction.editReply(`The next community card is: ${pokerGame.communityCards[pokerGame.communityCards.length - 1].value} of ${pokerGame.communityCards[pokerGame.communityCards.length - 1].suit}`);
				}

				return interaction.editReply({ content: 'All cards are already revealed! Call `/poker showdown` to determine the winner.' });
			}
			// 🃏 Player folds
			if (subcommand === 'fold') {
				if (!pokerGame.gameStarted) {
					return interaction.editReply({ content: 'Ain\'t no poker game running, partner.' });
				}

				const player = pokerGame.players.get(userId);

				if (!player) {
					return interaction.editReply({ content: 'You ain\'t even sittin\' at this table, partner.' });
				}

				if (player.folded) {
					return interaction.editReply({ content: 'You already folded, partner. Sit tight and watch the others play.' });
				}

				player.folded = true;

				// Check if only one player is left
				const activePlayers = Array.from(pokerGame.players.values()).filter(p => !p.folded);
				if (activePlayers.length === 1) {
					const winnerId = Array.from(pokerGame.players.keys()).find(id => !pokerGame.players.get(id).folded);
					const winner = await User.findOne({ where: { user_id: winnerId } });

					if (winner) {
						winner.balance += pokerGame.pot;
						await winner.save();
					}

					pokerGame.gameStarted = false;
					pokerGame.players.clear();
					pokerGame.pot = 0;
					pokerGame.communityCards = [];

					return interaction.editReply(`<@${winnerId}> wins the pot since everyone else folded! The game is over.`);
				}

				return interaction.editReply(`${interaction.user} has folded. Next up: <@${pokerGame.turnOrder[pokerGame.turnIndex]}>.`);
			}

		}
		catch (error) {
			console.error('Error executing poker command:', error);
			return interaction.editReply({ content: 'Something went wrong, partner. Try again later.' });
		}
	},
};
