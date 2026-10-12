const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { syncLinksForNode, getBacklinks } = require('../services/linkService');

function createNodesRouter(db) {
  const router = express.Router();

  // 1. Get all nodes
  router.get('/', (req, res) => {
    try {
      const nodes = db.prepare(`
        SELECT n.*,
          (SELECT COUNT(*) FROM nodes c WHERE c.parent_id = n.id) as children_count
        FROM nodes n
        ORDER BY n.parent_id IS NOT NULL, n.sort_order ASC, n.created_at ASC
      `).all();
      res.json({ success: true, nodes });
    } catch (err) {
      console.error('Error fetching nodes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Search nodes (for [[WikiLink]] autocomplete)
  router.get('/search', (req, res) => {
    try {
      const query = req.query.q || '';
      const nodes = db.prepare(`
        SELECT id, content, parent_id
        FROM nodes
        WHERE content LIKE ?
        ORDER BY updated_at DESC
        LIMIT 20
      `).all(`%${query}%`);
      res.json({ success: true, results: nodes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Get single node with breadcrumbs & backlinks
  router.get('/:id', (req, res) => {
    try {
      const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
      if (!node) return res.status(404).json({ success: false, error: 'Node not found' });

      // Build breadcrumbs up to root
      const breadcrumbs = [];
      let currentParentId = node.parent_id;
      while (currentParentId) {
        const parent = db.prepare('SELECT id, content, parent_id FROM nodes WHERE id = ?').get(currentParentId);
        if (!parent) break;
        breadcrumbs.unshift({ id: parent.id, content: parent.content });
        currentParentId = parent.parent_id;
      }

      const backlinks = getBacklinks(db, node.id);
      const children = db.prepare('SELECT * FROM nodes WHERE parent_id = ? ORDER BY sort_order ASC').all(node.id);

      res.json({
        success: true,
        node,
        breadcrumbs,
        children,
        backlinks
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Create node
  router.post('/', (req, res) => {
    try {
      const id = req.body.id || uuidv4();
      const parent_id = req.body.parent_id || null;
      const content = req.body.content !== undefined ? req.body.content : '';
      const is_expanded = req.body.is_expanded !== undefined ? (req.body.is_expanded ? 1 : 0) : 1;
      
      let sort_order = req.body.sort_order;
      if (sort_order === undefined || sort_order === null) {
        // Default to after the last child of this parent
        const lastChild = db.prepare(`
          SELECT MAX(sort_order) as maxSort FROM nodes WHERE ${parent_id ? 'parent_id = ?' : 'parent_id IS NULL'}
        `).get(parent_id ? [parent_id] : []);
        sort_order = (lastChild && lastChild.maxSort !== null ? lastChild.maxSort : 0) + 100;
      }

      db.prepare(`
        INSERT INTO nodes (id, parent_id, content, is_expanded, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(id, parent_id, content, is_expanded, sort_order);

      // Parse and sync [[WikiLinks]]
      syncLinksForNode(db, id, content);

      const createdNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      res.status(201).json({ success: true, node: createdNode });
    } catch (err) {
      console.error('Error creating node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Update node
  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ success: false, error: 'Node not found' });

      const content = req.body.content !== undefined ? req.body.content : existing.content;
      const parent_id = req.body.parent_id !== undefined ? req.body.parent_id : existing.parent_id;
      const is_expanded = req.body.is_expanded !== undefined ? (req.body.is_expanded ? 1 : 0) : existing.is_expanded;
      const sort_order = req.body.sort_order !== undefined ? req.body.sort_order : existing.sort_order;
      const is_starred = req.body.is_starred !== undefined ? (req.body.is_starred ? 1 : 0) : (existing.is_starred || 0);

      db.prepare(`
        UPDATE nodes
        SET content = ?, parent_id = ?, is_expanded = ?, sort_order = ?, is_starred = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(content, parent_id, is_expanded, sort_order, is_starred, id);

      // If content was updated, sync WikiLinks
      if (req.body.content !== undefined) {
        syncLinksForNode(db, id, content);
      }

      const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      res.json({ success: true, node: updatedNode });
    } catch (err) {
      console.error('Error updating node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle star status
  router.patch('/:id/star', (req, res) => {
    try {
      const { id } = req.params;
      const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      if (!node) return res.status(404).json({ success: false, error: 'Node not found' });
      const newStarred = (node.is_starred === 1 || node.is_starred === true) ? 0 : 1;
      db.prepare("UPDATE nodes SET is_starred = ?, updated_at = datetime('now') WHERE id = ?").run(newStarred, id);
      const updated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      res.json({ success: true, node: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Duplicate node and all its children
  router.post('/:id/duplicate', (req, res) => {
    try {
      const { id } = req.params;
      const sourceNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      if (!sourceNode) return res.status(404).json({ success: false, error: 'Node not found' });

      function copyNodeRecursive(srcId, targetParentId, sortOffset = 0) {
        const src = db.prepare('SELECT * FROM nodes WHERE id = ?').get(srcId);
        const newId = uuidv4();
        const newContent = targetParentId === src.parent_id && srcId === id
          ? (src.content ? `${src.content} (Copy)` : 'Copy')
          : src.content;
        const newSort = src.sort_order + sortOffset;

        db.prepare(`
          INSERT INTO nodes (id, parent_id, content, is_expanded, sort_order, is_starred, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(newId, targetParentId, newContent, src.is_expanded, newSort, src.is_starred || 0);

        syncLinksForNode(db, newId, newContent);

        const children = db.prepare('SELECT id FROM nodes WHERE parent_id = ? ORDER BY sort_order ASC').all(srcId);
        for (const child of children) {
          copyNodeRecursive(child.id, newId, 0);
        }

        return newId;
      }

      const newRootId = copyNodeRecursive(id, sourceNode.parent_id, 25);
      const duplicated = db.prepare('SELECT * FROM nodes WHERE id = ?').get(newRootId);
      res.status(201).json({ success: true, node: duplicated });
    } catch (err) {
      console.error('Error duplicating node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Indent node (Step 4 keyboard requirement: Tab)
  router.patch('/:id/indent', (req, res) => {
    try {
      const { id } = req.params;
      const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      if (!node) return res.status(404).json({ success: false, error: 'Node not found' });

      // Find the sibling immediately above this node under the same parent
      const prevSibling = db.prepare(`
        SELECT * FROM nodes 
        WHERE ${node.parent_id ? 'parent_id = ?' : 'parent_id IS NULL'}
          AND sort_order < ?
        ORDER BY sort_order DESC
        LIMIT 1
      `).get(node.parent_id ? [node.parent_id, node.sort_order] : [node.sort_order]);

      if (!prevSibling) {
        return res.json({ success: false, message: 'Cannot indent: no previous sibling to nest under', node });
      }

      // Find max sort_order among prevSibling's children
      const maxChild = db.prepare('SELECT MAX(sort_order) as maxSort FROM nodes WHERE parent_id = ?').get(prevSibling.id);
      const newSortOrder = (maxChild && maxChild.maxSort !== null ? maxChild.maxSort : 0) + 100;

      // Update node's parent_id and make sure prevSibling is expanded
      db.prepare(`UPDATE nodes SET parent_id = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(prevSibling.id, newSortOrder, id);
      db.prepare('UPDATE nodes SET is_expanded = 1 WHERE id = ?').run(prevSibling.id);

      const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      res.json({ success: true, node: updatedNode, newParentId: prevSibling.id });
    } catch (err) {
      console.error('Error indenting node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Outdent node (Step 4 keyboard requirement: Shift+Tab)
  router.patch('/:id/outdent', (req, res) => {
    try {
      const { id } = req.params;
      const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      if (!node) return res.status(404).json({ success: false, error: 'Node not found' });

      if (!node.parent_id) {
        return res.json({ success: false, message: 'Cannot outdent: node is already at the root level', node });
      }

      // Current parent
      const parentNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(node.parent_id);
      if (!parentNode) return res.status(404).json({ success: false, error: 'Parent node not found' });

      // New parent is grandparent
      const newParentId = parentNode.parent_id;

      // Position right after parent
      const nextSibling = db.prepare(`
        SELECT sort_order FROM nodes
        WHERE ${newParentId ? 'parent_id = ?' : 'parent_id IS NULL'}
          AND sort_order > ?
        ORDER BY sort_order ASC
        LIMIT 1
      `).get(newParentId ? [newParentId, parentNode.sort_order] : [parentNode.sort_order]);

      let newSortOrder;
      if (nextSibling) {
        newSortOrder = (parentNode.sort_order + nextSibling.sort_order) / 2;
      } else {
        newSortOrder = parentNode.sort_order + 100;
      }

      db.prepare(`UPDATE nodes SET parent_id = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(newParentId, newSortOrder, id);

      const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
      res.json({ success: true, node: updatedNode, newParentId });
    } catch (err) {
      console.error('Error outdenting node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Delete node (cascades)
  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      // Recursive delete helper to ensure all descendants and links are removed cleanly
      function deleteRecursively(nodeId) {
        const children = db.prepare('SELECT id FROM nodes WHERE parent_id = ?').all(nodeId);
        for (const child of children) {
          deleteRecursively(child.id);
        }
        db.prepare('DELETE FROM links WHERE source_id = ? OR target_id = ?').run(nodeId, nodeId);
        db.prepare('DELETE FROM flashcards WHERE node_id = ?').run(nodeId);
        db.prepare('DELETE FROM nodes WHERE id = ?').run(nodeId);
      }

      deleteRecursively(id);
      res.json({ success: true, deletedId: id });
    } catch (err) {
      console.error('Error deleting node:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Backlinks for node
  router.get('/:id/backlinks', (req, res) => {
    try {
      const backlinks = getBacklinks(db, req.params.id);
      res.json({ success: true, backlinks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createNodesRouter;
