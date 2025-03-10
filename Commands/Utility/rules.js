const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Displays the server rules'),

	async execute(interaction) {
		await interaction.reply({
			content: '🌙 **Welcome, wanderer, to the realm of shadows and moonlight!** 🐦‍⬛✨\n\n' +
                '***General Rules***\n' +
                '🔪 Please be respectful.\n\n' +
                '🔪 This server is +18. If you are found to be under, <@&1322094517205074021> reserves the right to kick you.\n\n' +
                '🔪 Do not spam in general, and keep everything in its specific channel. Keep bot usage in its specific channels and artwork/photos in the belonged channels, etc!\n\n' +
                '🔪 If someone is harassing you and/or you have a problem with someone, please DM mods <@&1322094517205074021> to help you out! We want to make sure everyone is comfortable and safe in the server.\n\n' +
                '🔪 That being said, it may not be about personal matters; the conflict must involve the server being in danger. Personal matters will need to be talked out in DMs on your own terms.\n\n' +
                '***Voice Chat Rules***\n' +
                '🔪 Like the general rules, be respectful! Don’t talk over people and move to the correct channel when playing games or listening to music.\n\n' +
                '🔪 If eating, please mute your mic or leave the call until finished!\n\n' +
                '🔪 If you’re talking to a parent/guardian/sibling etc. who isn’t involved in VC, mute your mic!\n\n' +
                '🔪 If streaming a game, move over to Game Chat. Make sure to warn folks if the game has excessive violence/gore involved.\n\n' +
                'Before you can get full access to the server, you need to go through verification. Click the Verify button in <#1335751308346658949>. After that, send an introduction for yourself in <#1322094549052428309> using this template:\n\n' +
                '***Introduction Template***\n' +
                '[Name]\n' +
                '[Age]\n' +
                '[Pronouns]\n\n' +
                '[Interests/Hobbies]\n' +
                '[If you could communicate with crows, what would you ask them?]\n\n' +
                'After you do this, a mod will allow you access to the server :]',
			ephemeral: false,
		});
	},
};
