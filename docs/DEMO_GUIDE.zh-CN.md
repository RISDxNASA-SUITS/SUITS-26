# EVA AIA 演示使用说明

**英文版：** [DEMO_GUIDE.md](DEMO_GUIDE.md)

本文面向**演示与试用**：如何在浏览器里操作本项目的「任务台」界面，完成语音/文字指令、查看遥测与程序步骤。技术架构与部署请参阅仓库根目录 [README.md](../README.md)。

---

## 1. 这个 Demo 是什么

- **EVA 风格任务助手（演示）**：用**固定规则**解析指令（**无大语言模型**），带简单**安全护栏**与任务/遥测/程序（YAML）逻辑。
- **语音输入**：浏览器录音 → 服务端 **faster-whisper** 转写 → 归一化 → 与文字指令走**同一套**处理管线。
- **语音输出**：浏览器 **Web Speech API** 朗读助手回复（可开关）。
- **数据**：遥测与任务状态为**内存演示数据**；程序步骤来自后端 `backend/data/procedures/`。

---

## 2. 使用前的环境要求

| 项目 | 说明 |
|------|------|
| 浏览器 | 推荐使用 **Chrome** 或 **Edge**（语音与 TTS 兼容性较好）。 |
| 麦克风 | 语音输入需要授权麦克风；**公网访问请使用 HTTPS**，否则浏览器可能限制 `getUserMedia`。 |
| 网络 | 若部署在云端，首次语音转写可能需下载 Whisper 模型，请稍候。 |
| 后端 | 本地或 Docker 需**同时**运行 API；语音转写依赖服务端 **ffmpeg**（Docker 镜像已包含）。 |

---

## 3. 如何打开界面

### 3.1 本地开发（前后端分离）

1. 启动后端（默认端口 **8000**），见 [backend/README.md](../backend/README.md)。
2. 在 `frontend` 目录执行 `npm run dev`，用终端打印的地址打开（一般为 **http://localhost:5173**）。
3. 前端默认请求 `http://localhost:8000`；若端口不同，可设置环境变量 `VITE_API_ORIGIN`。

### 3.2 本地单容器（推荐快速体验完整能力）

在仓库**根目录**执行：

```bash
docker compose up --build
```

浏览器打开 **http://localhost:8000**（前端静态页与 API 同一地址）。

### 3.3 部署在云平台

使用仓库根目录 **Dockerfile** 构建并发布后，用平台提供的 **HTTPS** 地址访问。部署与 `EVA_CORS_ORIGINS`、内存等说明见 [README.md](../README.md) 中的「Production deployment」一节。

---

## 4. 界面概览（Mission console）

页面为**任务控制台**布局，主要区域包括：

- **顶部**：任务标题、**语音输出（Voice output）** 开关、演示入口等。
- **Command（指令）**：文字输入框；**Mic / Stop** 用于短录音语音输入。
- **Assistant（助手）**：显示结构化回复；语音输入成功时还会显示 **Transcript（转写）** 与 **Normalized（归一化后指令）**。
- **Mission / Telemetry / Procedure / Alerts 等面板**：当前任务阶段、遥测滑条与刷新、当前程序步骤、告警列表等（以实际界面为准）。

---

## 5. 基本操作

### 5.1 文字指令

1. 在 **Command** 输入框输入英文指令（与解析器支持的短语一致，例如状态查询、程序控制等）。
2. 提交后，在 **Assistant** 查看回复；若开启 **Voice output**，且本次为**成功**回复，会朗读 **`response_text`**（护栏拒绝或错误一般不会朗读）。

### 5.2 语音指令

1. 点击 **Mic**，对着麦克风说**简短**一句话（环境尽量安静）。
2. 点击 **Stop** 结束录音。
3. 在 **Assistant** 查看转写与归一化结果；若路由成功，回复与文字指令一致。

**提示**：若转写为空或不准，可尝试吐字清晰、缩短句子；服务端也可通过环境变量调整 Whisper 模型大小与置信度阈值（见 README）。

### 5.3 语音输出（TTS）

- 在顶部打开 **Voice output**（默认多为开启）。
- **Chrome** 等浏览器可能要求**先在页面内点击一次**，合成语音才会播放。
- 检查系统音量、浏览器标签页是否静音。

---

## 6. 推荐演示流程（Demo mode 默认开启时）

默认 **Demo mode** 下，任务阶段常从 **EGRESS** 开始，遥测为演示用合理数值。可按下面顺序体验（指令可为文字或经归一化后的语音）：

1. **氧气状态** — 如：`oxygen status`，或自然口语经归一化后的等价说法。
2. **出舱程序** — `start egress`，再按需 `next step` / `repeat step`。
3. **切换阶段** — 在 **Mission status** 中选择例如 **LTV_REPAIR** 等，并 **Set phase**。
4. **ERM** — `start erm` 或 `start repair`。
5. **诊断** — `run diagnosis`（行为与当前遥测/阶段相关，以界面为准）。
6. **告警** — `any warnings` 或观察 **Alerts** 面板。
7. **返航引导** — 将任务阶段设为 **EVA_NAV** 或 **INGRESS** 等后，尝试 `guide me back` 或 `return route`。

可在 **Telemetry** 面板调节滑条并刷新，观察 **Alerts** 变化。

---

## 7. 常见问题

| 现象 | 建议 |
|------|------|
| 语音按钮无反应或无法录音 | 确认已授权麦克风；公网必须使用 **HTTPS**；换 Chrome/Edge 重试。 |
| 语音转写 503 | 服务端未启用 ASR 或依赖未就绪；需 `EVA_ASR_ENABLED=true` 并保证后端正常运行。 |
| 有转写但没有预期指令 | 口语需被归一化到解析器支持的短语；可先说 `help` 或查阅解析/归一化相关代码说明。 |
| TTS 无声音 | 打开 **Voice output**；在页面内点击一次；检查静音与音量。 |
| CORS 报错 | 将当前访问的前端地址加入后端 `EVA_CORS_ORIGINS`（JSON 数组字符串）。 |

更全的故障排查见 [README.md](../README.md) 的 Troubleshooting 表格。

---

## 8. 相关文档

| 文档 | 内容 |
|------|------|
| [README.md](../README.md) | 架构、环境变量、Docker 部署、测试 |
| [backend/README.md](../backend/README.md) | API 与健康检查、任务阶段说明 |
| [frontend/README.md](../frontend/README.md) | 前端构建、`VITE_API_ORIGIN`、TTS 细节 |
| [system.md](../system.md) | 管线 ASCII 示意图（便于汇报/幻灯） |

---

*文档版本与仓库同步；若与界面不一致，以当前代码与 README 为准。*
