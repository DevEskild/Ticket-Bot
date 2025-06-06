const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");

const { Guilds, GuildMembers, GuildMessages, GuildModeration } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, GuildModeration],
  partials: [User, Message, GuildMember, ThreadMember],
});

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();
client.subCommands = new Collection();

const { loadEvents } = require("./Handlers/eventHandler");
const { loadCommands } = require("./Handlers/commandHandler");

client.removeAllListeners("interactionCreate"); // Clear existing listeners

client
  .login(client.config.TOKEN)
  .then(async () => {
    await loadEvents(client);
    await loadCommands(client);

    console.log(`Client logged in as ${client.user.username}`);
    client.user.setActivity(`with ${client.guilds.cache.size} guilds`);
  })
  .catch((err) => console.log(err));
