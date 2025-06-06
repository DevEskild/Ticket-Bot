const db = require("../db");

function getTicketById(ticketId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = getTicketById;
