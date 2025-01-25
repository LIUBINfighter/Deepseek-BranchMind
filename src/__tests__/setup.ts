import '@testing-library/jest-dom';

// 模拟 D3 的 SVG 功能
vi.mock('d3', async () => {
  const actual = await vi.importActual('d3');
  return {
    ...actual,
    // 添加任何需要模拟的 D3 功能
    forceSimulation: () => ({
      force: () => ({ id: () => ({}) }),
      nodes: () => ({ on: () => ({}) }),
      alpha: () => ({ restart: () => {} })
    }),
    drag: () => ({
      on: () => ({})
    })
  };
}); 