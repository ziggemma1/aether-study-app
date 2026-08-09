/**
 * Hand-authored content for scripts/seedDemo.ts.
 *
 * Kept separate from the seeding logic itself so the two are easy to tell
 * apart: this file is just data (real-sounding study material — actual
 * textbook-level facts, not lorem ipsum or "settheory_Ashlock"-style
 * placeholder titles), the seed script is the part that writes it to Mongo,
 * ties it to users, and tags everything for teardown.
 *
 * No AI calls here on purpose — a demo mode that needs a live model endpoint
 * to build its own fixtures would defeat "record locally without depending
 * on the remote socket server."
 */

export interface DemoFlashcard {
  question: string;
  answer: string;
}

export interface DemoQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface DemoMaterialSpec {
  title: string;
  type: 'note' | 'pdf' | 'article' | 'unified' | 'youtube';
  category: string;
  summary: string;
  keyTopics: string[];
  detailedNotes: string;
  flashcards: DemoFlashcard[];
  quizQuestions: DemoQuizQuestion[];
  /** Mastery / progress shown on the Library card, 0-100. */
  progress: number;
  /** How far back to backdate createdAt, so the library looks lived-in
   *  rather than everything appearing in the same second. */
  daysAgo: number;
  /** Also surfaced on Community/Explore under a varied author name. */
  isPublic?: boolean;
  authorName?: string;
}

export const DEMO_MATERIALS: DemoMaterialSpec[] = [
  // ---- Biology ----
  {
    title: 'Cell Structure & Organelles',
    type: 'note',
    category: 'Biology',
    summary: 'The organelles that make up eukaryotic cells, what each one does, and how they work together to keep the cell alive.',
    keyTopics: ['Mitochondria', 'Nucleus', 'Endoplasmic reticulum', 'Golgi apparatus', 'Cell membrane'],
    detailedNotes:
      'Eukaryotic cells are organized into membrane-bound compartments, each specialized for a task. The nucleus houses ' +
      'DNA and controls gene expression via transcription. Mitochondria generate ATP through oxidative phosphorylation — ' +
      'often called the "powerhouse of the cell" for good reason, since a single active cell can hold thousands of them. ' +
      'The rough endoplasmic reticulum, studded with ribosomes, synthesizes proteins destined for secretion or membranes, ' +
      'while the smooth ER handles lipid synthesis and detoxification. The Golgi apparatus modifies, sorts, and packages ' +
      'these proteins into vesicles for delivery. Lysosomes break down waste and cellular debris using acid hydrolases. ' +
      'Together, this internal division of labor is what lets a single cell run thousands of chemical reactions at once ' +
      'without them interfering with each other.',
    flashcards: [
      { question: 'What is the main function of mitochondria?', answer: 'Producing ATP through oxidative phosphorylation — the cell\'s primary energy currency.' },
      { question: 'What distinguishes rough ER from smooth ER?', answer: 'Rough ER is studded with ribosomes and makes proteins; smooth ER lacks ribosomes and handles lipid synthesis and detox.' },
      { question: 'What do lysosomes do?', answer: 'Break down waste, debris, and worn-out organelles using acid hydrolase enzymes.' }
    ],
    quizQuestions: [
      { question: 'Which organelle is primarily responsible for ATP production?', options: ['Golgi apparatus', 'Mitochondria', 'Lysosome', 'Nucleus'], correctAnswer: 1, explanation: 'Mitochondria carry out oxidative phosphorylation, the main source of cellular ATP.' },
      { question: 'The Golgi apparatus is best described as the cell\'s:', options: ['Waste disposal system', 'Energy factory', 'Shipping and sorting center', 'Genetic library'], correctAnswer: 2, explanation: 'The Golgi modifies and packages proteins from the ER, then routes them to their destinations.' },
      { question: 'Ribosomes attached to the ER make it:', options: ['Smooth ER', 'Rough ER', 'Golgi body', 'Peroxisome'], correctAnswer: 1, explanation: 'The studded appearance under a microscope is literally where "rough" ER gets its name.' }
    ],
    progress: 88,
    daysAgo: 6
  },
  {
    title: 'Photosynthesis: Light & Dark Reactions',
    type: 'article',
    category: 'Biology',
    summary: 'How plants convert light energy into chemical energy, from the thylakoid membrane through to the Calvin cycle.',
    keyTopics: ['Thylakoid', 'Calvin cycle', 'Chlorophyll', 'ATP synthase', 'Carbon fixation'],
    detailedNotes:
      'Photosynthesis happens in two linked stages. The light-dependent reactions occur across the thylakoid membrane: ' +
      'chlorophyll absorbs photons, exciting electrons that pass down an electron transport chain, pumping protons into ' +
      'the thylakoid lumen and driving ATP synthase to produce ATP, while NADP+ is reduced to NADPH. Water is split to ' +
      'replace the electrons chlorophyll loses, releasing oxygen as a byproduct. The light-independent reactions (the ' +
      'Calvin cycle) then use that ATP and NADPH in the stroma to fix atmospheric CO2 into organic molecules via the ' +
      'enzyme RuBisCO, eventually producing glucose. The two stages are tightly coupled — the Calvin cycle cannot run ' +
      'without the energy carriers the light reactions supply, which is why photosynthesis stalls without light even ' +
      'though carbon fixation itself uses no photons directly.',
    flashcards: [
      { question: 'Where do the light-dependent reactions take place?', answer: 'Across the thylakoid membrane inside the chloroplast.' },
      { question: 'What enzyme fixes CO2 in the Calvin cycle?', answer: 'RuBisCO.' },
      { question: 'What byproduct is released when water is split during the light reactions?', answer: 'Oxygen.' }
    ],
    quizQuestions: [
      { question: 'The Calvin cycle takes place in the:', options: ['Thylakoid lumen', 'Stroma', 'Mitochondrial matrix', 'Cytoplasm'], correctAnswer: 1, explanation: 'Carbon fixation happens in the stroma, the fluid surrounding the thylakoids.' },
      { question: 'What are the two main products of the light-dependent reactions?', options: ['Glucose and oxygen', 'ATP and NADPH', 'CO2 and water', 'Starch and ADP'], correctAnswer: 1, explanation: 'ATP and NADPH are the energy carriers passed to the Calvin cycle.' },
      { question: 'RuBisCO\'s job is to:', options: ['Split water molecules', 'Fix atmospheric CO2 into organic carbon', 'Pump protons across the membrane', 'Absorb photons'], correctAnswer: 1, explanation: 'RuBisCO catalyzes the first step of carbon fixation in the Calvin cycle.' }
    ],
    progress: 62,
    daysAgo: 14,
    isPublic: true
  },

  // ---- Chemistry ----
  {
    title: 'Organic Chemistry: Functional Groups',
    type: 'note',
    category: 'Chemistry',
    summary: 'A working reference for identifying alcohols, ketones, carboxylic acids, and other common functional groups by structure and reactivity.',
    keyTopics: ['Hydroxyl group', 'Carbonyl', 'Carboxylic acid', 'Amine', 'Ester'],
    detailedNotes:
      'Functional groups are the reactive parts of an organic molecule that determine its chemical behavior, independent ' +
      'of the rest of the carbon skeleton. A hydroxyl group (-OH) makes a compound an alcohol, capable of hydrogen ' +
      'bonding and mild acidity. A carbonyl (C=O) appears in both aldehydes (terminal) and ketones (internal), both ' +
      'electrophilic at the carbon. Combine a carbonyl with a hydroxyl on the same carbon and you get a carboxylic ' +
      'acid, notably more acidic than an alcohol because the resulting carboxylate anion is resonance-stabilized across ' +
      'both oxygens. Esters form when a carboxylic acid reacts with an alcohol, releasing water — the reverse reaction, ' +
      'hydrolysis, is how soaps and fats are broken down. Amines, the nitrogen analog of alcohols, are basic rather than ' +
      'acidic because nitrogen\'s lone pair is readily available to accept a proton.',
    flashcards: [
      { question: 'What functional group defines an alcohol?', answer: 'A hydroxyl group, -OH.' },
      { question: 'Why are carboxylic acids more acidic than alcohols?', answer: 'The conjugate base (carboxylate) is resonance-stabilized across two oxygens, spreading the negative charge.' },
      { question: 'What two groups combine to form an ester, and what byproduct is released?', answer: 'A carboxylic acid and an alcohol combine, releasing water.' }
    ],
    quizQuestions: [
      { question: 'A ketone\'s carbonyl group is located:', options: ['At the end of the carbon chain', 'Between two carbon atoms internally', 'Only on aromatic rings', 'Attached to nitrogen'], correctAnswer: 1, explanation: 'Ketones have the C=O internally, distinguishing them from aldehydes, where it\'s terminal.' },
      { question: 'Amines are generally:', options: ['Strongly acidic', 'Basic', 'Neutral and unreactive', 'Only found in proteins'], correctAnswer: 1, explanation: 'Nitrogen\'s lone pair makes amines proton acceptors, i.e. bases.' },
      { question: 'Breaking an ester back into an acid and an alcohol with water is called:', options: ['Esterification', 'Hydrolysis', 'Oxidation', 'Substitution'], correctAnswer: 1, explanation: 'Hydrolysis is literally "water-splitting" — the reverse of the condensation reaction that formed the ester.' }
    ],
    progress: 45,
    daysAgo: 3
  },
  {
    title: 'Balancing Redox Reactions',
    type: 'note',
    category: 'Chemistry',
    summary: 'Step-by-step method for balancing oxidation-reduction equations using the half-reaction method, including in acidic and basic solution.',
    keyTopics: ['Oxidation number', 'Half-reactions', 'Electron transfer', 'Balancing in acid vs base'],
    detailedNotes:
      'Redox reactions involve electron transfer: one species is oxidized (loses electrons, oxidation number increases) ' +
      'and another is reduced (gains electrons, oxidation number decreases). The half-reaction method splits the overall ' +
      'equation into an oxidation half and a reduction half, balances atoms other than O and H first, then balances ' +
      'oxygen with H2O and hydrogen with H+ (in acidic solution), and finally balances charge by adding electrons to ' +
      'each half-reaction. The two half-reactions are then scaled so the electrons lost equal the electrons gained ' +
      'before being added back together, with the electrons canceling out. For basic solution, the same process is ' +
      'used and then OH- is added to both sides to neutralize any leftover H+, combining pairs into water.',
    flashcards: [
      { question: 'What happens to a species that is oxidized?', answer: 'It loses electrons and its oxidation number increases.' },
      { question: 'In the half-reaction method, how is oxygen balanced (acidic solution)?', answer: 'By adding H2O to the side that needs oxygen.' },
      { question: 'How do you convert a balanced acidic half-reaction to basic solution?', answer: 'Add OH- to both sides to neutralize the H+, combining them into H2O.' }
    ],
    quizQuestions: [
      { question: 'Reduction is defined as:', options: ['Loss of electrons', 'Gain of electrons', 'Loss of protons', 'Gain of oxygen only'], correctAnswer: 1, explanation: '"OIL RIG": Oxidation Is Loss, Reduction Is Gain (of electrons).' },
      { question: 'In the half-reaction method, hydrogen is balanced (in acid) using:', options: ['OH-', 'H2O', 'H+', 'O2'], correctAnswer: 2, explanation: 'H+ ions are added to balance hydrogen atoms in acidic solution.' },
      { question: 'Before combining two half-reactions, you must first:', options: ['Balance charge only', 'Scale them so electrons lost equal electrons gained', 'Add water to both sides', 'Ignore oxidation numbers'], correctAnswer: 1, explanation: 'Electrons must cancel exactly when the half-reactions are added, so each is scaled by the right integer multiplier first.' }
    ],
    progress: 30,
    daysAgo: 1
  },

  // ---- World History ----
  {
    title: 'The French Revolution: Causes & Consequences',
    type: 'unified',
    category: 'History',
    summary: 'The financial, social, and ideological pressures that triggered 1789, and how the revolution reshaped France and Europe.',
    keyTopics: ['Estates-General', 'Storming of the Bastille', 'Reign of Terror', 'Napoleon', 'Declaration of the Rights of Man'],
    detailedNotes:
      'By the late 1780s, France was near bankruptcy after supporting the American Revolution and decades of lavish ' +
      'royal spending, while the tax burden fell almost entirely on the Third Estate — commoners who made up over 95% ' +
      'of the population but had no proportional political voice. When Louis XVI convened the Estates-General in 1789 ' +
      'to address the crisis, the Third Estate broke away to form the National Assembly, and popular unrest culminated ' +
      'in the storming of the Bastille on July 14. The revolution radicalized over the next several years: the monarchy ' +
      'was abolished, Louis XVI was executed in 1793, and the Committee of Public Safety under Robespierre launched the ' +
      'Reign of Terror, executing tens of thousands of perceived enemies of the revolution. The instability that ' +
      'followed created an opening for Napoleon Bonaparte, who seized power in 1799 and eventually crowned himself ' +
      'Emperor — ending the republican phase but cementing many of the revolution\'s legal and administrative reforms ' +
      'across the territories he conquered.',
    flashcards: [
      { question: 'What event on July 14, 1789 became a symbol of the revolution?', answer: 'The storming of the Bastille.' },
      { question: 'Who led the Committee of Public Safety during the Reign of Terror?', answer: 'Maximilien Robespierre.' },
      { question: 'Who eventually seized power and ended the republican phase in 1799?', answer: 'Napoleon Bonaparte.' }
    ],
    quizQuestions: [
      { question: 'The Third Estate represented roughly what share of France\'s population?', options: ['About 10%', 'About 50%', 'Over 95%', 'Exactly 33%'], correctAnswer: 2, explanation: 'The Third Estate (commoners) vastly outnumbered the clergy and nobility combined.' },
      { question: 'The Reign of Terror was primarily driven by:', options: ['The National Assembly', 'The Committee of Public Safety', 'The monarchy', 'Napoleon\'s army'], correctAnswer: 1, explanation: 'The Committee, dominated by Robespierre, directed the mass executions of 1793-94.' },
      { question: 'What immediate financial pressure contributed to the crisis?', options: ['A famine in Germany', 'Debt from supporting the American Revolution', 'Loss of colonial trade with Spain', 'A currency collapse in England'], correctAnswer: 1, explanation: 'France\'s support of the American Revolution left the crown deeply in debt.' }
    ],
    progress: 95,
    daysAgo: 22,
    isPublic: true
  },
  {
    title: 'The Silk Road: Trade & Cultural Exchange',
    type: 'article',
    category: 'History',
    summary: 'How the network of overland and maritime trade routes connecting China to the Mediterranean shaped economies, religion, and disease spread for over a millennium.',
    keyTopics: ['Trans-Eurasian trade', 'Buddhism\'s spread', 'Marco Polo', 'Black Death transmission'],
    detailedNotes:
      'The Silk Road was never a single road but a shifting web of overland and sea routes linking China, Central Asia, ' +
      'the Middle East, and Europe from roughly the 2nd century BCE through the 14th century. Goods moved both ' +
      'directions — silk and porcelain westward, glassware, wool, and precious metals eastward — but the more lasting ' +
      'legacy was cultural: Buddhism spread from India into China along these routes, and later Islam moved eastward ' +
      'into Central Asia. The routes also carried disease: the Mongol-controlled trade network of the 14th century is ' +
      'widely credited with helping spread the bubonic plague from Central Asia into Europe, contributing to the Black ' +
      'Death. European awareness of the wider trade network grew significantly after Marco Polo\'s travels and his ' +
      'account of the Mongol court, published in the late 13th century, which fueled European interest in reaching Asia ' +
      'directly by sea — motivation that would eventually drive the Age of Exploration.',
    flashcards: [
      { question: 'Roughly what time span did the Silk Road operate over?', answer: 'From about the 2nd century BCE through the 14th century CE.' },
      { question: 'Which religion spread from India into China via the Silk Road?', answer: 'Buddhism.' },
      { question: 'What disease is linked to Mongol-era Silk Road trade routes?', answer: 'The bubonic plague (Black Death).' }
    ],
    quizQuestions: [
      { question: 'The Silk Road is best described as:', options: ['A single paved highway', 'A network of overland and sea trade routes', 'A purely maritime route', 'A 19th-century railway'], correctAnswer: 1, explanation: 'It was a shifting web of multiple routes, not one continuous road.' },
      { question: 'Marco Polo\'s account of his travels most directly:', options: ['Ended Mongol rule in China', 'Fueled European interest in reaching Asia by sea', 'Introduced silk to China', 'Caused the Black Death'], correctAnswer: 1, explanation: 'His writings helped inspire the later Age of Exploration.' },
      { question: 'Which of these commonly moved eastward along the Silk Road toward China?', options: ['Silk', 'Porcelain', 'Glassware and wool', 'Tea'], correctAnswer: 2, explanation: 'Silk and porcelain flowed west out of China; glassware, wool, and metals flowed east.' }
    ],
    progress: 51,
    daysAgo: 30
  },

  // ---- Computer Science ----
  {
    title: 'Big-O Notation & Algorithm Complexity',
    type: 'note',
    category: 'Computer Science',
    summary: 'How to reason about an algorithm\'s time and space efficiency as input size grows, and how to classify common patterns.',
    keyTopics: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)'],
    detailedNotes:
      'Big-O notation describes how an algorithm\'s running time (or memory use) scales as the input size n grows, ' +
      'ignoring constant factors and lower-order terms — what matters is the dominant term for large n. O(1) means ' +
      'constant time, unaffected by input size, like accessing an array element by index. O(log n) shows up in ' +
      'algorithms that repeatedly halve the problem, like binary search. O(n) is linear — a single pass through the ' +
      'data, like a simple loop. O(n log n) is the complexity of efficient comparison-based sorts like merge sort and ' +
      'quicksort (average case). O(n^2) appears in naive approaches with nested loops over the same data, like bubble ' +
      'sort. Understanding these classes matters practically: an O(n^2) algorithm that\'s fine for 100 items can become ' +
      'unusably slow at 100,000 — the difference between milliseconds and hours.',
    flashcards: [
      { question: 'What is the time complexity of binary search?', answer: 'O(log n) — each step halves the remaining search space.' },
      { question: 'What complexity class does merge sort fall into?', answer: 'O(n log n).' },
      { question: 'Why does Big-O ignore constant factors?', answer: 'Because for large enough n, the dominant term determines growth rate, making constants irrelevant to the algorithm\'s scaling behavior.' }
    ],
    quizQuestions: [
      { question: 'An algorithm that loops through an n-item list once is:', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correctAnswer: 2, explanation: 'A single pass over n items is linear time, O(n).' },
      { question: 'Nested loops both iterating over the same n items typically give:', options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'], correctAnswer: 2, explanation: 'Each of the n outer iterations does n inner iterations: n × n = O(n^2).' },
      { question: 'Which complexity is considered "constant time"?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'], correctAnswer: 1, explanation: 'O(1) operations take the same time regardless of input size.' }
    ],
    progress: 79,
    daysAgo: 8,
    isPublic: true
  },
  {
    title: 'SQL Joins Explained',
    type: 'note',
    category: 'Computer Science',
    summary: 'INNER, LEFT, RIGHT, and FULL OUTER joins, with the mental model for what rows each one keeps.',
    keyTopics: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'Foreign keys'],
    detailedNotes:
      'Joins combine rows from two or more tables based on a related column, usually a foreign key. An INNER JOIN ' +
      'returns only rows where the join condition matches in both tables — anything unmatched on either side is ' +
      'dropped. A LEFT JOIN keeps every row from the left table regardless of a match, filling unmatched right-side ' +
      'columns with NULL — useful when you want "all customers, and their orders if any exist." A RIGHT JOIN is the ' +
      'mirror image, keeping every row from the right table. A FULL OUTER JOIN keeps everything from both tables, ' +
      'filling NULLs wherever there\'s no match on either side — effectively a LEFT JOIN and RIGHT JOIN combined, with ' +
      'duplicates removed. Choosing the right join type is mostly about deciding which side\'s "no match" rows you ' +
      'still need to see in the result.',
    flashcards: [
      { question: 'What rows does an INNER JOIN return?', answer: 'Only rows where the join condition matches in both tables.' },
      { question: 'A LEFT JOIN keeps all rows from which table?', answer: 'The left (first-listed) table, filling unmatched right-side columns with NULL.' },
      { question: 'What does a FULL OUTER JOIN return?', answer: 'All rows from both tables, with NULLs where there\'s no match on either side.' }
    ],
    quizQuestions: [
      { question: 'You want "all customers, including those with zero orders." Which join?', options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'None of these'], correctAnswer: 1, explanation: 'A LEFT JOIN keeps every customer row even when there\'s no matching order.' },
      { question: 'Unmatched rows in an INNER JOIN are:', options: ['Filled with NULL', 'Dropped entirely', 'Duplicated', 'Kept as zero'], correctAnswer: 1, explanation: 'INNER JOIN only keeps rows with a match on both sides; everything else is excluded.' },
      { question: 'A RIGHT JOIN is the mirror image of a:', options: ['FULL OUTER JOIN', 'LEFT JOIN', 'INNER JOIN', 'CROSS JOIN'], correctAnswer: 1, explanation: 'RIGHT JOIN keeps all right-table rows the same way LEFT JOIN keeps all left-table rows.' }
    ],
    progress: 40,
    daysAgo: 2
  },

  // ---- Calculus ----
  {
    title: 'Derivatives: Rules & Applications',
    type: 'note',
    category: 'Calculus',
    summary: 'The power, product, quotient, and chain rules, plus how derivatives describe rates of change and slopes of tangent lines.',
    keyTopics: ['Power rule', 'Product rule', 'Chain rule', 'Related rates', 'Critical points'],
    detailedNotes:
      'A derivative measures instantaneous rate of change — geometrically, the slope of the tangent line to a curve at ' +
      'a point. The power rule, d/dx[x^n] = n·x^(n-1), handles polynomial terms directly. For products of functions, ' +
      'the product rule states d/dx[fg] = f\'g + fg\'. For a function divided by another, the quotient rule applies. ' +
      'The chain rule, d/dx[f(g(x))] = f\'(g(x))·g\'(x), handles composite functions and is arguably the most-used rule ' +
      'in practice, since so many real functions are compositions. Once you can differentiate, critical points — where ' +
      'the derivative is zero or undefined — mark potential local maxima, minima, or inflection points, found by the ' +
      'first and second derivative tests. Related rates problems apply the chain rule to physical situations, like how ' +
      'fast a shadow lengthens as a person walks away from a streetlight.',
    flashcards: [
      { question: 'State the power rule.', answer: 'd/dx[x^n] = n·x^(n-1).' },
      { question: 'What does the chain rule handle?', answer: 'Derivatives of composite functions: d/dx[f(g(x))] = f\'(g(x))·g\'(x).' },
      { question: 'What do critical points indicate?', answer: 'Points where the derivative is zero or undefined — candidates for local maxima, minima, or inflection points.' }
    ],
    quizQuestions: [
      { question: 'The derivative of x^5 is:', options: ['5x^4', 'x^4', '5x^6', '4x^5'], correctAnswer: 0, explanation: 'By the power rule: bring down the exponent, subtract 1 from it. 5x^(5-1) = 5x^4.' },
      { question: 'Which rule is needed to differentiate sin(x^2)?', options: ['Power rule alone', 'Product rule', 'Chain rule', 'Quotient rule'], correctAnswer: 2, explanation: 'sin(x^2) is a composition of sin(u) and u = x^2, requiring the chain rule.' },
      { question: 'A derivative geometrically represents:', options: ['The area under a curve', 'The slope of the tangent line at a point', 'The y-intercept', 'The average of two points'], correctAnswer: 1, explanation: 'The derivative gives instantaneous slope, i.e. the tangent line\'s slope at that exact point.' }
    ],
    progress: 68,
    daysAgo: 5
  },
  {
    title: 'Integration Techniques',
    type: 'note',
    category: 'Calculus',
    summary: 'U-substitution, integration by parts, and when to reach for each technique.',
    keyTopics: ['U-substitution', 'Integration by parts', 'Definite vs indefinite integrals', 'Fundamental theorem of calculus'],
    detailedNotes:
      'Integration reverses differentiation, and the Fundamental Theorem of Calculus links the two: the definite ' +
      'integral of a function over [a,b] equals F(b) - F(a), where F is any antiderivative. U-substitution is the most ' +
      'common technique for indefinite integrals, useful when the integrand contains a function and something ' +
      'proportional to its derivative — substituting u for the inner function turns a complex integral into a simple ' +
      'one. Integration by parts, derived from the product rule, handles integrals of products of functions: ' +
      '∫u dv = uv - ∫v du. Choosing which factor is u (typically the one that simplifies when differentiated) and which ' +
      'is dv (the one that\'s easy to integrate) is the main skill to develop. Definite integrals produce a number — ' +
      'often interpreted as a signed area under a curve — while indefinite integrals produce a family of functions ' +
      'differing by a constant, +C.',
    flashcards: [
      { question: 'What does the Fundamental Theorem of Calculus connect?', answer: 'Differentiation and integration — the definite integral of f over [a,b] equals F(b) - F(a) for any antiderivative F.' },
      { question: 'When is u-substitution most useful?', answer: 'When the integrand contains a function and something proportional to its derivative.' },
      { question: 'State the integration by parts formula.', answer: '∫u dv = uv - ∫v du.' }
    ],
    quizQuestions: [
      { question: 'A definite integral evaluates to:', options: ['A family of functions', 'A single number', 'An undefined expression', 'A derivative'], correctAnswer: 1, explanation: 'Definite integrals, unlike indefinite ones, produce a specific numeric value.' },
      { question: 'Integration by parts is derived from the:', options: ['Chain rule', 'Product rule', 'Power rule', 'Quotient rule'], correctAnswer: 1, explanation: 'Rearranging d(uv) = u dv + v du gives the integration by parts formula.' },
      { question: 'The "+C" in an indefinite integral accounts for:', options: ['A rounding error', 'The constant of integration, since derivatives of constants are 0', 'A typo convention', 'The upper bound'], correctAnswer: 1, explanation: 'Any constant added to an antiderivative still differentiates back to the original function, so +C covers that whole family.' }
    ],
    progress: 35,
    daysAgo: 4
  },

  // ---- Literature ----
  {
    title: 'Shakespearean Tragedy: Key Conventions',
    type: 'article',
    category: 'Literature',
    summary: 'The recurring structural and thematic elements across Hamlet, Macbeth, Othello, and King Lear.',
    keyTopics: ['Tragic hero', 'Hamartia', 'Catharsis', 'Comic relief', 'Soliloquy'],
    detailedNotes:
      'Shakespeare\'s major tragedies share a recognizable structure inherited partly from Aristotle. The tragic hero is ' +
      'a figure of high status whose downfall stems from a hamartia — a fatal flaw or error in judgment — rather than ' +
      'pure external bad luck: Hamlet\'s indecision, Macbeth\'s ambition, Othello\'s jealousy, Lear\'s pride. The plays ' +
      'build toward catharsis, an emotional release for the audience through pity and fear as the hero\'s fate unfolds. ' +
      'Soliloquies — a character speaking their inner thoughts alone on stage — are Shakespeare\'s primary tool for ' +
      'revealing motivation directly to the audience, most famously Hamlet\'s "To be, or not to be." Comic relief, like ' +
      'the Porter scene in Macbeth, briefly lightens the tension without undercutting the overall tragic arc, often by ' +
      'contrast making the surrounding darkness feel heavier.',
    flashcards: [
      { question: 'What is a hamartia?', answer: 'A fatal flaw or error in judgment that drives the tragic hero\'s downfall.' },
      { question: 'What literary device lets a character reveal inner thoughts alone on stage?', answer: 'A soliloquy.' },
      { question: 'What purpose does comic relief serve in a Shakespearean tragedy?', answer: 'It briefly lightens tension, often making the surrounding darkness feel heavier by contrast.' }
    ],
    quizQuestions: [
      { question: 'Macbeth\'s hamartia is generally identified as:', options: ['Indecision', 'Ambition', 'Jealousy', 'Pride'], correctAnswer: 1, explanation: 'Macbeth\'s unchecked ambition drives him toward regicide and his eventual downfall.' },
      { question: 'Catharsis refers to:', options: ['A plot twist', 'The audience\'s emotional release through pity and fear', 'A character\'s comic subplot', 'The play\'s setting'], correctAnswer: 1, explanation: 'Aristotle described catharsis as the purging of emotion the audience experiences watching tragedy unfold.' },
      { question: 'Which of these is a famous Shakespearean soliloquy?', options: ['"To be, or not to be"', 'The Porter scene', 'The witches\' opening chant', 'The final duel in Hamlet'], correctAnswer: 0, explanation: 'Hamlet delivers this alone on stage, directly revealing his inner turmoil to the audience.' }
    ],
    progress: 72,
    daysAgo: 18,
    isPublic: true
  },
  {
    title: 'Narrative Point of View',
    type: 'note',
    category: 'Literature',
    summary: 'First person, third person limited, and omniscient narration — what each reveals and conceals, and why authors choose one over another.',
    keyTopics: ['First-person narrator', 'Third-person limited', 'Omniscient narrator', 'Unreliable narrator'],
    detailedNotes:
      'Point of view shapes what a reader can know and trust. A first-person narrator ("I") gives intimate access to ' +
      'one character\'s thoughts but is inherently limited — and sometimes unreliable, either through deception, bias, ' +
      'or simple lack of information, as with the narrator in The Great Gatsby or Huckleberry Finn. Third-person ' +
      'limited follows one character closely ("he/she") without full access to others\' inner thoughts, striking a ' +
      'balance between intimacy and narrative flexibility. An omniscient narrator can move between characters\' minds ' +
      'and reveal information no single character knows, useful for dramatic irony — letting readers know something a ' +
      'character doesn\'t. The choice of narration isn\'t neutral: it controls suspense, sympathy, and how much the ' +
      'reader has to infer versus being told outright.',
    flashcards: [
      { question: 'What makes a first-person narrator potentially unreliable?', answer: 'Their account is limited to what they personally know, and may be shaped by bias, deception, or incomplete information.' },
      { question: 'What can an omniscient narrator do that a limited one cannot?', answer: 'Move between multiple characters\' minds and reveal information no single character knows.' },
      { question: 'What narrative technique lets the reader know something a character doesn\'t?', answer: 'Dramatic irony, often enabled by an omniscient point of view.' }
    ],
    quizQuestions: [
      { question: 'A narrator who reports events using "I" is writing in:', options: ['Third-person omniscient', 'First person', 'Second person', 'Third-person limited'], correctAnswer: 1, explanation: 'First-person narration uses "I," giving direct but limited access to one character\'s perspective.' },
      { question: 'Third-person limited narration follows:', options: ['Every character equally', 'One character closely, without full access to others\' thoughts', 'No characters, only setting', 'The reader directly'], correctAnswer: 1, explanation: 'It sticks close to one character\'s perspective while still using "he/she" rather than "I."' },
      { question: 'Dramatic irony is most easily created through which point of view?', options: ['First person', 'Second person', 'Omniscient', 'None — it requires no particular POV'], correctAnswer: 2, explanation: 'An omniscient narrator can reveal information to the reader that individual characters don\'t have.' }
    ],
    progress: 55,
    daysAgo: 11
  },

  // ---- Psychology ----
  {
    title: 'Classical vs Operant Conditioning',
    type: 'note',
    category: 'Psychology',
    summary: 'The core difference between Pavlov\'s associative learning and Skinner\'s reinforcement-based learning, with real examples of each.',
    keyTopics: ['Pavlov', 'Skinner', 'Reinforcement', 'Punishment', 'Extinction'],
    detailedNotes:
      'Classical conditioning, demonstrated by Pavlov, involves learning through association: a neutral stimulus (a ' +
      'bell) paired repeatedly with an unconditioned stimulus (food) eventually triggers the same response (salivation) ' +
      'on its own, becoming a conditioned stimulus. The learner is largely passive — the association forms regardless ' +
      'of any action taken. Operant conditioning, developed by Skinner, is about learning through consequences: ' +
      'behaviors followed by reinforcement (positive: adding something desirable, or negative: removing something ' +
      'aversive) become more likely, while behaviors followed by punishment become less likely. Unlike classical ' +
      'conditioning, the learner is active — they\'re operating on their environment. Extinction can occur in both: in ' +
      'classical conditioning, repeatedly presenting the conditioned stimulus without the unconditioned stimulus weakens ' +
      'the response; in operant conditioning, removing reinforcement for a behavior eventually reduces its frequency.',
    flashcards: [
      { question: 'In Pavlov\'s experiment, what did the bell become after repeated pairing with food?', answer: 'A conditioned stimulus, capable of triggering salivation on its own.' },
      { question: 'What is negative reinforcement?', answer: 'Removing an aversive stimulus to increase the likelihood of a behavior (not the same as punishment).' },
      { question: 'What is the key difference between classical and operant conditioning?', answer: 'Classical conditioning is passive association-based learning; operant conditioning is active, consequence-based learning.' }
    ],
    quizQuestions: [
      { question: 'Operant conditioning was primarily developed by:', options: ['Ivan Pavlov', 'B.F. Skinner', 'Sigmund Freud', 'Jean Piaget'], correctAnswer: 1, explanation: 'Skinner formalized operant conditioning through his work on reinforcement schedules.' },
      { question: 'Negative reinforcement differs from punishment because it:', options: ['Always involves pain', 'Increases a behavior by removing something aversive', 'Decreases a behavior', 'Only applies to animals'], correctAnswer: 1, explanation: 'Negative reinforcement still aims to increase behavior — by removing an unpleasant stimulus, not adding a consequence.' },
      { question: 'In classical conditioning, extinction occurs when:', options: ['Reinforcement is removed', 'The conditioned stimulus is repeatedly presented without the unconditioned stimulus', 'The subject is punished', 'A new stimulus is introduced'], correctAnswer: 1, explanation: 'Without the pairing being reinforced by the unconditioned stimulus, the learned association weakens over time.' }
    ],
    progress: 82,
    daysAgo: 25,
    isPublic: true
  },
  {
    title: 'Cognitive Biases in Decision-Making',
    type: 'article',
    category: 'Psychology',
    summary: 'Confirmation bias, anchoring, and availability heuristic — how predictable mental shortcuts distort judgment.',
    keyTopics: ['Confirmation bias', 'Anchoring effect', 'Availability heuristic', 'Loss aversion'],
    detailedNotes:
      'Cognitive biases are systematic patterns of deviation from rational judgment, and they show up predictably across ' +
      'people rather than being random errors. Confirmation bias is the tendency to seek out and favor information that ' +
      'confirms existing beliefs while discounting contradictory evidence. The anchoring effect describes how an ' +
      'initial piece of information (even an arbitrary one) disproportionately influences subsequent judgments — the ' +
      'classic demonstration involves asking people to estimate a value after being shown an unrelated random number ' +
      'first. The availability heuristic leads people to overestimate the likelihood of events that are easier to recall, ' +
      'often because they\'re vivid or recent (like overestimating shark attack risk after seeing news coverage). Loss ' +
      'aversion, from Kahneman and Tversky\'s prospect theory, describes how losses are felt roughly twice as intensely ' +
      'as equivalent gains — which explains a lot of otherwise irrational risk-avoidance behavior.',
    flashcards: [
      { question: 'What is confirmation bias?', answer: 'The tendency to seek and favor information that confirms existing beliefs while discounting contradictory evidence.' },
      { question: 'What is the anchoring effect?', answer: 'The tendency for an initial piece of information to disproportionately influence subsequent judgments, even if arbitrary.' },
      { question: 'According to loss aversion, how do losses feel relative to equivalent gains?', answer: 'Roughly twice as intense — losses are felt more strongly than the pleasure of an equivalent gain.' }
    ],
    quizQuestions: [
      { question: 'Overestimating shark attacks after heavy news coverage is an example of:', options: ['Anchoring effect', 'Availability heuristic', 'Confirmation bias', 'Loss aversion'], correctAnswer: 1, explanation: 'Vivid, recent, easily-recalled events feel more probable than they statistically are — that\'s the availability heuristic.' },
      { question: 'Loss aversion comes from whose research?', options: ['Pavlov and Skinner', 'Kahneman and Tversky', 'Freud and Jung', 'Piaget and Vygotsky'], correctAnswer: 1, explanation: 'Loss aversion is a core finding of Kahneman and Tversky\'s prospect theory.' },
      { question: 'Confirmation bias primarily affects:', options: ['Memory formation only', 'How people seek and interpret evidence', 'Motor skill learning', 'Sensory perception thresholds'], correctAnswer: 1, explanation: 'It shapes what information people look for and how they weigh it once found.' }
    ],
    progress: 20,
    daysAgo: 1
  },

  // ---- Spanish ----
  {
    title: 'Spanish Subjunctive Mood: Core Triggers',
    type: 'note',
    category: 'Spanish',
    summary: 'When to switch from indicative to subjunctive — doubt, desire, emotion, and impersonal expressions — with example sentences.',
    keyTopics: ['WEIRDO triggers', 'Present subjunctive conjugation', 'Ojalá', 'Dudo que'],
    detailedNotes:
      'The subjunctive mood in Spanish expresses subjectivity — doubt, desire, emotion, recommendations, or ' +
      'hypotheticals — rather than objective fact. A common mnemonic for its triggers is WEIRDO: Wishes ("Quiero que ' +
      'vengas"), Emotions ("Me alegra que estés aquí"), Impersonal expressions ("Es importante que estudies"), ' +
      'Recommendations ("Te sugiero que descanses"), Doubt/Denial ("Dudo que sea verdad"), and Ojalá ("Ojalá que ' +
      'llueva"). Crucially, the subjunctive typically appears in a subordinate clause introduced by "que," following a ' +
      'main clause that expresses one of these triggers, and usually requires a change of subject between the two ' +
      'clauses. Present subjunctive conjugation flips the usual vowel: -ar verbs take -e endings (hable, hables, hable...) ' +
      'while -er/-ir verbs take -a endings (coma, comas, coma...) — essentially the "opposite vowel" from indicative.',
    flashcards: [
      { question: 'What does the WEIRDO mnemonic stand for?', answer: 'Wishes, Emotions, Impersonal expressions, Recommendations, Doubt/Denial, Ojalá.' },
      { question: 'How do -ar verbs change their vowel in the present subjunctive?', answer: 'They switch to -e endings (e.g. hablar → hable, hables, hable...).' },
      { question: 'What word is almost always required for the subjunctive to trigger?', answer: '"Que," introducing the subordinate clause.' }
    ],
    quizQuestions: [
      { question: '"Dudo que él ___ la verdad" — which form is correct?', options: ['dice', 'diga', 'dijo', 'decir'], correctAnswer: 1, explanation: '"Dudo que" expresses doubt, triggering the subjunctive: diga.' },
      { question: 'Which of these is NOT a WEIRDO trigger category?', options: ['Wishes', 'Facts stated with certainty', 'Emotions', 'Doubt/Denial'], correctAnswer: 1, explanation: 'Statements of certainty use the indicative, not the subjunctive.' },
      { question: '-er and -ir verbs in the present subjunctive typically end in:', options: ['-e', '-a', '-o', '-ió'], correctAnswer: 1, explanation: 'They flip to -a endings, the opposite of their usual indicative -e endings.' }
    ],
    progress: 58,
    daysAgo: 9
  },
  {
    title: 'Ser vs Estar: When to Use Each',
    type: 'note',
    category: 'Spanish',
    summary: 'The permanent-vs-temporary heuristic for choosing between Spanish\'s two "to be" verbs, plus the exceptions worth memorizing separately.',
    keyTopics: ['Ser', 'Estar', 'Location', 'Characteristics vs conditions'],
    detailedNotes:
      'Spanish splits "to be" into ser and estar, and the traditional shorthand is permanent vs. temporary — but that ' +
      'rule has enough exceptions that it\'s worth learning the actual categories directly. Ser is used for identity, ' +
      'characteristics, origin, profession, time, and material ("Soy estudiante," "Es de México," "Son las tres"). ' +
      'Estar is used for location (regardless of permanence — even a country\'s capital "uses" estar: "Madrid está en ' +
      'España"), emotional/physical states, and ongoing actions with the gerund ("Estoy comiendo"). The trickiest part ' +
      'is that the SAME adjective can pair with either verb to mean different things: "Él es aburrido" means he is a ' +
      'boring person (characteristic), while "Él está aburrido" means he is bored right now (temporary state) — the ' +
      'verb choice changes the meaning of the adjective itself, not just its grammatical correctness.',
    flashcards: [
      { question: 'Which verb is used for location, regardless of permanence?', answer: 'Estar (e.g. "Madrid está en España").' },
      { question: 'What does "Él es aburrido" mean, versus "Él está aburrido"?', answer: '"Es aburrido" = he is a boring person (trait); "está aburrido" = he is bored right now (state).' },
      { question: 'Which verb is used with the gerund for ongoing actions?', answer: 'Estar (e.g. "Estoy comiendo" = I am eating).' }
    ],
    quizQuestions: [
      { question: '"Son las tres de la tarde" uses ser because it expresses:', options: ['Location', 'Time', 'Emotion', 'An ongoing action'], correctAnswer: 1, explanation: 'Telling time always uses ser, regardless of the permanent/temporary heuristic.' },
      { question: 'Why does "Madrid está en España" use estar rather than ser?', options: ['Because Madrid could move', 'Because estar is used for location regardless of permanence', 'Because Spain is temporary', 'It\'s an exception with no rule'], correctAnswer: 1, explanation: 'Location always takes estar, even for something as permanent as a capital city.' },
      { question: 'The difference between "es aburrido" and "está aburrido" is:', options: ['No difference, both are correct either way', 'Trait vs. current state', 'Formal vs. informal speech', 'Only regional dialect'], correctAnswer: 1, explanation: 'The same adjective changes meaning based on which "to be" verb pairs with it.' }
    ],
    progress: 90,
    daysAgo: 27,
    isPublic: true
  }
];

export interface DemoCommunityExtra {
  title: string;
  type: 'note' | 'pdf' | 'article' | 'unified' | 'youtube';
  category: string;
  summary: string;
  keyTopics: string[];
  detailedNotes: string;
  flashcards: DemoFlashcard[];
  quizQuestions: DemoQuizQuestion[];
  /** Index into DEMO_PEOPLE — this person owns and is credited as the
   *  author, so authorName always matches the real owner (no invented
   *  identity mismatch — see the seed script's comment on this). */
  ownerIndex: number;
  daysAgo: number;
}

/**
 * Community/Explore needs visible variety beyond "everything is the demo
 * account's own library" — these are separate posts owned by (and credited
 * to) other seeded people, not relabeled copies of the demo user's work.
 */
export const DEMO_COMMUNITY_EXTRAS: DemoCommunityExtra[] = [
  {
    title: 'Thermodynamics: The Four Laws, Plainly',
    type: 'note',
    category: 'Physics',
    summary: 'A plain-language pass through the zeroth, first, second, and third laws of thermodynamics, with why each one actually matters.',
    keyTopics: ['Entropy', 'Heat engines', 'Conservation of energy'],
    detailedNotes:
      'The zeroth law establishes that temperature is transitive — if A is in thermal equilibrium with B, and B with C, ' +
      'then A and C are too, which is what makes thermometers meaningful at all. The first law is energy conservation: ' +
      'energy can\'t be created or destroyed, only converted between forms. The second law introduces entropy — in any ' +
      'isolated system, total entropy never decreases, which is why heat flows from hot to cold and not the reverse ' +
      'without external work. The third law states entropy approaches a constant minimum as temperature approaches ' +
      'absolute zero.',
    flashcards: [
      { question: 'What does the second law of thermodynamics say about entropy?', answer: 'In an isolated system, total entropy never decreases.' },
      { question: 'What does the zeroth law establish?', answer: 'That thermal equilibrium is transitive, making temperature a well-defined, measurable quantity.' }
    ],
    quizQuestions: [
      { question: 'The first law of thermodynamics is essentially a statement of:', options: ['Entropy increase', 'Energy conservation', 'Absolute zero', 'Heat engine efficiency'], correctAnswer: 1, explanation: 'The first law says energy is conserved — only converted between forms, never created or destroyed.' },
      { question: 'Heat naturally flows from hot to cold because of the:', options: ['First law', 'Second law', 'Zeroth law', 'Third law'], correctAnswer: 1, explanation: 'This directionality is a direct consequence of entropy never decreasing in an isolated system.' }
    ],
    ownerIndex: 1,
    daysAgo: 5
  },
  {
    title: 'Macroeconomics: Supply & Demand Shocks',
    type: 'article',
    category: 'Economics',
    summary: 'How sudden shifts in supply or demand move price and quantity, and why the direction of the shift matters for policy response.',
    keyTopics: ['Supply shock', 'Demand elasticity', 'Equilibrium price'],
    detailedNotes:
      'A supply shock shifts the entire supply curve — a negative shock (e.g. an oil embargo) shifts it left, raising ' +
      'equilibrium price while lowering equilibrium quantity. A demand shock works the same way on the demand curve: a ' +
      'positive demand shock shifts it right, raising both price and quantity. Distinguishing which curve moved matters ' +
      'for policy — a supply-driven price spike calls for different intervention than a demand-driven one, since they ' +
      'imply opposite quantity effects even though both raise price.',
    flashcards: [
      { question: 'What happens to equilibrium price and quantity after a negative supply shock?', answer: 'Price rises, quantity falls.' },
      { question: 'What happens after a positive demand shock?', answer: 'Both price and quantity rise.' }
    ],
    quizQuestions: [
      { question: 'An oil embargo is an example of a:', options: ['Positive demand shock', 'Negative supply shock', 'Positive supply shock', 'Neutral shock'], correctAnswer: 1, explanation: 'It restricts supply, shifting the supply curve left.' },
      { question: 'Why does distinguishing supply vs demand shocks matter for policy?', options: ['It doesn\'t matter', 'They imply opposite quantity effects even though both can raise price', 'Only supply shocks affect price', 'Only demand shocks are real'], correctAnswer: 1, explanation: 'A supply shock lowers quantity while a demand shock raises it, even when both raise price — the right policy response differs.' }
    ],
    ownerIndex: 3,
    daysAgo: 9
  },
  {
    title: 'Newton\'s Three Laws of Motion',
    type: 'note',
    category: 'Physics',
    summary: 'Inertia, F=ma, and action-reaction — the three laws underlying classical mechanics, with everyday examples of each.',
    keyTopics: ['Inertia', 'F = ma', 'Action-reaction pairs'],
    detailedNotes:
      'Newton\'s first law (inertia) says an object at rest stays at rest, and an object in motion stays in motion at ' +
      'constant velocity, unless acted on by a net external force. The second law quantifies this: F = ma — force ' +
      'equals mass times acceleration, meaning the same force accelerates a lighter object more than a heavier one. ' +
      'The third law states that for every action there is an equal and opposite reaction — forces always come in ' +
      'pairs acting on different objects, which is why a rocket can accelerate in a vacuum by expelling exhaust.',
    flashcards: [
      { question: 'State Newton\'s second law.', answer: 'F = ma — force equals mass times acceleration.' },
      { question: 'Why can a rocket accelerate in the vacuum of space?', answer: 'By Newton\'s third law: expelling exhaust mass backward pushes the rocket forward, with no air needed.' }
    ],
    quizQuestions: [
      { question: 'An object at rest stays at rest unless acted on by a net force — this is Newton\'s:', options: ['First law', 'Second law', 'Third law', 'Zeroth law (not one of Newton\'s)'], correctAnswer: 0, explanation: 'This is the law of inertia, Newton\'s first law.' },
      { question: 'For the same applied force, a heavier object will:', options: ['Accelerate more', 'Accelerate less', 'Not move at all', 'Accelerate the same regardless of mass'], correctAnswer: 1, explanation: 'Since a = F/m, a larger mass produces smaller acceleration for the same force.' }
    ],
    ownerIndex: 6,
    daysAgo: 13
  },
  {
    title: 'Recursion vs Iteration',
    type: 'note',
    category: 'Computer Science',
    summary: 'When a recursive solution is clearer than a loop, and the tradeoffs — call stack depth, memoization, and tail-call cases.',
    keyTopics: ['Base case', 'Call stack', 'Memoization'],
    detailedNotes:
      'Recursion solves a problem by having a function call itself on a smaller version of the same problem, always ' +
      'anchored by a base case that stops the recursion. It often reads more naturally for problems that are already ' +
      'recursively defined, like tree traversal or factorial. The tradeoff is call stack usage — each recursive call ' +
      'adds a frame, and without optimization, deep recursion can overflow the stack where an equivalent loop wouldn\'t. ' +
      'Memoization (caching results of expensive recursive calls) is a common fix for the redundant recomputation seen ' +
      'in naive recursive solutions like a plain recursive Fibonacci.',
    flashcards: [
      { question: 'What stops a recursive function from calling itself forever?', answer: 'The base case.' },
      { question: 'What is memoization used to fix in recursive solutions?', answer: 'Redundant recomputation of the same subproblems, by caching previously computed results.' }
    ],
    quizQuestions: [
      { question: 'A key risk of deep, unoptimized recursion is:', options: ['Slower compilation', 'Call stack overflow', 'Memory leaks in the heap only', 'Infinite loops that never error'], correctAnswer: 1, explanation: 'Each call adds a stack frame; too many unresolved calls can exceed the stack limit.' },
      { question: 'A naive recursive Fibonacci function is slow mainly because it:', options: ['Uses too much memory for one variable', 'Recomputes the same subproblems repeatedly', 'Cannot be written recursively at all', 'Requires floating point math'], correctAnswer: 1, explanation: 'Without memoization, overlapping subproblems get recalculated exponentially many times.' }
    ],
    ownerIndex: 9,
    daysAgo: 2
  },
  {
    title: 'Poetic Devices: Meter, Rhyme, and Imagery',
    type: 'article',
    category: 'Literature',
    summary: 'How iambic pentameter, rhyme scheme, and imagery work together to shape a poem\'s rhythm and emotional effect.',
    keyTopics: ['Iambic pentameter', 'Rhyme scheme', 'Imagery'],
    detailedNotes:
      'Meter describes a poem\'s rhythmic pattern of stressed and unstressed syllables — iambic pentameter, ' +
      'Shakespeare\'s preferred meter, is five iambs per line (unstressed-stressed, five times), close to natural ' +
      'English speech rhythm. Rhyme scheme, notated with letters (ABAB, AABB), describes which line endings rhyme with ' +
      'each other and shapes a poem\'s structure and pacing. Imagery uses vivid, sensory language to create a mental ' +
      'picture, engaging sight, sound, touch, taste, or smell to make abstract ideas feel concrete and immediate.',
    flashcards: [
      { question: 'What is iambic pentameter?', answer: 'A meter of five iambs (unstressed-stressed syllable pairs) per line.' },
      { question: 'What does imagery do in a poem?', answer: 'Uses vivid, sensory language to create a concrete mental picture for the reader.' }
    ],
    quizQuestions: [
      { question: 'Iambic pentameter has how many iambs per line?', options: ['Three', 'Four', 'Five', 'Six'], correctAnswer: 2, explanation: '"Penta-" means five — five iambs per line.' },
      { question: 'A rhyme scheme of ABAB means:', options: ['Every line rhymes', 'Lines 1&3 rhyme, and lines 2&4 rhyme', 'No lines rhyme', 'Only the first and last lines rhyme'], correctAnswer: 1, explanation: 'Matching letters mark which lines share a rhyme; A-lines rhyme together, B-lines rhyme together.' }
    ],
    ownerIndex: 11,
    daysAgo: 20
  },
  {
    title: 'The Immune System: Innate vs Adaptive',
    type: 'note',
    category: 'Biology',
    summary: 'The fast, general-purpose innate response versus the slower, targeted adaptive immune response — and how they hand off to each other.',
    keyTopics: ['Innate immunity', 'Adaptive immunity', 'Antibodies', 'Memory cells'],
    detailedNotes:
      'The innate immune system is the body\'s fast, non-specific first line of defense — physical barriers like skin, ' +
      'plus cells like macrophages and neutrophils that attack anything recognized as foreign, within minutes to hours. ' +
      'It doesn\'t improve with repeated exposure. The adaptive immune system is slower to activate (days) but highly ' +
      'specific: B cells produce antibodies tailored to a particular pathogen, and T cells directly kill infected cells ' +
      'or coordinate the response. Critically, the adaptive system creates memory cells, which is why a second exposure ' +
      'to the same pathogen triggers a much faster, stronger response — the biological basis for vaccination.',
    flashcards: [
      { question: 'What is the key difference between innate and adaptive immunity?', answer: 'Innate is fast and non-specific; adaptive is slower but targeted, and improves with exposure.' },
      { question: 'What do memory cells enable?', answer: 'A much faster, stronger response on a second exposure to the same pathogen — the basis for vaccination.' }
    ],
    quizQuestions: [
      { question: 'Which cells produce antibodies tailored to a specific pathogen?', options: ['Macrophages', 'B cells', 'Neutrophils', 'Skin cells'], correctAnswer: 1, explanation: 'B cells are part of the adaptive immune system and produce pathogen-specific antibodies.' },
      { question: 'Vaccination works primarily by triggering the creation of:', options: ['More skin barriers', 'Memory cells', 'Additional neutrophils only', 'A permanent fever'], correctAnswer: 1, explanation: 'Memory cells let the adaptive immune system respond much faster on a real future exposure.' }
    ],
    ownerIndex: 13,
    daysAgo: 16
  }
];

/**
 * Fake identities shared by two roles: leaderboard competitors (need a real
 * User document each, since /leaderboard/top and Room.participants both
 * populate against real users) and community "authors" (need only a display
 * string — see Material.authorName, decoupled from the owning userId).
 * Deliberately varied — the ask was specifically "not all near-identical
 * auto-generated names."
 */
export const DEMO_PEOPLE: { name: string; handle: string }[] = [
  { name: 'Priya Kapoor', handle: 'priyak' },
  { name: 'Marcus Chen', handle: 'marcuschen' },
  { name: 'Sofia Reyes', handle: 'sofiareyes' },
  { name: 'Oluwaseun Adeyemi', handle: 'seun_a' },
  { name: 'Emma Johansson', handle: 'emmaj' },
  { name: 'Diego Fernández', handle: 'diegof' },
  { name: 'Amara Okafor', handle: 'amarao' },
  { name: 'Liam O\'Connor', handle: 'liamoconnor' },
  { name: 'Yuki Tanaka', handle: 'yukit' },
  { name: 'Zainab Hussain', handle: 'zainabh' },
  { name: 'Noah Bergström', handle: 'noahb' },
  { name: 'Isabella Moretti', handle: 'isabellam' },
  { name: 'Kwame Mensah', handle: 'kwamem' },
  { name: 'Chloe Dubois', handle: 'chloed' },
  { name: 'Aarav Sharma', handle: 'aaravs' },
  { name: 'Grace Mwangi', handle: 'gracem' }
];
