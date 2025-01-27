import { ConversationTree, NodeID, QAPairNode } from './qa-models';
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
    
    // 绑定切换布局事件
    const switchLayoutButton = document.getElementById('switch-layout')!;
    switchLayoutButton.addEventListener('click', () => {
        this.graphView.toggleLayout(); // 切换布局
        this.updateGraphView(); // 更新图形视图
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
        <div class="chat-message">
          <div class="timestamp">
            ${new Date(node.timestamp).toLocaleTimeString()}
          </div>
          <div class="question">
            <span class="font-bold">Q:</span> ${node.question}
          </div>
          <div class="answer">
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
    const buildTree = (parentId: NodeID | null) => {
      return treeData
        .filter(node => node.parentId === parentId)
        .map(node => {
          const levelClass = node.parentId === null ? 'root' : `level-${this.getNodeLevel(node)}`;
          return `
            <div class="node ${levelClass}" 
                 style="margin-left: ${this.getNodeLevel(node)}em;" 
                 onclick="window.app.navigateTo('${node.id}')">
              ${node.question.substring(0, 20)}...
            </div>
            <div class="children">
              ${buildTree(node.id)}
            </div>
          `;
        })
        .join('');
    };

    this.treeNav.innerHTML = buildTree(null);
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

  public toggleLayout() {
    this.layout = this.layout === 'vertical' ? 'horizontal' : 'vertical'; // 切换布局
    this.updateGraph(); // 重新渲染图形
  }

  private updateGraph(nodes: QAPairNode[], onNodeClick: (nodeId: string) => void) {
    const d3Nodes: D3Node[] = nodes.map(node => ({
        id: node.id,
        question: node.question,
        parentId: node.parentId
    }));

    const root = d3.stratify<D3Node>()
        .id(d => d.id)
        .parentId(d => d.parentId)(d3Nodes);

    const treeLayout = d3.tree<D3Node>().size([this.height, this.width]);
    treeLayout(root);

    this.g.selectAll('*').remove(); // 清除现有内容

    // 绘制连接线
    const links = this.g.append('g')
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('class', 'link')
        .attr('d', this.layout === 'vertical' 
            ? d3.linkVertical<D3Link>().x(d => d.y).y(d => d.x)
            : d3.linkHorizontal<D3Link>().x(d => d.x).y(d => d.y)
        );

    // 创建节点组
    const nodeGroups = this.g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .on('click', (event, d) => {
            event.stopPropagation();
            onNodeClick(d.id);
        });

    // 添加节点圆圈
    nodeGroups.append('circle')
        .attr('r', 10)
        .attr('fill', '#4B5563')
        .attr('stroke', '#1F2937')
        .attr('stroke-width', 2);

    // 添加节点文本
    nodeGroups.append('text')
        .text(d => d.data.question.substring(0, 10) + '...')
        .attr('dy', 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1F2937');
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