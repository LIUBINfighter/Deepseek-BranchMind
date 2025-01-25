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
  private simulation: d3.Simulation<D3Node, D3Link>;
  private g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

  constructor(containerId: string) {
    const container = document.getElementById(containerId)!;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // 创建SVG容器
    this.svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, this.width, this.height]);

    // 添加缩放和平移功能
    this.g = this.svg.append('g');
    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // 初始化力导向图模拟
    this.simulation = d3.forceSimulation<D3Node>()
      .force('link', d3.forceLink<D3Node, D3Link>().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(50));
  }

  public render(nodes: QAPairNode[], onNodeClick: (nodeId: string) => void) {
    const d3Nodes: D3Node[] = nodes.map(node => ({
      id: node.id,
      question: node.question,
      parentId: node.parentId
    }));

    const d3Links: D3Link[] = nodes
      .filter(node => node.parentId !== null)
      .map(node => ({
        source: node.parentId!,
        target: node.id
      }));

    // 清除现有内容
    this.g.selectAll('*').remove();

    // 绘制连接线
    const links = this.g.append('g')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('class', 'link');

    // 创建节点组
    const nodeGroups = this.g.append('g')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .attr('class', 'node')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
      });

    // 添加节点圆圈
    nodeGroups.append('circle')
      .attr('r', 20)
      .attr('fill', '#4B5563')
      .attr('stroke', '#1F2937')
      .attr('stroke-width', 2);

    // 添加节点文本
    nodeGroups.append('text')
      .text(d => d.question.substring(0, 10) + '...')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1F2937');

    // 更新模拟
    this.simulation.nodes(d3Nodes)
      .on('tick', () => {
        links
          .attr('x1', d => (d.source as D3Node).x!)
          .attr('y1', d => (d.source as D3Node).y!)
          .attr('x2', d => (d.target as D3Node).x!)
          .attr('y2', d => (d.target as D3Node).y!);

        nodeGroups
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

    (this.simulation.force('link') as d3.ForceLink<D3Node, D3Link>)
      .links(d3Links);

    // 重新启动模拟
    this.simulation.alpha(1).restart();
  }

  private drag(simulation: d3.Simulation<D3Node, D3Link>) {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGGElement, D3Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
} 