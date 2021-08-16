const { REST } = require('@discordjs/rest'); // npm install @discordjs/rest
const { Routes } = require('discord-api-types/v9'); // npm install discord-api-types
const fs = require('fs');

const token = 'Your Discord Bot Token';

// Place your client and guild ids here
const clientId = '123456789012345678';
const guildId = '876543210987654321'; // Only needed for guild commands. For globabl commands this can be removed.

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
