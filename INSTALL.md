# 安装说明

## 系统要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 18.x 及以上 | 推荐 20 LTS |
| npm | 9.x 及以上 | 随 Node.js 附带 |
| 操作系统 | macOS / Linux / Windows | 生产环境推荐 Linux |

> `better-sqlite3` 包含原生模块，需要系统具备 C++ 编译环境（macOS 安装 Xcode Command Line Tools，Linux 安装 `build-essential`）。

---

## 快速开始

### 1. 获取代码

```bash
git clone <仓库地址>
cd yeweihui
```

或直接解压项目压缩包到目标目录。

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量（可选）

在项目根目录创建 `.env.local` 文件：

```env
# 初始管理员账号（仅首次运行时生效）
INITIAL_USERNAME=admin
INITIAL_PASSWORD=admin123

# JWT 签名密钥（生产环境务必修改为随机长字符串）
JWT_SECRET=请替换为一个足够长的随机字符串

# 数据库路径（默认：项目根目录/data/yeweihui.db）
# DB_PATH=/custom/path/to/yeweihui.db
```

> **安全提示**：生产部署时 `JWT_SECRET` 必须修改，可用以下命令生成：
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 4. 初始化数据库

```bash
node scripts/init-db.mjs
```

输出示例：
```
✓ 创建目录：/path/to/data
✓ 创建目录：/path/to/uploads
✓ 数据库：/path/to/data/yeweihui.db
✓ 数据表初始化完成
✓ 初始管理员已创建：admin / admin123
  ⚠️  请登录后立即在「设置 → 账号管理」中修改密码

数据库初始化完成，可以启动应用了。
```

> 若跳过此步骤，数据库会在应用首次启动时自动初始化。

### 5. 启动应用

**开发模式：**
```bash
node node_modules/next/dist/bin/next dev
```

**生产模式：**
```bash
# 先构建
node node_modules/next/dist/bin/next build

# 再启动
node node_modules/next/dist/bin/next start
```

> **注意**：`npm run dev` / `npm run start` 在部分环境下因 `.bin` 软链失效而无法运行，建议直接使用上方命令。

### 6. 访问系统

浏览器打开 [http://localhost:3000](http://localhost:3000)，使用初始管理员账号登录。

---

## 目录说明

```
yeweihui/
├── app/              # Next.js 页面与 API 路由
├── components/       # 共享 UI 组件
├── lib/              # 数据库操作、认证逻辑
├── scripts/
│   ├── init-db.mjs   # 数据库初始化脚本
│   └── seed.mjs      # 测试数据脚本（可选）
├── data/             # SQLite 数据库文件（运行后自动生成）
│   └── yeweihui.db
├── uploads/          # 用户上传的附件（运行后自动生成）
├── public/           # 静态资源
├── .env.local        # 本地环境变量（需手动创建）
└── next.config.ts    # Next.js 配置
```

---

## 数据备份

数据全部存储在以下两个位置，定期备份即可：

| 内容 | 路径 |
|------|------|
| 数据库（所有记录/合同/成员/账号） | `data/yeweihui.db` |
| 上传附件（照片/文档） | `uploads/` 目录 |

**备份示例：**
```bash
# 停止应用后执行，或使用 SQLite 的热备命令
cp data/yeweihui.db data/yeweihui.db.bak
tar -czf uploads-backup.tar.gz uploads/
```

**恢复：**
```bash
cp data/yeweihui.db.bak data/yeweihui.db
tar -xzf uploads-backup.tar.gz
```

---

## 常见问题

**Q：启动时报 `better-sqlite3` 编译错误？**
```bash
# macOS
xcode-select --install

# Ubuntu / Debian
sudo apt install build-essential python3

# 然后重新安装依赖
npm install
```

**Q：上传附件失败？**
检查 `uploads/` 目录是否存在且进程有写入权限：
```bash
mkdir -p uploads
chmod 755 uploads
```

**Q：忘记管理员密码？**
直接用 Node.js 脚本重置：
```bash
node -e "
const db = require('better-sqlite3')('data/yeweihui.db');
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('新密码', 10);
db.prepare(\"UPDATE users SET password=? WHERE username='admin'\").run(hash);
console.log('密码已重置');
db.close();
"
```

**Q：如何修改监听端口？**
```bash
node node_modules/next/dist/bin/next dev -p 8080
node node_modules/next/dist/bin/next start -p 8080
```
