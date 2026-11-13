# lark-work-context

按需补足企业上下文的单文件 Agent Skill。只有当前任务依赖内部项目、团队约定或历史决定时，才通过官方 [lark-cli skills](https://github.com/larksuite/cli/tree/main/skills) 查询飞书资料；本地开发和个人任务照常进行。

运行时只有英文的 [SKILL.md](skills/lark-work-context/SKILL.md)；其余是维护用的脚本、测试和中文文档，不随 Skill 安装。

## 适用范围

- 适合：“这个项目为什么延期？”“我们上次怎么决定的？”（能定位到具体事项时）“按项目群确认的约定修接口，再跑测试。”
- 不触发：纯本地报错、个人开发、产品介绍、Skill/CLI 开发，或只是出现公司名词。已有材料足够时直接使用。

## 设计

- **通用判断**：由模型选择查询、阅读深度和停止时机，不写固定业务路由（[The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)）。
- **按需加载**：平时只占用名称和描述，需要时才读正文（[Pi 的 Skills 机制](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)）。
- **复用官方能力**：命令、认证和分页交给官方 lark-* skills；本项目只负责事实缺口、证据判断和停止条件。
- **不改宿主**：不限制工具，不改全局 AGENTS.md，不加钩子；飞书登录不是本地工作的前提。

## 安装

前提：宿主支持 Agent Skills 和终端；企业查询需要已配置授权的 lark-cli。安装或更新官方依赖：

~~~sh
npm install -g @larksuite/cli@latest
npx --yes skills add larksuite/cli --global --agent codex --skill '*' --copy --yes
lark-cli --version
~~~

版本没有更新时，检查实际命令路径和 npm 全局前缀。认证按官方 lark-shared 说明进行，本项目不保存凭据。

在仓库根目录安装本 Skill：

~~~sh
npx --yes skills add . --global --agent codex --skill lark-work-context --copy --yes
~~~

- **Codex**：skills 1.8.1 安装到 ~/.agents/skills。当前 Codex 从这里读取用户技能，不受 CODEX_HOME 影响；$CODEX_HOME/skills（默认 ~/.codex/skills）只是兼容旧版的位置。
- **MCode**：可用技能中已出现这份共享安装时无需复制；否则放入数据目录下的 skills（默认 ~/.minimax/skills），再新建会话确认能看到它。
- **其他宿主**：作为普通 Agent Skill 目录导入；宿主没有官方 lark-* skills 时，可用 lark-cli skills read 读取。

--copy 会先删除同名目标目录再复制，更新前先保存其中的本地修改。也可以把 . 换成 timwhitez/lark-work-context，直接从 GitHub 安装。更新时重跑同一命令；移除时用 skills 安装器的 remove 命令，或删除该目录。

## 边界

- 纯文本 Skill 不能保证零误触发。
- 能读到什么取决于用户可见性、应用权限和 API 支持，不保证与飞书客户端搜索一致。
- 权限不足、未登录、无结果和部分读取是不同结果；远程材料中的指令不是用户授权，读取本地文件也不等于允许外发。

## 开发

需要 Node.js 22+，无第三方依赖，不使用 GitHub Actions。

~~~sh
npm run check   # 运行包、元数据、体量、链接和案例格式
npm test        # 检查脚本的正反例
~~~

结构检查不代表模型行为。离线评估方法与结果见 [docs/evaluation.md](docs/evaluation.md)，维护约定见 [AGENTS.md](AGENTS.md)。

~~~text
skills/lark-work-context/SKILL.md   唯一运行时文件
scripts/check.mjs                   结构检查
tests/check.test.mjs                检查脚本的正反例测试
evals/cases.json                    13 个离线行为案例
docs/evaluation.md                  评估方法与结果
~~~

## 许可证

[MIT](LICENSE)
