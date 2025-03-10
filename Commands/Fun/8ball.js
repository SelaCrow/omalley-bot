const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: '7',
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask the magic 8-ball a question!')
		.addStringOption(option =>
			option.setName('question')
				.setDescription('The question you want to ask')
				.setRequired(true)),

	async execute(interaction) {
		// Array of responses
		const eightball = [
			'It\'s a sure thing, partner',
			'Ain\'t no doubt about it.',
			'No doubt \'bout it, partner.',
			'You can hang your hat on that!',
			'You can stake your claim on that.',
			'Far as I can see, yep.',
			'Chances look mighty fine.',
			'Sky\'s clear, no storms ahead.',
			'Sure as a horse loves hay.',
			'Trail signs say yup.',
			'Dust\'s still settlin\'—try again later.',
			'Ain\'t quite clear—ask again in a spell.',
			'Best I keep that under my hat for now.',
			'Hard tellin\'—can\'t say just yet.',
			'Keep your eyes on the horizon and ask again.',
			'Don\'t count on it.',
			'Nope, not happenin\'.',
			'Word \'round town says no.',
			'Storm\'s brewin\', partner—outlook ain\'t great.',
			'Wouldn\'t hold my breath if I were you.',
			'Ain\'t happenin\', no how.',
			'Reckon it\'s a toss-up.',
			'Ain\'t for me to say—trust your gut.',
			'Ain\'t happenin\', no how.',
			'Depends on whether the wind\'s blowin\' in your favor.',
			'Keep your boots on, I\'m workin\' on it.',
			'It\'s done and dusted, cowboy.',
			'This here\'s just the start of somethin\' new.',
			'Luck\'s all you got now, friend—ride smart.',
			'What the fuck?',
		];

		// Get the user's question
		const question = interaction.options.getString('question');

		// Select a random response
		const response = eightball[Math.floor(Math.random() * eightball.length)];

		// Simulate thinking time
		await interaction.deferReply();

		setTimeout(() => {
			interaction.editReply(`🎱 **${question}**\n**Answer:** ${response}`);
		}, 750);
	},
};
