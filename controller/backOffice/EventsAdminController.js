
const { deleteFile } = require("../../functions/deleteFile");
const { Event, Ticket } = require("../../Models");
const createEventSchema = require("../../Validation/events/ValidateEventShema");
const { Op } = require("sequelize");


class EventAdminController {

  static async createEvent(req, res) {
    try {
      // Vérifier la présence de l'image
      if (!req.file) {
        return res.status(400).json({ message: "L'image est obligatoire" });
      }

      // Validation des données de l'événement avec le schéma
      const eventData = await createEventSchema.parseAsync(req.body);
      console.log(eventData.tickets);
      // Ajout de l'image à l'objet événement
      eventData.imageCover = req.file.filename;

      // Création de l'événement en base de données
      const newEvent = await Event.create(eventData);

      // Si l'événement est payant, gérer la création des tickets associés
      if (eventData.isPaid === true) {
        if (!eventData.tickets || eventData.tickets.length === 0) {
          deleteFile(req.file.filename);
          return res
            .status(400)
            .json({
              message:
                "Les informations de ticket sont requises pour un événement payant",
            });
        }

        const ticketsToCreate = eventData.tickets.map((ticket) => ({
          ...ticket,
          eventId: newEvent.id,
        }));

        // Création en masse des tickets (exemple avec Sequelize)
        await Ticket.bulkCreate(ticketsToCreate);
      }

      return res
        .status(200)
        .json({ message: "Événement créé avec succès", event: newEvent });
    } catch (error) {
      console.error(error);
      // Suppression du fichier image en cas d'erreur pour éviter des fichiers orphelins
      deleteFile(req.file.filename);
      return res
        .status(500)
        .json({ message: "Erreur serveur", error: error.message });
    }
  }

  static async getEvent(req, res) {
    try {
      const event = await Event.findAll();
      
      return res.status(200).json({event});
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erreur serveur", error: error.message });
    }
  }


  static async getEventAgent(req, res) {
    try {
      const today = new Date();
      const event = await Event.findAll({where: {enabled: true},
        date: {
          [Op.gte]: today, // récupère les événements dont la date est supérieure ou égale à aujourd'hui
        },
      });
      
      return res.status(200).json({event});
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erreur serveur", error: error.message });
    }
  }


  static deleteEvent = async (req, res) => {
    try {
      const {id} = req.params;
      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      await event.destroy();
      deleteFile(event.imageCover);
      return res.status(200).json({ message: "Event deleted" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error", error: error.message });
    }
  }

  

}

module.exports = EventAdminController;
