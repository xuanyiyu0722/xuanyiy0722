# 网站维护与自动部署

日后只维护 `portfolio-site/` 这一份源码。它来自完成的 v78，保留现有
HTML、CSS、JavaScript、字体、图片、音效和详情页结构。外层旧 React 项目、
历史版本和 ZIP 都未改动。

## 当前状态

- 已建立独立 Git 仓库，默认分支为 `main`。
- 已配置静态资源检查、原样复制的构建步骤、Vercel 配置和 `.gitignore`。
- 已准备并在本机启用推送前检查。
- `origin` 已连接到 `https://github.com/xuanyiyu0722/xuanyiy0722.git`。
  首次导入前已于 2026-11-06 确认远程为空仓库，现已包含正式网站源码。
- GitHub 官方登录和仓库写入权限已验证；提交身份使用该账号的 GitHub noreply 邮箱。
- 首次提交与推送已完成，本地 `main` 已跟踪 `origin/main`。
- Vercel 工作区 `xuanyiyu` 已授权；项目 `alicia-portfolio` 已连接到上述正确仓库。
- 生产分支为 `main`，Node.js 为 `24.x`；首次生产部署已达到 READY，
  来源提交为 `abfb793`（详情页封面与 Gallery 顺序更新）。
- 正式访问地址：https://alicia-portfolio-three.vercel.app/
- Vercel 控制台：https://vercel.com/xuanyiyu/alicia-portfolio
- 后续发布使用 Vercel 的 GitHub 集成，不依赖本机 Vercel CLI 登录。
  团队预览地址可能需要 Vercel 登录，给访客分享上面的正式地址。
  原有连接到 `xuanyiy_0722`（带下划线）的项目保持不变；它不是本项目的部署目标。
- 实际连接信息以 `git remote -v`、Git 历史和 Vercel 控制台为准，
  不要把 Token 写到本文或其他文件中。

## 项目结构

```text
index.html                  首页入口
gallery.html / about.html   Gallery 与 About
projects/                   四个作品详情页和原有交互
assets/                     图片、字体、音效、嵌入原型、本地第三方库
*.css / *.js                原有页面样式与交互
scripts/                    部署检查和原样复制脚本
.githooks/pre-push          本机推送前检查
vercel.json                 Vercel 静态部署配置
dist/                       自动生成的发布目录，不入 Git，不手动修改
```

## 首次连接 GitHub

1. 提供要使用的 GitHub Repository URL，并通过官方登录授权账号。无需把
   Token、密码或私钥粘贴到聊天中。提交者姓名/邮箱使用经确认的 GitHub 身份，
   可以使用 GitHub 提供的 noreply 邮箱。
2. Codex 先只读检查远程分支和文件。空仓库可以直接首次提交；已有仓库要保留
   其历史和代码，先检查差异，再决定如何合并。不要强推或直接覆盖远程。
3. 在当前仓库配置 `origin` 和仓库级提交身份，完成检查后首次提交、推送
   `main`，并验证远程提交 SHA 与本地一致。
4. 新克隆本项目后运行 `npm run setup:git`，启用本机推送检查。

## Vercel 一次性配置

以下连接已经完成，日常修改无需重新导入：GitHub 仓库 `xuanyiyu0722/xuanyiy0722`
连接到 `xuanyiyu` 工作区的 `alicia-portfolio`。不要改用另一个带下划线的仓库。
本地 `.vercel/project.json` 只保存项目 ID 和工作区 ID，已忽略，不随 ZIP 或 Git 上传。

| 设置 | 值 |
| --- | --- |
| Root Directory | 仓库根目录 `.` |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | 留空，无依赖需要安装 |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `main` |
| 环境变量 | 当前网站不需要 |

`vercel.json` 固定框架、构建和发布目录，避免被识别成外层旧 React 项目。
`cleanUrls` 保持关闭，现有 `.html` 链接可继续使用。没有添加 SPA 的全站
rewrite，详情页和嵌入原型保持独立 HTML 入口。

构建只发布现有网页及资源，不公开 Git 配置、维护文档和脚本。
源码约 475 MiB，最大单文件约 26.5 MiB；没有达到 GitHub 100 MiB 单文件限制。
采用 GitHub → Vercel 导入；不要改成直接上传整份源码的 Vercel CLI 部署，
其 Hobby 上传总量限制为 100 MB。图片保持原样，本次未进行压缩或删除。

## 每次修改后的固定流程

1. Codex 在这个目录修改，查看差异并检查适合该修改的交互。
2. 运行 `npm run build`。任何缺失资源、大小写错误或 JS 语法错误都必须先修好。
3. Fetch 远程，检查 `main` 是否有别人新增的提交。保留远程改动及用户工作。
4. 只暂存这次任务的文件，提交并 `git push origin main`。已获得用户长期授权，
   常规更新不再逐次询问是否推送。推送钩子会再检查工作区和构建。
5. Vercel 的 Git 集成为新的 main 提交部署。检查部署状态，确认 Ready 后再
   报告上线成功；失败时根据日志修复，不能把推送成功说成部署成功。

不使用后台文件监听自动提交：未完成的修改不会因保存文件就发布。任务完成、
通过检查后的提交才会触发部署。需要回退线上版本时，先确认目标，再使用
`git revert` 生成可追踪的新提交，保留原有历史。

## 常用本地命令

```sh
npm run check
npm run build
npm run setup:git
python3 -m http.server 8000 --directory dist
```

预览服务只在需要查看页面时启动。浏览器被当前 Work 设置禁用时，Codex 会
完成静态检查并说明交互验证的限制。

配置依据：[Vercel 构建设置](https://vercel.com/docs/builds/configure-a-build)、
[Vercel GitHub 集成](https://vercel.com/docs/git/vercel-for-github)、
[Vercel 限制](https://vercel.com/docs/limits)、
[GitHub 大文件说明](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)。
