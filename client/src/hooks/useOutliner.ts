import { useState, useEffect, useCallback, useRef } from 'react';
import { NodeItem, Breadcrumb } from '../types';
import { api } from '../services/api';

export function useOutliner() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [zoomedNodeId, setZoomedNodeId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Input refs for focus management
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Debounced update timers map
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load all nodes
  const loadNodes = useCallback(async () => {
    try {
      const data = await api.getNodes();
      setNodes(data);
    } catch (err) {
      console.error('Failed to load nodes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  // Update breadcrumbs when zoomedNodeId changes
  useEffect(() => {
    if (!zoomedNodeId) {
      setBreadcrumbs([]);
      return;
    }

    const trail: Breadcrumb[] = [];
    let currentId: string | null = zoomedNodeId;

    while (currentId) {
      const found = nodes.find(n => n.id === currentId);
      if (found) {
        trail.unshift({ id: found.id, content: found.content || 'Untitled' });
        currentId = found.parent_id;
      } else {
        break;
      }
    }

    setBreadcrumbs(trail);
  }, [zoomedNodeId, nodes]);

  const registerInputRef = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current.set(id, el);
    } else {
      inputRefs.current.delete(id);
    }
  }, []);

  const focusNode = useCallback((id: string, atStart = false) => {
    setTimeout(() => {
      const el = inputRefs.current.get(id);
      if (el) {
        el.focus();
        const pos = atStart ? 0 : el.value.length;
        el.setSelectionRange(pos, pos);
      }
    }, 15);
  }, []);

  // Flatten currently visible nodes in outliner sequence for up/down keyboard traversal
  const getFlattenedVisibleOrder = useCallback((): NodeItem[] => {
    const list: NodeItem[] = [];

    function traverse(parentId: string | null) {
      const children = nodes
        .filter(n => n.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const child of children) {
        list.push(child);
        const isExp = child.is_expanded === 1 || child.is_expanded === true;
        if (isExp) {
          traverse(child.id);
        }
      }
    }

    if (zoomedNodeId) {
      const currentZoomed = nodes.find(n => n.id === zoomedNodeId);
      if (currentZoomed) {
        traverse(currentZoomed.id);
      }
    } else {
      traverse(null);
    }

    return list;
  }, [nodes, zoomedNodeId]);

  // 1. Enter: Create new sibling node below current one
  const handleEnter = useCallback(async (currentNodeId: string) => {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    // Get siblings under same parent
    const siblings = nodes
      .filter(n => n.parent_id === currentNode.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = siblings.findIndex(s => s.id === currentNodeId);
    const nextSibling = siblings[currentIndex + 1];

    let newSortOrder: number;
    if (nextSibling) {
      newSortOrder = (currentNode.sort_order + nextSibling.sort_order) / 2;
    } else {
      newSortOrder = currentNode.sort_order + 100;
    }

    const tempId = 'node_' + Math.random().toString(36).substring(2, 9);
    const newNode: NodeItem = {
      id: tempId,
      parent_id: currentNode.parent_id,
      content: '',
      is_expanded: 1,
      sort_order: newSortOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic insert
    setNodes(prev => [...prev, newNode]);
    focusNode(tempId, true);

    try {
      const created = await api.createNode({
        parent_id: currentNode.parent_id,
        content: '',
        is_expanded: true,
        sort_order: newSortOrder
      });

      // Replace tempId with server created ID
      setNodes(prev => prev.map(n => n.id === tempId ? created : n));
      focusNode(created.id, true);
    } catch (err) {
      console.error('Failed to create sibling node:', err);
      setNodes(prev => prev.filter(n => n.id !== tempId));
    }
  }, [nodes, focusNode]);

  // 2. Tab: Indent current node under previous sibling
  const handleIndent = useCallback(async (currentNodeId: string) => {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    // Find previous sibling
    const siblings = nodes
      .filter(n => n.parent_id === currentNode.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = siblings.findIndex(s => s.id === currentNodeId);
    if (currentIndex <= 0) return; // No previous sibling to nest under

    const prevSibling = siblings[currentIndex - 1];

    // Find max sort_order among prevSibling's children
    const prevSiblingChildren = nodes
      .filter(n => n.parent_id === prevSibling.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const lastChild = prevSiblingChildren[prevSiblingChildren.length - 1];
    const newSortOrder = lastChild ? lastChild.sort_order + 100 : 100;

    // Optimistic update
    setNodes(prev => prev.map(n => {
      if (n.id === currentNodeId) {
        return { ...n, parent_id: prevSibling.id, sort_order: newSortOrder };
      }
      if (n.id === prevSibling.id) {
        return { ...n, is_expanded: 1 };
      }
      return n;
    }));

    focusNode(currentNodeId);

    try {
      await api.indentNode(currentNodeId);
    } catch (err) {
      console.error('Failed to indent node:', err);
      loadNodes();
    }
  }, [nodes, focusNode, loadNodes]);

  // 3. Shift+Tab: Outdent current node
  const handleOutdent = useCallback(async (currentNodeId: string) => {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode || !currentNode.parent_id) {
      return;
    }

    const parentNode = nodes.find(n => n.id === currentNode.parent_id);
    if (!parentNode) return;

    const grandParentId = parentNode.parent_id;

    const parentSiblings = nodes
      .filter(n => n.parent_id === grandParentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const parentIndex = parentSiblings.findIndex(s => s.id === parentNode.id);
    const parentNextSibling = parentSiblings[parentIndex + 1];

    let newSortOrder: number;
    if (parentNextSibling) {
      newSortOrder = (parentNode.sort_order + parentNextSibling.sort_order) / 2;
    } else {
      newSortOrder = parentNode.sort_order + 100;
    }

    // Optimistic update
    setNodes(prev => prev.map(n => {
      if (n.id === currentNodeId) {
        return { ...n, parent_id: grandParentId, sort_order: newSortOrder };
      }
      return n;
    }));

    focusNode(currentNodeId);

    try {
      await api.outdentNode(currentNodeId);
    } catch (err) {
      console.error('Failed to outdent node:', err);
      loadNodes();
    }
  }, [nodes, focusNode, loadNodes]);

  // Delete node and ALL its descendant children recursively
  const handleDeleteNode = useCallback(async (targetId: string) => {
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return;

    // Collect target ID and all descendant IDs
    const toDeleteIds = new Set<string>();
    function collectDescendants(id: string) {
      toDeleteIds.add(id);
      const children = nodes.filter(n => n.parent_id === id);
      for (const c of children) {
        collectDescendants(c.id);
      }
    }
    collectDescendants(targetId);

    // Find previous visible node to focus
    const visibleList = getFlattenedVisibleOrder();
    const currentIndex = visibleList.findIndex(n => n.id === targetId);
    let prevNode: NodeItem | null = null;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!toDeleteIds.has(visibleList[i].id)) {
        prevNode = visibleList[i];
        break;
      }
    }

    // Optimistically remove all from state
    setNodes(prev => prev.filter(n => !toDeleteIds.has(n.id)));

    if (prevNode) {
      focusNode(prevNode.id, false);
    }

    try {
      await api.deleteNode(targetId);
    } catch (err) {
      console.error('Failed to delete node:', err);
      loadNodes();
    }
  }, [nodes, getFlattenedVisibleOrder, focusNode, loadNodes]);

  // 4. Backspace: If node is empty, remove it or promote children
  const handleBackspace = useCallback(async (currentNodeId: string) => {
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    // If it has children, promote children up to currentNode's parent
    const children = nodes.filter(n => n.parent_id === currentNodeId);
    if (children.length > 0) {
      // Promote children to parent_id
      const newParentId = currentNode.parent_id;
      setNodes(prev => prev.map(n => {
        if (n.parent_id === currentNodeId) {
          return { ...n, parent_id: newParentId };
        }
        return n;
      }).filter(n => n.id !== currentNodeId));

      try {
        for (const child of children) {
          await api.updateNode(child.id, { parent_id: newParentId });
        }
        await api.deleteNode(currentNodeId);
      } catch (err) {
        console.error('Failed promoting children on backspace:', err);
        loadNodes();
      }
      return;
    }

    // Leaf node: delete cleanly
    await handleDeleteNode(currentNodeId);
  }, [nodes, handleDeleteNode, loadNodes]);

  // Content change with debounced save & [[WikiLink]] sync
  const handleContentChange = useCallback((id: string, newContent: string) => {
    // Instant local state update
    setNodes(prev => prev.map(n => n.id === id ? { ...n, content: newContent } : n));
    setSavingStatus('saving');

    const existingTimer = debounceTimers.current.get(id);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      try {
        await api.updateNode(id, { content: newContent });
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 1500);
      } catch (err) {
        console.error('Failed to auto-save node:', err);
        setSavingStatus('idle');
      }
    }, 350);

    debounceTimers.current.set(id, timer);
  }, []);

  // Quick Add Child Bullet
  const handleAddChildBullet = useCallback(async (parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const children = nodes
      .filter(n => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const lastChild = children[children.length - 1];
    const newSortOrder = lastChild ? lastChild.sort_order + 100 : 100;

    const tempId = 'node_' + Math.random().toString(36).substring(2, 9);
    const newNode: NodeItem = {
      id: tempId,
      parent_id: parentId,
      content: '',
      is_expanded: 1,
      sort_order: newSortOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setNodes(prev => [
      ...prev.map(n => n.id === parentId ? { ...n, is_expanded: 1 } : n),
      newNode
    ]);

    focusNode(tempId, true);

    try {
      const created = await api.createNode({
        parent_id: parentId,
        content: '',
        is_expanded: true,
        sort_order: newSortOrder
      });

      setNodes(prev => prev.map(n => n.id === tempId ? created : n));
      focusNode(created.id, true);
    } catch (err) {
      console.error('Failed to add child bullet:', err);
      loadNodes();
    }
  }, [nodes, focusNode, loadNodes]);

  // Rename node immediately (for in-page editing)
  const handleRenameNode = useCallback(async (id: string, newTitle: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, content: newTitle } : n));
    try {
      await api.updateNode(id, { content: newTitle });
    } catch (err) {
      console.error('Failed to rename node:', err);
    }
  }, []);

  // Toggle node expand/collapse
  const toggleExpand = useCallback(async (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const nextState = !(node.is_expanded === 1 || node.is_expanded === true);

    setNodes(prev => prev.map(n => n.id === id ? { ...n, is_expanded: nextState ? 1 : 0 } : n));
    try {
      await api.updateNode(id, { is_expanded: nextState });
    } catch (err) {
      console.error('Failed to toggle expand:', err);
    }
  }, [nodes]);

  // Navigate Up/Down via keyboard
  const handleNavigateVertical = useCallback((currentNodeId: string, direction: 'up' | 'down') => {
    const visibleList = getFlattenedVisibleOrder();
    const currentIndex = visibleList.findIndex(n => n.id === currentNodeId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      focusNode(visibleList[currentIndex - 1].id);
    } else if (direction === 'down' && currentIndex < visibleList.length - 1) {
      focusNode(visibleList[currentIndex + 1].id);
    }
  }, [getFlattenedVisibleOrder, focusNode]);

  // Create root document/note
  const createRootNode = useCallback(async (title: string = 'Untitled Note') => {
    const maxSort = nodes
      .filter(n => n.parent_id === null)
      .reduce((max, n) => Math.max(max, n.sort_order), 0);

    const newNode = await api.createNode({
      parent_id: null,
      content: title,
      is_expanded: true,
      sort_order: maxSort + 100
    });

    setNodes(prev => [...prev, newNode]);
    focusNode(newNode.id, true);
    return newNode;
  }, [nodes, focusNode]);

  return {
    nodes,
    loading,
    activeNodeId,
    setActiveNodeId,
    zoomedNodeId,
    setZoomedNodeId,
    breadcrumbs,
    savingStatus,
    registerInputRef,
    focusNode,
    handleEnter,
    handleIndent,
    handleOutdent,
    handleBackspace,
    handleDeleteNode,
    handleRenameNode,
    handleAddChildBullet,
    handleContentChange,
    toggleExpand,
    handleNavigateVertical,
    createRootNode,
    loadNodes
  };
}
