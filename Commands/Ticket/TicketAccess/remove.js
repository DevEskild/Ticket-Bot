const { ChatInputCommandInteraction } = require("discord.js");

module.exports = {
  subCommand: "sak-tilgang.fjern",

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "Du har ikke tilgang til denne kommandoen.",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/sak-(?:.+-)?(\d+)$/);
    if (!ticketMatch) {
      return interaction.reply({
        content: "Denne kommandoen må brukes i en sak kanal.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("bruker");

    try {
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: false,
      });

      await interaction.reply({
        content: `${user.tag} har blitt fjernet fra kanalen.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("TicketAccess Remove Error:", err);
      return interaction.reply({
        content:
          "Feilet å fjerne brukeren fra kanalen. Skjekk botens tilganger.",
        ephemeral: true,
      });
    }
  },
};
