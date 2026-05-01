import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(201).json({ message: 'Created Message' }));

export default router;
