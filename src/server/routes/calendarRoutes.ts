import express from 'express';
import { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  syncGoogleCalendar,
  findAvailability,
  aiSchedule
} from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/events')
  .get(getEvents)
  .post(createEvent);

router.route('/events/:id')
  .put(updateEvent)
  .delete(deleteEvent);

router.post('/sync', syncGoogleCalendar);
router.post('/ai-schedule', aiSchedule);
router.get('/availability', findAvailability);

export default router;
