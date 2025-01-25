import { ConversationTree, QAPairNode } from './qa-models';
import { GraphView } from './graph-view';

class AppUI {
  private tree: ConversationTree;
  private treeNav: HTMLElement;
  private chatHistory: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendButton: HTMLElement;
  private graphView: GraphView;

  constructor() {
    this.tree = new ConversationTree();
    
    // 获取DOM元素
    this.treeNav = document.getElementById('tree-nav')!;
    this.chatHistory = document.getElementById('chat-history')!;
    this.messageInput = document.getElementById('message-input') as HTMLInputElement;
    this.sendButton = document.getElementById('send-btn')!;
    
    // 创建 GraphView 实例
    this.graphView = new GraphView('graph-container');

    // 绑定事件
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
    
    // 初始化显示
    this.updateUI();
  }

  private handleSend() {
    const question = this.messageInput.value.trim();
    if (!question) return;

    // 模拟AI回答
    const answer = `这是对问题 "${question}" 的模拟回答`;
    
    // 添加新节点
    const currentNode = this.tree.getCurrentConversation().slice(-1)[0];
    this.tree.addNode(currentNode.id, question, answer);
    
    // 更新UI
    this.updateUI();
    
    // 清空输入
    this.messageInput.value = '';
  }

  private updateUI() {
    const conversation = this.tree.getCurrentConversation();
    this.chatHistory.innerHTML = conversation
      .map((node: QAPairNode) => `
        <div class="bg-white p-4 rounded shadow mb-4">
          <div class="text-gray-600 mb-2">
            ${new Date(node.timestamp).toLocaleTimeString()}
          </div>
          <div class="mb-2">
            <span class="font-bold">Q:</span> ${node.question}
          </div>
          <div>
            <span class="font-bold">A:</span> ${node.answer}
          </div>
        </div>
      `)
      .join('');
    
    // 更新树状导航
    this.updateTreeNav();
    
    // 更新图形视图
    this.updateGraphView();
  }

  private updateTreeNav() {
    const treeData = this.tree.getTreeData();
    this.treeNav.innerHTML = treeData
      .map((node: QAPairNode) => `
        <div class="p-2 hover:bg-gray-100 cursor-pointer" 
             style="margin-left: ${this.getNodeLevel(node)}em;" 
             onclick="window.app.navigateTo('${node.id}')">
          ${node.question.substring(0, 20)}...
        </div>
      `)
      .join('');
  }

  private getNodeLevel(node: QAPairNode): number {
    let level = 0;
    let currentId: NodeID | null = node.parentId;

    while (currentId) {
        const parentNode = this.tree.getNode(currentId);
        if (parentNode) {
            level++;
            currentId = parentNode.parentId;
        } else {
            break;
        }
    }

    return level;
  }

  public navigateTo(nodeId: string) {
    this.tree.navigateTo(nodeId);
    this.updateUI();
  }

  private updateGraphView() {
    const treeData = this.tree.getTreeData();
    this.graphView.render(treeData, (nodeId: string) => {
      this.navigateTo(nodeId);
    });
  }
}

// 创建全局实例以供导航使用
declare global {
  interface Window {
    app: AppUI;
  }
}

window.app = new AppUI();
export {};  // 添加导出声明使文件成为模块