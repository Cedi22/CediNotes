const { v4: uuidv4 } = require('uuid');

/**
 * Extracts Q&A flashcards from a node and its recursive children.
 */
function generateFlashcardsForNode(db, nodeId) {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
  if (!node) {
    throw new Error('Node not found');
  }

  // Fetch all children of this node
  const children = db.prepare('SELECT * FROM nodes WHERE parent_id = ? ORDER BY sort_order ASC').all(nodeId);

  const generatedCards = [];

  // 1. Check if node content itself has inline "::" delimiter
  if (node.content && node.content.includes('::')) {
    const parts = node.content.split('::');
    const question = parts[0].trim();
    const answer = parts.slice(1).join('::').trim();
    if (question && answer) {
      generatedCards.push({
        id: uuidv4(),
        node_id: node.id,
        question: question,
        answer: answer,
        card_type: 'concept'
      });
    }
  }

  // 2. If node has children, create a hierarchical Concept -> Points card
  if (children.length > 0) {
    const cleanQuestion = node.content.replace(/\[\[(.*?)\]\]/g, '$1').trim() || 'Key Concepts';
    const bulletAnswers = children
      .map(c => `• ${c.content.replace(/\[\[(.*?)\]\]/g, '$1').trim()}`)
      .filter(t => t.length > 2)
      .join('\n');

    if (bulletAnswers) {
      generatedCards.push({
        id: uuidv4(),
        node_id: node.id,
        question: `What are the core details of: "${cleanQuestion}"?`,
        answer: bulletAnswers,
        card_type: 'hierarchical_tree'
      });
    }

    // 3. Scan children for their own "::" or child associations
    for (const child of children) {
      if (child.content && child.content.includes('::')) {
        const parts = child.content.split('::');
        const q = parts[0].trim();
        const a = parts.slice(1).join('::').trim();
        if (q && a) {
          generatedCards.push({
            id: uuidv4(),
            node_id: child.id,
            question: q,
            answer: a,
            card_type: 'concept'
          });
        }
      }

      // Check grandchildren
      const grandChildren = db.prepare('SELECT * FROM nodes WHERE parent_id = ? ORDER BY sort_order ASC').all(child.id);
      if (grandChildren.length > 0) {
        const grandBulletAnswers = grandChildren
          .map(gc => `• ${gc.content.replace(/\[\[(.*?)\]\]/g, '$1').trim()}`)
          .join('\n');

        generatedCards.push({
          id: uuidv4(),
          node_id: child.id,
          question: `Explain: "${child.content.replace(/\[\[(.*?)\]\]/g, '$1').trim()}"`,
          answer: grandBulletAnswers,
          card_type: 'hierarchical_tree'
        });
      }
    }
  }

  // Fallback: If no children and no '::', create a self-explanation prompt card
  if (generatedCards.length === 0 && node.content && node.content.trim()) {
    const cleaned = node.content.replace(/\[\[(.*?)\]\]/g, '$1').trim();
    generatedCards.push({
      id: uuidv4(),
      node_id: node.id,
      question: `Define / recall the key insight: "${cleaned}"`,
      answer: `Context: ${cleaned}`,
      card_type: 'recall'
    });
  }

  // Save generated cards to database (avoid exact duplicate questions for the same node)
  const insertCard = db.prepare(`
    INSERT INTO flashcards (id, node_id, question, answer, card_type, interval, ease_factor, repetitions, due_date)
    VALUES (?, ?, ?, ?, ?, 1, 2.5, 0, datetime('now'))
  `);

  const savedCards = [];
  for (const card of generatedCards) {
    const existing = db.prepare('SELECT id FROM flashcards WHERE node_id = ? AND question = ?').get(card.node_id, card.question);
    if (!existing) {
      insertCard.run(card.id, card.node_id, card.question, card.answer, card.card_type);
      savedCards.push(card);
    } else {
      savedCards.push(existing);
    }
  }

  return savedCards;
}

/**
 * SM-2 Spaced Repetition review calculator
 * Rating: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
 */
function processReview(db, cardId, rating) {
  const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(cardId);
  if (!card) throw new Error('Flashcard not found');

  let { interval, ease_factor, repetitions } = card;

  // Grade normalization (0 to 5 in SM-2, mapped from 1-4)
  // 1 -> Again (grade 1)
  // 2 -> Hard (grade 3)
  // 3 -> Good (grade 4)
  // 4 -> Easy (grade 5)
  if (rating === 1) {
    // Again
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = rating === 2 ? 3 : 6;
    } else {
      const multiplier = rating === 2 ? 1.2 : (rating === 4 ? ease_factor * 1.3 : ease_factor);
      interval = Math.round(interval * multiplier);
    }
    repetitions += 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  const grade = rating === 1 ? 1 : rating === 2 ? 3 : rating === 3 ? 4 : 5;
  ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  // Calculate next due date
  const updateStmt = db.prepare(`
    UPDATE flashcards 
    SET interval = ?, ease_factor = ?, repetitions = ?, due_date = datetime('now', '+' || ? || ' days')
    WHERE id = ?
  `);

  updateStmt.run(interval, ease_factor, repetitions, interval, cardId);

  return {
    id: cardId,
    interval,
    ease_factor,
    repetitions,
    nextDueInDays: interval
  };
}

module.exports = {
  generateFlashcardsForNode,
  processReview
};
