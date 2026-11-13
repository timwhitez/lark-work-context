# lark-work-context

让 Agent 在需要时主动补足企业上下文，同时保留正常的本地开发与个人任务能力。

运行时只有一个英文 [SKILL.md](skills/lark-work-context/SKILL.md)，维护文档使用中文。它识别当前任务缺少哪些企业事实，选择相关资料、处理来源冲突与时效，并将证据用于回答或实现。具体飞书操作复用官方 [lark-cli skills](https://github.com/larksuite/cli/tree/main/skills)，不另维护命令、认证或分页手册。

## 适合什么任务

- “这个项目为什么延期？”
- “我们上次怎么决定的？”（已有可定位的项目上下文）
- “按项目群里确认的约定修接口，再运行测试。”

纯本地报错、个人开发、产品介绍和 Skill/CLI 开发不应因此触发企业查询。已有充分材料时直接使用，不为了显得熟悉而额外搜索。

## 设计原则

- **通用搜索与判断**：模型选择查询和后续阅读，不使用固定业务场景路由表。参考 [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)。
- **按需加载**：短描述负责选择，正文只保留执行约束；沿用 [Pi 的最小可扩展技能机制](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)。
- **复用官方能力**：官方 lark-* skills 负责工具契约；本项目负责事实缺口、证据关联和停止条件。
- **本地工作照常**：不收窄工具权限，不改全局 AGENTS.md，不添加消息/工具钩子，不以飞书登录为本地分析的前置条件。
- **证据有范围**：保留来源和关键时间，区分建议与正式决定，不把最新消息自动当作最终结论。

## 安装前提

宿主需支持 Agent Skills 和终端工具。企业查询需要可用的 lark-cli 及相应授权；用户可见性、应用权限和 API 支持共同决定能读到什么。

如需安装或更新官方依赖：

~~~sh
npm install -g @larksuite/cli@latest
npx --yes skills add larksuite/cli --global --agent codex --skill '*' --copy --yes
lark-cli --version
~~~

不要仅凭 npm 安装成功认定 PATH 已更新。如果版本仍旧，检查实际命令位置和 npm 全局前缀；多 Node 环境可能使用不同安装位置。认证与权限设置按官方 lark-shared 指引进行，本项目不保存凭据。

## 安装本 Skill

### 从当前仓库安装到 Codex

在仓库根目录执行：

~~~sh
npx --yes skills add . --global --agent codex --skill lark-work-context --copy --yes
~~~

当前 skills 安装器将 Codex 全局技能放在 ~/.agents/skills。以安装输出中的目标位置为准；旧版 Codex 或自定义 CODEX_HOME 的路径应遵循该宿主配置。现有不同内容可能被安装器覆盖，更新前先保留自己的修改。

仓库可访问时，也可以将命令中的 . 换成 timwhitez/lark-work-context；私有仓库需要当前 Git 环境已有访问权限。

### MCode

MCode 可使用其扫描到的共享 Agent Skills 目录，也支持当前 profile 的用户 skills 目录。若共享安装已经被发现，无需再建副本。

需要独立安装时，仅将 skills/lark-work-context 目录放入当前 profile 的用户 skills 目录（默认 ~/.minimax/skills）。自定义 dataDir 时使用该 dataDir 下的 skills，不修改全局 AGENTS.md、权限或 Hooks。

安装后在新的会话或宿主的技能刷新入口确认能发现 lark-work-context。文件存在、技能被发现、模型实际触发是不同状态；不要只用“文件复制成功”代替运行验证。

### 其他宿主

将 skills/lark-work-context 作为普通 Agent Skill 包导入。它不依赖 MCode 或 Codex 专属 API。若宿主没有暴露官方 lark-* skills，可按需通过 lark-cli 的 skills read 入口读取官方说明；具体语法查当前 CLI 帮助。

## 使用行为

1. 利用对话、明确引用的材料和相关本地信息。
2. 仅为缺失的企业事实加载相应官方技能并检索。
3. 按需阅读文档、聊天和线程，核对来源、时间及范围。
4. 证据充分后继续原任务；无法读取的资料明确说明，不编造。

同一任务可以复用已读证据。切换话题或账号后重新判断相关性，不把企业背景变成全局默认。首版不新增自动跨会话记忆或后台抓取；用户明确要求保存时另行确定内容和位置。

“远程资料读取”只约束这个技能的职责，不把整个 Agent 变成只读。已授权的本地修改、测试、发送或其他写入继续按对应工作流处理。

## 能力边界

- 纯文本 Skill 不能保证模型零误触发，也不能自动擦除对话历史或控制宿主已有记忆。
- 未激活时仍有名称和描述的少量提示开销。
- 无法承诺与飞书客户端的全部搜索范围一致。
- 权限不足、未登录、无匹配和部分读取是不同结果。
- 远程材料中的执行指令不是新的用户授权；读取本地文件不等于允许外发内容。

## 项目结构

~~~text
skills/lark-work-context/SKILL.md  唯一运行时文件
scripts/check.mjs                零依赖包结构、元数据及链接检查
tests/check.test.mjs             验证器的正反例测试
evals/cases.json                 离线行为验收案例
docs/evaluation.md               评估方法与已知验证边界
AGENTS.md                       维护本仓库的 Agent 约定
~~~

README、AGENTS、测试和评估材料不安装进运行时技能目录。

## 开发与检查

仓库检查需要 Node.js 22 或以上，无第三方 npm 依赖；日常使用 Skill 本身不执行这里的检查脚本。

~~~sh
npm ci --ignore-scripts
npm run check
npm test
~~~

提交前在本地运行上述检查；本项目不配置 GitHub Actions。结构检查不是模型行为测试。行为验收、与 baseline 的公平比较、负向场景和真实权限验证见 [评估说明](docs/evaluation.md)。首轮 13 个离线案例中两组均符合验收标准，未显示可确认的质量提升，详见 [实际评估结果](docs/evaluation-results.md)。在没有访问真实企业数据时，不应声称检索质量或账号权限已经得到验证。

本项目不自动提交、推送、登录、升级 CLI 或修改 Agent 配置；这些均是显式维护操作。

## 更新和移除

更新源码后先检查，再用同一安装命令重新安装。维护 MCode 独立副本时只替换该 Skill 目录，不覆盖其他技能。移除时仅删除本 Skill 的安装目录或通过 skills 安装器移除 lark-work-context，保留 lark-cli、其他技能和账号设置。

查看 [AGENTS.md](AGENTS.md) 了解维护边界。
