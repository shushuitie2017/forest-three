# forest-three（神秘森林）接手文档

> 更新：2026-07-12。依据：本仓库 CLAUDE.md / README.md / package.json / vite.config.ts / .github/workflows/deploy-pages.yml / LICENSE / 实际目录。

## §定位与状态

**神秘森林 · 体素探险**：用 Three.js 手搓的 2.5D 体素风浏览器小游戏/夜游场景。整片森林（草地、泥路、石桥、溪流、巨树、发光水晶、灯笼、星尘）由噪声函数即时生成，没有预制地图；玩家操纵持灯旅人，身后跟着盗贼/剑士/法师三位伙伴按足迹排队跟随。无关卡无目标，纯漫步观景。

- **非 fork**：CLAUDE.md 明确为「手搓」自建项目，LICENSE 版权行只有 BlueCat (shushuitie2017)，无上游归属。
- **状态**：已上线 GitHub Pages（README 顶部即在线链接）。无后端、无数据库，纯静态前端。

## §技术架构

| 类别 | 选择 |
|------|------|
| 渲染 | Three.js ^0.177（README 称 r177；WebGL）——几何体/材质/光照/正交相机/OrbitControls |
| 语言 | TypeScript ^5.8（游戏逻辑与输入处理；build 前先 `tsc` 类型检查） |
| 构建 | Vite ^6.4（`base: '/forest-three/'`，对应 Pages 子路径） |
| 环境 | Node 22+、pnpm 8+（锁文件 pnpm-lock.yaml，CI 用 pnpm 8 + Node 22） |

渲染要点（源自 README「有什么好看的」）：
- 噪声函数生成体素地形（草地/泥路/石桥/水面）。
- 自发光材质点亮水晶/灯笼/蘑菇/星尘；ACES 色调映射 + 柔和阴影 + 指数雾 + 半球光营造夜森林。
- 角色为精灵图（旅人 8 向、伙伴 4 向行走图，镜像复用省贴图）；移动方向按当前镜头朝向换算。
- 伙伴跟随 AI：按玩家足迹采样点排队，间距各异；每个角色脚下有跟随软阴影。
- 全部游戏逻辑集中在单文件 `src/main.ts`（地形生成/角色/相机/动画循环）。
- 约定：游戏本体不渲染界面文字，用户可见文案只在 `index.html`（标题、HUD）；贴图/精灵文件名、CSS 类名、元素 ID 是内部标识符，不因语言改动。

## §目录说明

```
index.html                     页面骨架 + 底部操作提示 HUD
src/
├── main.ts                    全部游戏逻辑（地形生成/角色/相机/动画循环）
└── style.css                  全屏画布 + HUD 样式
public/
├── textures/                  地形/水晶/蘑菇贴图图集（PNG）
└── sprites/                   玩家 8 向 + 伙伴 4 向行走精灵图
docs/
├── media/wechat-qr.jpg        README 作者名片微信二维码（原位保留，README 相对路径引用）
└── PROJECT.md                 本文档
screenshot.png                 README 首屏实机截图（仓库根目录）
vite.config.ts                 仅设 base: '/forest-three/'
tsconfig.json / package.json / pnpm-lock.yaml   TS 配置与依赖清单（three 唯一运行时依赖）
dist/                          本地构建产物（已 gitignore；线上由 CI 构建）
CLAUDE.md / README.md / LICENSE  项目说明 / 中文 README / MIT
.github/workflows/deploy-pages.yml  GitHub Pages 构建+部署
.gitignore                     排除 node_modules/dist/servers.json 等
```

⚠️ 待确认：外部记载中提到 docs/ 下有 `plan/` 目录，实际盘点只有 `media/`，不存在 `plan/`。

## §本地运行

```bash
pnpm install
pnpm dev          # 开发服务器（vite --host 127.0.0.1，地址见终端输出）
pnpm build        # tsc 类型检查 + vite build → dist/
pnpm preview      # 本地预览构建产物
```

环境：Node 22+、pnpm 8+。无环境变量、无外部服务依赖。注意 `base` 设为 `/forest-three/`，本地 preview 时需带该子路径访问。

## §部署

- **线上**：https://shushuitie2017.github.io/forest-three/ （GitHub Pages）。依据：README 顶部在线链接 + CLAUDE.md「部署到 GitHub Pages」记载。
- **形态**：GitHub Actions 构建部署（`.github/workflows/deploy-pages.yml`）——push `main` 或 `workflow_dispatch` 触发：pnpm 8 + Node 22 → `pnpm install --frozen-lockfile` → `pnpm build` → `upload-pages-artifact path: dist` → `deploy-pages`。
- 首次开通须在仓库 Settings → Pages → Source 手选「GitHub Actions」（CLAUDE.md 约定，新仓库一次性操作）。
- 本项目**不部署到任何服务器**，故无 servers.json（.gitignore 里预防性排除了该文件名，但仓库中不存在此文件）。
