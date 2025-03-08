const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { Op } = require("sequelize");
const { sequelize } = require("../../models");
const { Event, Ticket, TicketCode } = require("../../models");
const { generateTicketPDF } = require("../../functions/generateTicketPDF");


class EventController {
  static async purchaseTickets(req, res) {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
      // Récupérer le ticket concerné pour cet événement et ce type
      const ticket = await Ticket.findOne({
        where: {
          id: id,
          saleStartDate: { [Op.lte]: new Date() },
          saleEndDate: { [Op.gte]: new Date() },
        },
        include: {
          model: Event,
          attributes: [
            "id",
            "titre",
            "sous_titre",
            "details",
            "lieu",
            "date",
            "isPaid",
          ],
        },
      });

      if (!ticket) {
        return res
          .status(400)
          .json({
            message: "Ticket non disponible ou période de vente expirée",
          });
      }

      // Vérifier la disponibilité
      if (ticket.available < quantity) {
        return res
          .status(400)
          .json({ message: "Quantité de tickets insuffisante" });
      }

      // Simuler le paiement ou intégrer le service de paiement ici
      const paymentSuccessful = true; // Simulation
      if (!paymentSuccessful) {
        return res.status(400).json({ message: "Échec du paiement" });
      }

      // Démarrer une transaction pour la mise à jour du stock et la création des tickets achetés
      const transaction = await sequelize.transaction();

      try {
        // Mise à jour du stock
        ticket.available = ticket.available - quantity;
        await ticket.save({ transaction });

        // Génération des PDF pour chaque ticket acheté
        let pdfName = [];
        for (let i = 0; i < quantity; i++) {
          const ticketCode = uuidv4(); // Code unique pour le ticket

          // Génération du QR Code en data URL
          const qrDataUrl = await QRCode.toDataURL(ticketCode);

          // Génération du PDF
          const { filename } = await generateTicketPDF({
            ticketCode,
            qrDataUrl,
            eventName: ticket.Event.titre,
            ticketType: ticket.typeTicket,
            lieu: ticket.Event.lieu,
            date: ticket.Event.date,
            // Vous pouvez ajouter d'autres informations
          });
          pdfName.push(filename);
          // Sauvegarde en base
          await TicketCode.create(
            {
              ticketName: filename,
              ticketCode,
              EventId: ticket.Event.id,
              TicketId: ticket.id,
              enabled: true,
            },
            { transaction }
          );
        }

        // Engagement de la transaction
        await transaction.commit();

        // Optionnel : Envoi des PDF par mail à l'utilisateur
        // sendEmailWithTickets(userEmail, pdfPaths);

        return res
          .status(200)
          .json({ message: "Achat réussi", tickets: pdfName });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erreur serveur", error: error.message });
    }
  }


  static async getRecentEvents(req, res) {
    try {
      const today = new Date();
      const events = await Event.findAll({
        where: {
          enabled: true,
          date: {
            [Op.gte]: today, // récupère les événements dont la date est supérieure ou égale à aujourd'hui
          },
        },
        order: [["date", "DESC"]],
        attributes: ['id', 'titre', 'sous_titre', 'imageCover','date', 'lieu', 'isPaid'],
        limit: 4,
      });
      return res.status(200).json({ events });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = EventController;
