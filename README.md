```
src/
├── router/
│   └── index.tsx                 ← createBrowserRouter 路由配置
├── components/
│   ├── display/
│   │   └── DisplayHeader.tsx     ← 展示端独立顶部组件
│   └── admin/
│       ├── AdminHeader.tsx       ← 后台顶部（独立组件，含用户菜单）
│       └── AdminSidebar.tsx      ← 后台左侧自适应导航栏
└── pages/
    ├── DisplayPage.tsx           ← 展示端主页
    ├── LoginPage.tsx             ← 登录页（含两步验证流程）
    └── admin/
        ├── AdminLayout.tsx       ← 后台布局（SidebarProvider）
        └── DashboardPage.tsx     ← 仪表板占位页
```

---
# Collei 服务器模块 API 参考

---

## 概述

### 基本信息

| 项目         | 值                                          |
| ------------ | ------------------------------------------- |
| **Base URL** | `https://your-collei-domain/api/v1/clients` |
| **协议**     | HTTPS (推荐) / HTTP                         |
| **数据格式** | JSON                                        |
| **字符编码** | UTF-8                                       |

### 认证与授权

#### 管理端（需认证）

使用 Bearer Token 认证。token 由登录接口返回。

```http
Authorization: Bearer <admin_jwt_token>
```

**获取 token 示例**

```bash
curl -X POST https://your-collei-domain/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

响应：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Agent 端（免认证）

Agent 注册接口不需要认证，但需要提供全局安装密钥。后续通信使用专属 token。

### HTTP 状态码

| 状态码 | 含义                  | 说明                   |
| ------ | --------------------- | ---------------------- |
| `200`  | OK                    | 请求成功，返回数据     |
| `201`  | Created               | 资源创建成功           |
| `400`  | Bad Request           | 请求参数错误           |
| `401`  | Unauthorized          | 认证失败或缺失         |
| `403`  | Forbidden             | 权限不足               |
| `404`  | Not Found             | 资源不存在             |
| `409`  | Conflict              | 资源冲突（如名称重复） |
| `429`  | Too Many Requests     | 请求过于频繁           |
| `500`  | Internal Server Error | 服务端错误             |
| `503`  | Service Unavailable   | 服务不可用             |

### 通用错误格式

所有 4xx/5xx 错误返回统一格式：

```json
{
  "detail": "错误描述文本"
}
```

**示例**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "detail": "Server not found"
}
```

---

## 管理端 API（需认证）
该部分接口前缀为 `/api/v1/clients`。所有请求必须包含有效的 Bearer Token。
### 1. 服务器管理

#### 获取服务器列表

**端点**

```
GET /servers
```

**描述**

获取所有服务器列表，每个服务器包含当前状态、所属分组等关联信息。

**请求头**

```http
Authorization: Bearer <admin_jwt>
```

**查询参数**

无

**成功响应** `200 OK`

```json
[
  {
    "uuid": "0a093bbf-c2ab-4623-ae2a-747317109019",
    "name": "美国",
    "cpu_name": null,
    "arch": null,
    "os": null,
    "region": null,
    "ipv4": null,
    "ipv6": null,
    "version": null,
    "top": 0,
    "hidden": 0,
    "is_approved": 1,
    "created_at": 1772692604,
    "status": 0,
    "last_online": null,
    "groups": [
      {
        "id": "699226ba-b0e6-4f8c-81fd-09fde02866a0",
        "name": "小组1",
        "top": 1,
        "created_at": 1772695094
      }
    ]
  }
]
```

#### 更新服务器

**端点**

```
PUT /servers/{uuid}
```

**描述**

更新服务器的显示名称、备注、排序位置、隐藏状态、区域等信息。

**请求头**

```http
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**路径参数**

| 参数   | 类型   | 说明        |
| ------ | ------ | ----------- |
| `uuid` | string | 服务器 UUID |

**请求体（所字段可选）**

```json
{
  "name": "server-hk-01-new",
  "remark": "更新的备注信息",
  "top": 10,
  "hidden": 0,
  "region": "Hong Kong CN"
}
```

| 字段     | 类型    | 说明                     |
| -------- | ------- | ------------------------ |
| `name`   | string  | 新的服务器名称           |
| `remark` | string  | 新的管理员备注           |
| `top`    | integer | 前端排序（值越小越靠前） |
| `hidden` | integer | 0=显示, 1=隐藏           |
| `region` | string  | 设想区域                 |

**成功响应** `200 OK`

返回更新后的完整服务器对象（同 GET /servers/{uuid}）`

**错误响应**

- `400 Bad Request` — 字段格式错误
- `404 Not Found` — 服务器不存在

---

#### 删除服务器

**端点**

```
DELETE /servers/{uuid}
```

**描述**

删除服务器及其所有关联数据（级联删除状态记录和分组关联）。**此操作不可恢复。**

**请求头**

```http
Authorization: Bearer <admin_jwt>
```

**路径参数**

| 参数   | 类型   | 说明        |
| ------ | ------ | ----------- |
| `uuid` | string | 服务器 UUID |

**成功响应** `200 OK`

```json
{
  "message": "Server deleted"
}
```

**错误响应**

- `404 Not Found` — 服务器不存在

---

#### 批准服务器

**端点**

```
POST /servers/{uuid}/approve
```

**描述**

批准一个待审核的服务器（将 `is_approved` 从 0 设置为 1）。批准后，Agent 可以开始上报监控数据。

**请求头**

```http
Authorization: Bearer <admin_jwt>
```

**路径参数**

| 参数   | 类型   | 说明        |
| ------ | ------ | ----------- |
| `uuid` | string | 服务器 UUID |

**成功响应** `200 OK`

返回更新后的服务器对象

**错误响应**

- `400 Bad Request` — 服务器已经被批准过
- `404 Not Found` — 服务器不存在

---

### 2. 分组管理

#### 创建分组

**端点**

```
POST /groups
```

**请求体**

```json
{
  "name": "生产环境",
  "top": 10
}
```

| 字段   | 类型    | 必填 | 说明             |
| ------ | ------- | ---- | ---------------- |
| `name` | string  | ✅   | 分组名称（唯一） |
| `top`  | integer | ❌   | 排序优先级       |

**成功响应** `201 Created`

```json
{
  "id": "group-001",
  "name": "生产环境",
  "top": 10,
  "created_at": 1741170000
}
```

**错误响应**

- `409 Conflict` — 分组名称已存在

---

#### 获取分组列表

**端点**

```
GET /groups
```

**成功响应** `200 OK`

```json
[
  {
    "id": "group-001",
    "name": "生产环境",
    "top": 10,
    "created_at": 1741170000
  },
  {
    "id": "group-002",
    "name": "测试环境",
    "top": 5,
    "created_at": 1741160000
  }
]
```

---

#### 更新分组

**端点**

```
PUT /groups/{group_id}
```

**请求体（可选）**

```json
{
  "name": "生产环境-新名称",
  "top": 20
}
```

**成功响应** `200 OK`

返回更新后的分组对象

**错误响应**

- `409 Conflict` — 新名称已被其他分组使用
- `404 Not Found` — 分组不存在

---

#### 删除分组

**端点**

```
DELETE /groups/{group_id}
```

**成功响应** `200 OK`

```json
{
  "message": "Group deleted"
}
```

**错误响应**

- `404 Not Found` — 分组不存在

---

#### 获取分组下的服务器

**端点**

```
GET /groups/{group_id}/servers
```

**成功响应** `200 OK`

返回该分组下的服务器列表（同 GET /servers 的返回格式）

---

### 3. 服务器分组关联

#### 获取服务器所属分组

**端点**

```
GET /servers/{uuid}/groups
```

**成功响应** `200 OK`

```json
[
  {
    "id": "group-001",
    "name": "生产环境",
    "top": 10,
    "created_at": 1741170000
  }
]
```

---

#### 设置服务器分组

**端点**

```
PUT /servers/{uuid}/groups
```

**描述**

全量替换服务器所属的分组（如果删除某分组关联，需要不在列表中）。

**请求体**

```json
{
  "group_ids": ["group-001", "group-003"]
}
```

| 字段        | 类型          | 说明                 |
| ----------- | ------------- | -------------------- |
| `group_ids` | array[string] | 要关联的分组 ID 列表 |

**成功响应** `200 OK`

返回设置后服务器所属的分组列表

**错误响应**

- `400 Bad Request` — 部分分组 ID 不存在

---

