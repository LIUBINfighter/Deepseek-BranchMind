import { ConversationTree, NodeID, QAPairNode } from './qa-models';
import { GraphView } from './graph-view';

class AppUI {
  private tree: ConversationTree;
  private treeNav: HTMLElement;
  private chatHistory: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendButton: HTMLElement;
  private graphView: GraphView;
  private apiUrlInput: HTMLInputElement;
  private modelNameInput: HTMLInputElement;

  constructor() {
    this.tree = new ConversationTree();
    
    // 获取DOM元素
    this.treeNav = document.getElementById('tree-nav')!;
    this.chatHistory = document.getElementById('chat-history')!;
    this.messageInput = document.getElementById('message-input') as HTMLInputElement;
    this.sendButton = document.getElementById('send-btn')!;
    
    // 获取设置元素
    this.apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
    this.modelNameInput = document.getElementById('model-name') as HTMLInputElement;

    // 加载配置
    this.loadSettings();

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
    
    // 绑定保存设置事件
    document.getElementById('save-settings')!.addEventListener('click', () => this.saveSettings());
    
    // 绑定参数按钮事件
    document.getElementById('set-parameters')!.addEventListener('click', () => {
      this.toggleModal('settings-modal', 'block'); // 显示模态框
    });

    // 绑定关闭按钮事件
    document.getElementById('close-settings')!.addEventListener('click', () => {
      console.log('关闭按钮被点击');
      const modal = document.getElementById('settings-modal')!;
      modal.style.display = 'none'; // 直接设置 display 为 none
      console.log('模态框已隐藏');
    });
    
    // 初始化显示
    this.updateUI();
  }

  private loadSettings() {
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:11434/api/chat';
    const modelName = localStorage.getItem('modelName') || 'deepseek-r1';
    
    this.apiUrlInput.value = apiUrl;
    this.modelNameInput.value = modelName;
  }

  private saveSettings() {
    const apiUrl = this.apiUrlInput.value.trim();
    const modelName = this.modelNameInput.value.trim();
    
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('modelName', modelName);
    alert('设置已保存！');
  }

  private async handleSend() {
    const question = this.messageInput.value.trim();
    if (!question) return;

    const apiUrl = this.apiUrlInput.value.trim();
    const modelName = this.modelNameInput.value.trim();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: question
      }),
    });

    console.log('Response Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching AI response:', response.statusText, errorText);
      return;
    }

    const data = await response.json();
    console.log('API Response:', data);
    const answer = data.answer;

    // 添加问题节点
    const currentNode = this.tree.getCurrentConversation().slice(-1)[0];
    const questionNodeId = this.tree.addNode(currentNode.id, question, true);
    this.tree.addNode(questionNodeId, answer, false);

    // 更新UI
    this.updateUI();
    this.messageInput.value = '';
  }

  private updateUI() {
    const conversation = this.tree.getCurrentConversation();
    this.chatHistory.innerHTML = conversation
      .map((node: QAPairNode) => `
        <div class="chat-message ${node.type}">
          <div class="timestamp">
            ${new Date(node.timestamp).toLocaleTimeString()}
          </div>
          <div class="${node.type}">
            <span class="font-bold">${node.type === 'question' ? 'Q:' : 'A:'}</span> ${node.content}
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
            .filter(node => node.parentId === parentId && node.type === 'question') // 只显示问题节点
            .map(node => {
                const levelClass = node.parentId === null ? 'root' : `level-${this.getNodeLevel(node)}`;
                return `
                    <div class="node ${levelClass}" 
                         style="margin-left: ${this.getNodeLevel(node)}em;" 
                         onclick="window.app.navigateTo('${node.id}')">
                      ${node.content.substring(0, 20)}...
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

  private toggleModal(modalId: string, display: string) {
    const modal = document.getElementById(modalId)!;
    modal.style.display = display; // 设置模态框的显示状态
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