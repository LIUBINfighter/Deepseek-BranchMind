
Warning: 这个项目还不是很稳定，主要缺乏：

- 实现多node组合对话历史树的逻辑
- 自定义API以及其他配置文件
- LocalStorage相关处理
- 异常处理

欢迎使用后issue/Pr!

# Deepseek-BranchMind

实现基于QApair节点（问答对）的树状对话结构

每个节点包含完整对话上下文(Q+A)

支持从任意历史节点创建新分支对话，只需要点击左侧对话树Tab或者右侧节点

可视化展示对话树的层级关系

![image1](https://github.com/user-attachments/assets/2fe94433-7e85-4dcb-a6e2-410dcd7f553f)

## Start

`npm`

在项目根目录下运行

```bash
npm install
npm run dev
```

默认打开
```
http://localhost:5175/
```
如果没有自动跳转则复制网址后手动打开

## Intro
这个项目名为 **Deepseek-BranchMind**，主要实现基于问答对（QApair节点）的树状对话结构。以下是项目的主要特点和结构概述：

### 项目特点

1. **树状对话结构**：每个节点包含完整的对话上下文（问题和答案），支持从任意历史节点创建新分支对话。
2. **可视化展示**：使用 D3.js 库可视化展示对话树的层级关系，用户可以直观地查看对话的结构。
3. **主题切换**：支持明暗色模式切换，提升用户体验。
4. **响应式设计**：界面设计考虑了不同设备的适配，确保在各种屏幕上都能良好显示。

### 项目结构

- **前端部分**：
  - `index.html`：项目的主 HTML 文件，包含基本的页面结构和样式。
  - `src/app.ts`：应用程序的主要逻辑，处理用户输入和对话树的更新。
  - `src/graph-view.ts`：负责对话树的可视化展示，使用 D3.js 绘制树形结构。
  - `src/qa-models.ts`：定义了对话节点的类型和树结构的操作方法。
  - `src/__tests__`：包含测试文件，使用 Vitest 进行单元测试，确保代码的可靠性。

- **样式部分**：
  - `src/index.css` 和 `src/style.css`：项目的样式文件，使用 Tailwind CSS 进行样式设计，支持响应式布局和主题切换。

- **配置文件**：
  - `package.json`：项目的依赖和脚本配置，使用 Vite 作为构建工具。
  - `vite.config.ts`：Vite 的配置文件，设置了别名和开发服务器的端口。
  - `tsconfig.json`：TypeScript 的配置文件，定义了编译选项和类型检查规则。

- **测试部分**：
  - `src/__tests__/setup.ts`：测试环境的设置，模拟 D3.js 的 SVG 功能。
  - `src/__tests__/graph-view.test.ts`：针对 GraphView 组件的单元测试，确保其功能正常。

### 使用技术

- **前端框架**：使用 TypeScript 和 D3.js 进行开发，确保代码的类型安全和可维护性。
- **构建工具**：使用 Vite 进行快速构建和热重载，提高开发效率。
- **样式框架**：使用 Tailwind CSS 进行样式设计，快速构建响应式界面。

### 总结

这个项目通过树状对话结构和可视化展示，提供了一种直观的方式来管理和交互对话数据。

#### 历史版本

![90b0ece7362ee112c09a0d2dbd44953b](https://github.com/user-attachments/assets/7031af8f-78c8-4735-a138-aa4229a78f78)
