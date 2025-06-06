const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} = require("discord.js");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ny-dommer")
    .setDescription("Legg til en ny dommer")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((option) =>
      option
        .setName("bruker")
        .setDescription("Brukeren som skal legges til som dommer")
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const user = interaction.options.getUser("bruker");
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ Kunne ikke finne brukeren i serveren.",
        ephemeral: true,
      });
    }

    const nickname = member.nickname || member.user.username;

    // Sjekk om dommer allerede finnes
    db.get(
      `SELECT * FROM dommere WHERE user_id = ?`,
      [user.id],
      async (err, row) => {
        if (err) {
          console.error("DB-feil:", err);
          return interaction.reply({
            content: "❌ En databasefeil oppstod.",
            ephemeral: true,
          });
        }

        // ✅ Hvis dommer finnes
        if (row) {
          const categoryExists =
            row.kategori_id &&
            interaction.guild.channels.cache.has(row.kategori_id);

          if (categoryExists) {
            return interaction.reply({
              content: `⚠️ ${nickname} er allerede registrert som dommer med en kategori.`,
              ephemeral: true,
            });
          }

          // ❗ Har ikke gyldig kategori — lag en ny og oppdater
          const newCategory = await interaction.guild.channels.create({
            name: nickname,
            type: 4, // Category
            reason: "Mangler kategori for dommer",
          });

          db.run(
            `UPDATE dommere SET kategori_id = ? WHERE user_id = ?`,
            [newCategory.id, user.id],
            (err) => {
              if (err) {
                console.error("DB-feil:", err);
                return interaction.reply({
                  content: "❌ Klarte ikke å oppdatere kategorien i databasen.",
                  ephemeral: true,
                });
              }

              return interaction.reply({
                content: `✅ ${nickname} hadde ingen kategori. Ny kategori er nå opprettet og lagret.`,
                ephemeral: true,
              });
            }
          );

          return;
        }

        // ✅ Dommer finnes ikke – lag ny kategori og legg til
        const newCategory = await interaction.guild.channels.create({
          name: nickname,
          type: 4, // Category
          reason: "Ny dommer registrert",
        });

        db.run(
          `INSERT INTO dommere (user_id, nickname, kategori_id) VALUES (?, ?, ?)`,
          [user.id, nickname, newCategory.id],
          (err) => {
            if (err) {
              console.error("DB-feil:", err);
              return interaction.reply({
                content: "❌ Klarte ikke å lagre informasjon i databasen.",
                ephemeral: true,
              });
            }

            return interaction.reply({
              content: `✅ ${nickname} er nå registrert som dommer, og en ny kategori har blitt opprettet.`,
              ephemeral: true,
            });
          }
        );
      }
    );
  },
};
