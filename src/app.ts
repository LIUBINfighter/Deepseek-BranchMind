import { ConversationTree, NodeID, QAPairNode } from './qa-models';
import { GraphView } from './graph-view';
import { ChatBubble } from './chat-view';

class AppUI {
  private tree: ConversationTree;
  private treeNav: HTMLElement;
  private chatHistory: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendButton: HTMLElement;
  private graphView: GraphView;
  private apiUrlInput: HTMLInputElement;
  private modelNameInput: HTMLInputElement;
  private apiKeyInput: HTMLInputElement;

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
    this.apiKeyInput = document.getElementById('api-key') as HTMLInputElement;

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
      this.toggleModal('settings-modal', 'none'); // 隐藏模态框
    });
    
    // 绑定删除所有配置文件按钮事件
    const deleteAllConfigsButton = document.getElementById('delete-all-configs')!;
    deleteAllConfigsButton.addEventListener('click', () => {
        const confirmDelete = confirm('您确定要删除所有配置文件吗？此操作无法撤销。');
        if (confirmDelete) {
            for (const key in localStorage) {
                if (key.startsWith('config_')) {
                    localStorage.removeItem(key); // 删除所有配置文件
                }
            }
            this.updateConfigDropdown(); // 更新下拉菜单
            console.log('所有配置文件已删除。'); // 提示用户
        }
    });
    
    // 绑定清除本地存储按钮事件
    const clearLocalStorageButton = document.getElementById('clear-local-storage')!;
    clearLocalStorageButton.addEventListener('click', () => {
        const confirmDelete = confirm('您确定要删除所有本地存储数据吗？此操作无法撤销。');
        if (confirmDelete) {
            localStorage.clear(); // 清除所有本地存储数据
            this.updateConfigDropdown(); // 更新下拉菜单
            console.log('所有本地存储数据已清除。'); // 提示用户
        }
    });
    
    // 绑定控制台命令
    this.bindConsoleCommands();
    
    // 初始化显示
    this.updateUI();
  }

  private loadSettings() {
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:11434/api/chat';
    const modelName = localStorage.getItem('modelName') || 'deepseek-r1';
    
    this.apiUrlInput.value = apiUrl;
    this.modelNameInput.value = modelName;

    // 加载特定API地址的配置
    const configKey = `config_${apiUrl}`;
    const config = localStorage.getItem(configKey);
    if (config) {
        const parsedConfig = JSON.parse(config);
        this.apiUrlInput.value = parsedConfig.apiUrl;
        this.modelNameInput.value = parsedConfig.modelName;
    }

    // 更新下拉菜单以显示存储的配置文件
    this.updateConfigDropdown();
  }

  private updateConfigDropdown() {
    const configInput = document.getElementById('config-select') as HTMLInputElement;
    const configOptions = document.getElementById('config-options') as HTMLDataListElement;

    // 清空现有选项
    configOptions.innerHTML = '';

    // 获取所有存储的配置文件并渲染到下拉菜单
    for (const key in localStorage) {
        if (key.startsWith('config_')) {
            const config = JSON.parse(localStorage.getItem(key)!);
            const option = document.createElement('option');
            option.value = key; // 存储的配置文件名
            option.textContent = config.apiUrl; // 显示API地址
            configOptions.appendChild(option); // 添加到下拉列表
        }
    }

    // 绑定新建配置文件按钮事件
    const addConfigButton = document.getElementById('add-config')!;
    addConfigButton.addEventListener('click', () => {
        const newConfigName = configInput.value.trim();
        if (newConfigName) {
            const newConfigKey = `config_${newConfigName}`;
            const newConfig = {
                apiUrl: this.apiUrlInput.value,
                modelName: this.modelNameInput.value
            };
            localStorage.setItem(newConfigKey, JSON.stringify(newConfig)); // 存储新配置
            this.updateConfigDropdown(); // 更新下拉菜单
            configInput.value = ''; // 清空输入框
        }
    });

    // 绑定输入框的变化事件
    configInput.addEventListener('input', () => {
        const selectedConfigKey = configInput.value;
        const selectedConfig = JSON.parse(localStorage.getItem(selectedConfigKey)!);
        if (selectedConfig) {
            this.apiUrlInput.value = selectedConfig.apiUrl;
            this.modelNameInput.value = selectedConfig.modelName;
        }
    });

    // 绑定输入框的回车事件
    configInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addConfigButton.click(); // 模拟点击新建配置文件按钮
        }
    });
  }

  private saveSettings() {
    const apiUrl = this.apiUrlInput.value.trim();
    const modelName = this.modelNameInput.value.trim();
    
    // 获取当前选择的API地址
    const selectedApiUrl = this.apiUrlInput.value;

    // 存储不同配置文件的逻辑
    const configKey = `config_${selectedApiUrl}`;
    const config = {
        apiUrl: apiUrl,
        modelName: modelName
    };
    
    localStorage.setItem(configKey, JSON.stringify(config)); // 存储配置

    // 更改按钮文字为"保存成功"
    const saveButton = document.getElementById('save-settings') as HTMLButtonElement;
    saveButton.textContent = '保存成功';
    
    // 可选：设置一个定时器，几秒后恢复原文字
    setTimeout(() => {
        saveButton.textContent = '保存设置';
    }, 2000);
  }

  private async handleSend() {
    console.log('发送按钮被点击'); // 调试信息：按钮点击事件
    const question = this.messageInput.value.trim();
    console.log('用户输入的问题:', question); // 调试信息：用户输入的问题
    if (!question) {
        console.warn('输入为空，未发送请求'); // 调试信息：输入为空
        return;
    }

    const apiUrl = this.apiUrlInput.value.trim();
    const modelName = this.modelNameInput.value.trim();
    console.log('API URL:', apiUrl); // 调试信息：API URL
    console.log('模型名称:', modelName); // 调试信息：模型名称

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKeyInput.value.trim()}` // 添加认证
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: question
                    }
                ],
                stream: false // 非流式响应
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.message?.content || data.answer; // 根据 API 返回格式获取内容

        // 添加问题节点
        const currentNode = this.tree.getCurrentConversation().slice(-1)[0];

        // 检查是否是第一个问题，如果是，则创建根节点
        let questionNodeId;
        if (this.tree.getCurrentConversation().length === 0) {
            // 创建根节点
            questionNodeId = this.tree.addNode(null, question, true); // 第一个问题成为根节点
        } else {
            questionNodeId = this.tree.addNode(currentNode.id, question, true); // 其他问题添加到当前节点
        }
        
        this.tree.addNode(questionNodeId, answer, false);

        // 更新UI
        this.updateUI();
        this.messageInput.value = ''; // 清空输入框
        console.log('问题和答案已添加到对话树'); // 调试信息：节点添加成功
    } catch (error) {
        console.error('请求失败:', error);
    }

    this.messageInput.value = ''; // 清空输入框
  }

  // 添加 Markdown 解析函数
  private parseMarkdown(content: string): string {
    // 使用 marked 库解析 Markdown
    if (!content) return '';
    return marked.parse(content, {
      gfm: true, // 启用 GitHub 风格的 Markdown
      breaks: true, // 启用换行符
      sanitize: false, // 允许 HTML
      highlight: function(code, lang) {
        // 如果设置了语言，使用 highlight.js
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (__) {}
        }
        return code; // 使用默认的代码格式
      }
    });
  }

  private updateUI() {
    const conversation = this.tree.getCurrentConversation();
    this.chatHistory.innerHTML = conversation
      .map((node: QAPairNode) => `
        <div class="chat-bubble ${node.type}" data-node-id="${node.id}">
          <div class="timestamp">
            ${new Date(node.timestamp).toLocaleTimeString()}
          </div>
          <div class="chat-content">
            <span class="font-bold">${node.type === 'question' ? 'Q:' : 'A:'}</span>
            ${node.type === 'answer' ? this.parseMarkdown(node.content) : node.content}
          </div>
          <div class="chat-actions">
            <button class="action-btn copy-btn" title="复制内容">
              <i class="fas fa-copy"></i>
            </button>
            <button class="action-btn edit-btn" title="编辑消息">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="删除消息">
              <i class="fas fa-trash"></i>
            </button>
            <button class="action-btn share-btn" title="分享消息">
              <i class="fas fa-share"></i>
            </button>
          </div>
        </div>
      `)
      .join('');

    // 绑定按钮事件
    this.bindChatBubbleActions();
    this.updateTreeNav();
    this.updateGraphView();
  }

  private bindChatBubbleActions() {
    const chatBubbles = document.querySelectorAll('.chat-bubble');
    
    chatBubbles.forEach(bubble => {
        const nodeId = bubble.getAttribute('data-node-id')!;
        const content = bubble.querySelector('.chat-content')!.textContent!;
        
        // 复制按钮事件
        bubble.querySelector('.copy-btn')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(content.trim());
                this.showToast('复制成功');
            } catch (err) {
                this.showToast('复制失败', 'error');
            }
        });

        // 编辑按钮事件
        bubble.querySelector('.edit-btn')?.addEventListener('click', () => {
            const newContent = prompt('编辑内容:', content);
            if (newContent && newContent !== content) {
                this.editMessage(nodeId, newContent);
            }
        });

        // 删除按钮事件
        bubble.querySelector('.delete-btn')?.addEventListener('click', () => {
            if (confirm('确定要删除这条消息吗？')) {
                this.deleteMessage(nodeId);
            }
        });

        // 分享按钮事件
        bubble.querySelector('.share-btn')?.addEventListener('click', () => {
            this.shareMessage(content);
        });
    });
}

private editMessage(nodeId: string, newContent: string) {
    this.tree.updateNodeContent(nodeId, newContent);
    this.updateUI();
    this.showToast('更新成功');
}

private deleteMessage(nodeId: string) {
    this.tree.deleteNode(nodeId);
    this.updateUI();
    this.showToast('删除成功');
}

private shareMessage(content: string) {
    if (navigator.share) {
        navigator.share({
            title: 'BranchMind对话分享',
            text: content,
        })
        .then(() => this.showToast('分享成功'))
        .catch((err) => {
            console.error('分享失败:', err);
            this.showToast('分享失败', 'error');
        });
    } else {
        navigator.clipboard.writeText(content)
            .then(() => this.showToast('已复制到剪贴板，请手动分享'))
            .catch(() => this.showToast('复制失败', 'error'));
    }
}

private showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

  private updateTreeNav() {
    const treeData = this.tree.getTreeData();
    const nodeMap = new Map<NodeID, QAPairNode>();
    treeData.forEach(node => nodeMap.set(node.id, node));

    // 使用 DFS 栈存储 [节点ID, 当前层级]
    const stack: Array<[NodeID, number]> = [['root', 0]];
    const processedNodes = new Set<NodeID>();
    let html = '';

    while (stack.length > 0) {
        const [currentId, currentLevel] = stack.pop()!;
        if (processedNodes.has(currentId)) continue;
        processedNodes.add(currentId);

        const currentNode = nodeMap.get(currentId);
        if (!currentNode) continue;

        // 修改这里：根据节点类型添加不同的样式类
        const nodeClass = currentNode.type === 'question' ? 'node-question' : 'node-answer';
        html += `
            <div class="node ${nodeClass}" 
                 style="margin-left: ${currentLevel}em;" 
                 onclick="window.app.navigateTo('${currentId}'); return false;">
              <span class="font-bold">${currentNode.type === 'question' ? 'Q:' : 'A:'}</span> ${currentNode.title}
            </div>
        `;

        // 先处理子节点
        for (let i = currentNode.children.length - 1; i >= 0; i--) {
            const childId = currentNode.children[i];
            stack.push([childId, currentLevel + 1]);
        }
    }

    this.treeNav.innerHTML = html;
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
    console.log('Navigating to node:', nodeId); // 调试信息
    if (!this.tree) {
      console.error('Tree is not initialized');
      return;
    }
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
    modal.style.display = display; // 控制模态框的显示或隐藏
  }

  // 在模态框打开时调用此方法以更新下拉菜单
  public openSettingsModal() {
    this.updateConfigDropdown(); // 更新下拉菜单
    this.toggleModal('settings-modal', 'block'); // 显示模态框
  }

  private bindConsoleCommands() {
    // 监听控制台输入
    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'l') { // 使用 Ctrl + L 作为命令触发
        this.logAllNodes();
      }
    });
  }

  private logAllNodes() {
    const allNodes = this.tree.getTreeData();
    console.log('当前所有节点的数据:', allNodes);
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