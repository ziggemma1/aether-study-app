import { Request, Response } from 'express';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { StudyPlan } from '../models/StudyPlan.js';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const events = await CalendarEvent.find({ userId });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const event = new CalendarEvent({ ...req.body, userId });
    await event.save();
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, userId });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const syncGoogleCalendar = async (req: Request, res: Response) => {
  try {
    // In a real app we'd fetch the user's access token and pull events.
    // For now, we simulate a successful sync.
    res.json({ message: 'Sync successful', syncedCount: 5 });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const findAvailability = async (req: Request, res: Response) => {
  // Return some dummy open slots
  res.json({
    slots: [
      { start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString() },
    ]
  });
};

export const aiSchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { topics } = req.body;
    
    // Simulate smart scheduling response
    const events = topics?.map((t: string, i: number) => ({
      userId,
      title: `Study: ${t}`,
      start: new Date(Date.now() + (i+1) * 86400000),
      end: new Date(Date.now() + (i+1) * 86400000 + 3600000),
      type: 'study',
      color: '#6C5CE7'
    })) || [];
    
    await CalendarEvent.insertMany(events);
    res.json({ message: 'AI Scheduling complete', events });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
