import { QAPairNode, NodeID } from './qa-models';
import * as d3 from 'd3';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  question: string;
  parentId: string | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string;
  target: string;
}

export class GraphView {
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private width: number;
  private height: number;
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private layout: 'vertical' | 'horizontal';

  constructor(containerId: string, layout: 'vertical' | 'horizontal' = 'vertical') {
    const container = document.getElementById(containerId)!;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.layout = layout;

    // 创建SVG容器
    this.svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, this.width, this.height])
      .call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 2]) // 设置缩放范围
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform); // 应用缩放和拖拽变换
        }));

    // 添加一个组元素用于绘制图形
    this.g = this.svg.append('g');
  }

  public render(nodes: QAPairNode[], onNodeClick: (nodeId: string) => void) {
    // 清空现有图形
    this.g.selectAll('*').remove();

    // 创建 D3 节点数据
    const d3Nodes: D3Node[] = nodes.map(node => ({
      id: node.id,
      question: node.question,
      parentId: node.parentId,
    }));

    // 使用 D3 的 stratify 方法构建树形结构
    const root = d3.stratify<D3Node>()
      .id(d => d.id)
      .parentId(d => d.parentId)(d3Nodes);

    // 创建树形布局
    const treeLayout = d3.tree<D3Node>().size([this.height, this.width]);
    if (this.layout === 'horizontal') {
      treeLayout.size([this.width, this.height]);
    }
    treeLayout(root);

    // 绘制连接线
    this.g.selectAll('path')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', this.layout === 'horizontal' 
        ? d3.linkHorizontal<D3Link>().x(d => d.y).y(d => d.x)
        : d3.linkVertical<D3Link>().x(d => d.y).y(d => d.x));

    // 创建节点组
    const nodeGroups = this.g.selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
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

  public toggleLayout() {
    this.layout = this.layout === 'vertical' ? 'horizontal' : 'vertical';
  }
}
