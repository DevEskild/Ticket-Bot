const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sak-tilgang")
    .setDescription("Legger til eller fjerner en bruker fra kanalen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("legg-til")
        .setDescription("Legger til en bruker")
        .addUserOption((opt) =>
          opt
            .setName("bruker")
            .setDescription("Bruker du vil legge til")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("fjern")
        .setDescription("Fjerner er bruker fra kanalen")
        .addUserOption((opt) =>
          opt
            .setName("bruker")
            .setDescription("Brukeren du ønsker å fjerne")
            .setRequired(true)
        )
    ),
};
