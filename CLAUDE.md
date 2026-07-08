# forest-three · 项目说明

用 Three.js 手搓的 2.5D 体素风「神秘森林」浏览器小游戏。整片森林即时生成，玩家带三位伙伴（盗贼/剑士/法师）在夜色里散步。部署到 GitHub Pages。

## 技术栈

- **Three.js (r177)** — 3D 渲染、几何体、材质、光照、正交相机、OrbitControls
- **TypeScript** — 游戏逻辑与输入处理
- **Vite** — 开发服务器与构建（`base: '/forest-three/'`）
- 无后端、无数据库，纯静态前端

## 目录

```
index.html                → 页面骨架 + 底部操作提示 HUD
src/main.ts               → 全部游戏逻辑（地形生成/角色/相机/动画循环）
src/style.css             → 全屏画布 + HUD 样式
public/textures/          → 地形/水晶/蘑菇的贴图图集（PNG）
public/sprites/           → 玩家 8 向 + 伙伴 4 向行走精灵图
.github/workflows/        → GitHub Pages 自动部署（pnpm build → dist）
```

## 本地开发

```sh
pnpm install
pnpm dev        # 开发服务器
pnpm build      # 生产构建 → dist/
pnpm preview    # 预览构建产物
```

环境：Node 22+、pnpm 8+。

## 约定

- 游戏本体不渲染任何界面文字；用户可见文案只在 `index.html`（标题、HUD）
- 贴图/精灵文件名、CSS 类名、元素 ID 是内部标识符，不因语言改动
- 部署走 `.github/workflows/deploy-pages.yml`，推 `main` 自动构建上线
- 新仓库首次需在 GitHub → Settings → Pages → Source 手动选「GitHub Actions」

## 协议

MIT，见 LICENSE。随便用、随便改、随便造。
