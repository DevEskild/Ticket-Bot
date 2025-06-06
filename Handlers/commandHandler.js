const { loadFiles } = require("../Functions/fileLoader");

async function loadCommands(client) {
  console.time("Commands Loaded");

  client.commands = new Map();
  client.subCommands = new Map();

  let commands = [];
  let commandsArr = [];

  const files = await loadFiles("Commands");

  for (const file of files) {
    try {
      const command = require(file);
      if (command.subCommand) {
        client.subCommands.set(command.subCommand, command);
        continue;
      }

      client.commands.set(command.data.name, command);

      commandsArr.push(command.data.toJSON());

      commands.push({
        Command: command.data.name,
        Status: "✅",
      });
    } catch (error) {
      console.log(error);
      commands.push({
        Command: command.data.name,
        Status: "🛑",
      });
    }
  }
  await client.application.commands.set([]);
  client.application.commands.set(commandsArr);

  console.table(commands, ["Command", "Status"]);
  console.info("\n\x1b[36m%s\x1b[0m", "Loaded Commands.");
  console.timeEnd("Commands Loaded");
}

module.exports = {
  loadCommands,
};