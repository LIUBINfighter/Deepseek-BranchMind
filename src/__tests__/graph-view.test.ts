import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GraphView } from '../graph-view';
import { QAPairNode } from '../qa-models';

describe('GraphView', () => {
  let container: HTMLDivElement;
  let graphView: GraphView;

  // 测试数据
  const mockNodes: QAPairNode[] = [
    {
      id: 'root',
      parentId: null,
      question: '根节点问题',
      answer: '根节点答案',
      children: ['child1', 'child2'],
      timestamp: Date.now()
    },
    {
      id: 'child1',
      parentId: 'root',
      question: '子节点1问题',
      answer: '子节点1答案',
      children: ['grandchild1'],
      timestamp: Date.now()
    },
    {
      id: 'child2',
      parentId: 'root',
      question: '子节点2问题',
      answer: '子节点2答案',
      children: [],
      timestamp: Date.now()
    },
    {
      id: 'grandchild1',
      parentId: 'child1',
      question: '孙节点1问题',
      answer: '孙节点1答案',
      children: [],
      timestamp: Date.now()
    }
  ];

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    graphView = new GraphView('test-container');
  });

  afterEach(() => {
    // 清理测试容器
    document.body.removeChild(container);
  });

  it('should create SVG container', () => {
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render correct number of nodes', () => {
    let clickedNodeId = '';
    graphView.render(mockNodes, (nodeId: string) => {
      clickedNodeId = nodeId;
    });

    const nodes = container.querySelectorAll('.node');
    expect(nodes.length).toBe(mockNodes.length);
  });

  it('should render correct number of links', () => {
    graphView.render(mockNodes, () => {});
    const links = container.querySelectorAll('.link');
    // 应该有3个连接：root->child1, root->child2, child1->grandchild1
    expect(links.length).toBe(3);
  });

  it('should handle node click events', () => {
    let clickedNodeId = '';
    graphView.render(mockNodes, (nodeId: string) => {
      clickedNodeId = nodeId;
    });

    // 模拟点击第一个节点
    const firstNode = container.querySelector('.node circle');
    firstNode?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(clickedNodeId).toBe('root');
  });

  it('should update when data changes', () => {
    // 首次渲染
    graphView.render(mockNodes, () => {});
    const initialNodes = container.querySelectorAll('.node');
    
    // 使用更少的节点重新渲染
    const lessNodes = mockNodes.slice(0, 2);
    graphView.render(lessNodes, () => {});
    const updatedNodes = container.querySelectorAll('.node');
    
    expect(updatedNodes.length).toBe(lessNodes.length);
  });
}); 