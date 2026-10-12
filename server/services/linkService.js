const { v4: uuidv4 } = require('uuid');

/**
 * Extracts all [[WikiLink]] references from content
 * Example: "Check out [[RemNote]] and [[Spaced Repetition]]" -> ["RemNote", "Spaced Repetition"]
 */
function extractWikiLinks(content) {
  if (!content) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    if (rawTarget && !matches.includes(rawTarget)) {
      matches.push(rawTarget);
    }
  }
  return matches;
}

/**
 * Syncs bidirectional links for a given source node.
 * Scans content for [[WikiLinks]]. If a link target matches an existing node,
 * links to it. If it doesn't exist, optionally finds by exact content or creates a stub.
 */
function syncLinksForNode(db, sourceNodeId, content) {
  const linkTargets = extractWikiLinks(content);

  // Clear existing outbound links from this node
  db.prepare('DELETE FROM links WHERE source_id = ?').run(sourceNodeId);

  if (linkTargets.length === 0) {
    return [];
  }

  const linkedTargetIds = [];

  for (const targetName of linkTargets) {
    // 1. Check if target is a raw UUID that matches a node
    let targetNode = db.prepare('SELECT id, content FROM nodes WHERE id = ?').get(targetName);

    // 2. Otherwise search by exact content or starting content
    if (!targetNode) {
      targetNode = db.prepare('SELECT id, content FROM nodes WHERE content LIKE ? LIMIT 1').get(`%${targetName}%`);
    }

    // 3. If target does not exist, create a new top-level node for this concept
    if (!targetNode) {
      const newId = uuidv4();
      const maxSort = db.prepare('SELECT MAX(sort_order) as maxSort FROM nodes WHERE parent_id IS NULL').get();
      const sortOrder = (maxSort && maxSort.maxSort ? maxSort.maxSort : 0) + 100;
      
      db.prepare(`
        INSERT INTO nodes (id, parent_id, content, is_expanded, sort_order)
        VALUES (?, NULL, ?, 1, ?)
      `).run(newId, targetName, sortOrder);

      targetNode = { id: newId, content: targetName };
    }

    if (targetNode && targetNode.id !== sourceNodeId) {
      db.prepare(`
        INSERT OR IGNORE INTO links (source_id, target_id)
        VALUES (?, ?)
      `).run(sourceNodeId, targetNode.id);
      
      linkedTargetIds.push(targetNode.id);
    }
  }

  return linkedTargetIds;
}

/**
 * Retrieves all backlinks pointing to a target node.
 */
function getBacklinks(db, targetNodeId) {
  const links = db.prepare(`
    SELECT l.source_id, l.created_at, n.content, n.parent_id, n.updated_at
    FROM links l
    JOIN nodes n ON l.source_id = n.id
    WHERE l.target_id = ?
    ORDER BY l.created_at DESC
  `).all(targetNodeId);

  return links;
}

module.exports = {
  extractWikiLinks,
  syncLinksForNode,
  getBacklinks
};
