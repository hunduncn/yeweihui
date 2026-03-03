# 业委会工作留存系统

小区业主委员会日常工作的电子留存平台，用于记录会议、公告、政府往来、维权投诉等事项，并管理相关合同和附件，做到证据留存、有据可查。

---

## 功能模块

### 工作记录
- 支持四种记录类型：**会议记录**、**公告通知**、**政府往来**、**维权投诉**
- 每条记录可关联参与成员、填写详细描述
- 会议记录与公告通知支持互相**关联派生**（一键从会议派生公告，或追溯关联已有记录）
- 附件按分类上传：照片（全景/中景/现场/记录）、文档（PDF/Word/Excel 等）
- 照片支持网格预览和灯箱放大查看

### 合同管理
- 记录合同名称、签约单位、金额、起止日期、备注
- 首页显示**即将到期合同**数量，橙色高亮提醒
- 支持上传合同附件

### 设置
- **成员管理**：配置业委会委员名单，新建记录时可多选参与人
- **往来单位**：维护合同往来单位，新建合同时可快速选择
- **账号管理**（管理员专属）：添加登录账号、重置密码、切换角色

---

## 权限说明

| 角色 | 权限 |
|------|------|
| 管理员 | 查看 + 新增 / 编辑 / 删除所有内容 |
| 普通成员 | 仅查看，不可修改 |

初始管理员账号：`admin` / `admin123`（首次启动自动创建，可在设置中修改密码）

可通过环境变量覆盖初始账号：
```
INITIAL_USERNAME=yourname
INITIAL_PASSWORD=yourpassword
```

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 16（App Router） |
| 数据库 | SQLite（better-sqlite3） |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 语言 | TypeScript |
| 认证 | JWT（jose）+ bcryptjs，HttpOnly Cookie |

数据库文件路径：`data/yeweihui.db`（自动创建）
上传文件目录：`uploads/`（UUID 命名，自动创建）

---

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
node node_modules/next/dist/bin/next dev
```

> 注意：`npm run dev` 在部分环境下 `.bin` 软链可能失效，建议直接调用上方命令。

访问 [http://localhost:3000](http://localhost:3000)，使用初始账号登录。

---

## 目录结构

```
app/
  page.tsx                  # 首页（统计 + 最近记录）
  records/                  # 工作记录列表 / 详情 / 新建 / 编辑
  contracts/                # 合同列表 / 详情 / 新建 / 编辑
  settings/                 # 设置页（成员 / 往来单位 / 账号）
  login/                    # 登录页
  api/                      # API 路由
components/
  CategoryAttachmentUploader.tsx   # 分类附件上传组件
  RelatedRecordsPanel.tsx          # 关联记录面板
  RecordForm.tsx                   # 记录新建 / 编辑表单
  AuthProvider.tsx                 # 登录状态 Context
  NavUserMenu.tsx                  # 导航栏用户菜单
lib/
  db.ts                     # SQLite 初始化 + 建表
  records.ts                # 记录 CRUD
  contracts.ts              # 合同 CRUD
  relations.ts              # 记录关联 CRUD
  members.ts                # 成员 CRUD
  auth.ts                   # JWT + 用户 DB 操作
  server-auth.ts            # 服务端鉴权（requireAdmin 等）
middleware.ts               # 路由保护（未登录跳转 /login）
```
