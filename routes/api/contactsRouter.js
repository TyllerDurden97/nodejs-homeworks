import express from "express";
import contactsService from '../../models/contacts.js';
import httpError from "../../helpers/httpError.js";

const contactsRouter = express.Router()

contactsRouter.get('/', async (req, res, next) => {
   try {
      const result = await contactsService.listContacts();
      res.json({ result });
   } catch (error) {
      next(error);
   }
});

contactsRouter.get('/:contactId', async (req, res, next) => {
   try {
      const { contactId } = req.params;
      const result = await contactsService.getContactById(contactId);
      if (!result) {
         throw httpError(404, `Contact with id=${contactId} not found`);
      }
      res.json(result);
   } catch (error) {
      next(error);
   }
});

contactsRouter.post('/', async (req, res, next) => {
   try {
      // console.log(req.body);
      const result = await contactsService.addContact(req.body);
      res.status(201).json(result);
   } catch (error) {
      next(error);
   }
});

contactsRouter.delete('/:contactId', async (req, res, next) => {
  res.json({ message: 'template message' })
})

contactsRouter.put('/:contactId', async (req, res, next) => {
  res.json({ message: 'template message' })
})

export default contactsRouter;
