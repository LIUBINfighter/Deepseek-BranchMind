// 导出类型定义
export type NodeID = string;

export interface QAPairNode {
  id: NodeID;
  parentId: NodeID | null;
  type: 'question' | 'answer';
  content: string;
  title: string;
  abstract: string;
  children: NodeID[];
  timestamp: number;
}

// 导出类
export class ConversationTree {
  private nodes: Map<NodeID, QAPairNode> = new Map();
  private currentPath: NodeID[] = ['root'];
  
  constructor() {
    this.nodes.set('root', {
      id: 'root',
      parentId: null,
      type: 'question',
      content: '欢迎开始对话',
      title: '帮助页面和菜单',
      abstract: '帮助页面和菜单，你可以在这里找到教程和示例。',
      children: [],
      timestamp: Date.now()
    });
  }

  addNode(parentId: NodeID, content: string, isQuestion: boolean): NodeID {
    const newNodeId = crypto.randomUUID();
    const parent = this.nodes.get(parentId)!;
    
    const newNode: QAPairNode = {
      id: newNodeId,
      parentId,
      type: isQuestion ? 'question' : 'answer',
      content,
      title: '',
      abstract: '',
      children: [],
      timestamp: Date.now()
    };
    
    this.nodes.set(newNodeId, newNode);
    parent.children.push(newNodeId);
    this.currentPath.push(newNodeId);
    return newNodeId;
  }

  navigateTo(nodeId: NodeID) {
    const path: NodeID[] = [];
    let currentId: NodeID | null = nodeId;
    
    while (currentId) {
      const node = this.nodes.get(currentId)!;
      path.unshift(currentId);
      currentId = node.parentId;
    }
    
    this.currentPath = path;
  }

  getCurrentConversation(): QAPairNode[] {
    return this.currentPath.map(id => this.nodes.get(id)!);
  }

  getNode(id: NodeID): QAPairNode | undefined {
    return this.nodes.get(id);
  }

  getTreeData(): QAPairNode[] {
    return Array.from(this.nodes.values());
  }
}