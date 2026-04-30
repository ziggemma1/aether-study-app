import { Material, Question, User } from './types';

export const MOCK_USER: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  streak: 5,
  curriculum: 'SAT',
  language: 'English',
  plan: 'free',
};

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'm1',
    title: 'Introduction to Quantum Mechanics',
    type: 'pdf',
    uploadDate: '2024-03-20',
    summary: 'This material covers the fundamental principles of quantum mechanics, including wave-particle duality, the Schrödinger equation, and quantum entanglement. It explains how particles behave at the subatomic level and the mathematical frameworks used to describe them.',
    keyTopics: ['Wave-Particle Duality', 'Schrödinger Equation', 'Quantum States'],
    progress: 65,
  },
  {
    id: 'm2',
    title: 'Modern History: The Industrial Revolution',
    type: 'youtube',
    uploadDate: '2024-03-22',
    summary: 'A comprehensive overview of the Industrial Revolution, focusing on the transition from agrarian societies to industrial powerhouses. Key inventions like the steam engine and their socio-economic impacts are discussed in detail.',
    keyTopics: ['Steam Engine', 'Urbanization', 'Economic Shift'],
    progress: 30,
  },
  {
    id: 'm3',
    title: 'Biology: Cellular Respiration Article',
    type: 'article',
    uploadDate: '2024-03-24',
    summary: 'Detailed notes on cellular respiration, explaining how cells convert biochemical energy from nutrients into adenosine triphosphate (ATP). The material breaks down glycolysis, the Krebs cycle, and the electron transport chain.',
    keyTopics: ['ATP', 'Glycolysis', 'Krebs Cycle'],
    progress: 90,
  },
];

export const MOCK_QUIZ_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is the primary function of the Schrödinger equation?',
    options: [
      'To calculate the speed of light',
      'To describe how the quantum state of a physical system changes with time',
      'To measure the mass of an electron',
      'To predict the weather'
    ],
    correctAnswer: 1,
    explanation: 'The Schrödinger equation is a linear partial differential equation that governs the wave function of a quantum-mechanical system.'
  },
  {
    id: 'q2',
    text: 'Which of the following was a key invention of the Industrial Revolution?',
    options: [
      'The Internet',
      'The Steam Engine',
      'The Printing Press',
      'The Compass'
    ],
    correctAnswer: 1,
    explanation: 'The steam engine was a pivotal invention that powered factories and transportation during the Industrial Revolution.'
  },
  {
    id: 'q3',
    text: 'Where does glycolysis take place in the cell?',
    options: [
      'Mitochondria',
      'Nucleus',
      'Cytoplasm',
      'Ribosome'
    ],
    correctAnswer: 2,
    explanation: 'Glycolysis occurs in the cytoplasm of the cell, where glucose is broken down into pyruvate.'
  }
];
