export type NodeId = string;

export interface Edge {
  to: NodeId;
  weight: number;
}

export interface Graph {
  [node: NodeId]: Edge[];
}

class PriorityNode {
  key: NodeId;
  priority: number;

  constructor(key: NodeId, priority: number) {
    this.key = key;
    this.priority = priority;
  }
}

class PriorityQueue {
  nodes: PriorityNode[] = [];

  enqueue(priority: number, key: NodeId) {
    this.nodes.push(new PriorityNode(key, priority));
    this.nodes.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): NodeId | undefined {
    return this.nodes.shift()?.key;
  }

  empty(): boolean {
    return this.nodes.length === 0;
  }
}

export function dijkstra(graph: Graph, start: NodeId, end: NodeId): NodeId[] {
  const distances: Record<NodeId, number> = {};
  const previous: Record<NodeId, NodeId | null> = {};
  const queue = new PriorityQueue();

  for (const node in graph) {
    if (node === start) {
      distances[node] = 0;
      queue.enqueue(0, node);
    } else {
      distances[node] = Infinity;
      queue.enqueue(Infinity, node);
    }
    previous[node] = null;
  }

  while (!queue.empty()) {
    const smallest = queue.dequeue();
    if (!smallest) break;

    if (smallest === end) {
      // Build path
      const path: NodeId[] = [];
      let curr: NodeId | null = end;
      while (curr) {
        path.unshift(curr);
        curr = previous[curr];
      }
      if (path[0] !== start) return [];
      return path;
    }

    if (distances[smallest] === Infinity) continue;

    for (const edge of graph[smallest]) {
      const alt = distances[smallest] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = smallest;
        queue.enqueue(alt, edge.to);
      }
    }
  }

  return [];
}