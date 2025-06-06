const { ChatInputCommandInteraction } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);

    if (!command)
      return interaction.reply({
        content: "This command is outdated",
        ephemeral: true,
      });

    if (command.developer && interaction.user.id !== "495706825572876288")
      return interaction.reply({
        content: "This command is under development",
        ephemeral: true,
      });

    if (
      command.defaultRoleId &&
      !interaction.member.roles.cache.has(command.defaultRoleId)
    )
      return interaction.reply({
        content: "You do not have the required role for this command",
        ephemeral: true,
      });

    const subCommand = interaction.options.getSubcommand(false);
    if (subCommand) {
      const subCommandFile = client.subCommands.get(
        `${interaction.commandName}.${subCommand}`
      );
      if (!subCommandFile)
        return interaction.reply({
          content: "This sub command is outdated",
          ephemeral: true,
        });
      subCommandFile.execute(interaction, client);
    } else command.execute(interaction, client);
  },
};