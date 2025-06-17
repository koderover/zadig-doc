---
title: 基于 Zadig 升级
date: 2023-04-21 09:59:31
permalink: /dev/stable/zadig-to-zadigx/
---

本文档主要介绍如何从正式使用中的 Zadig 系统，通过升级的方式切换到 Zadig，其中包括注意事项，准备工作及详细的升级验收步骤。

## 注意事项

1. 需购买 Zadig 官方许可，并在官方企业服务团队的指导下进行。
2. Zadig 和 Zadig 的数据结构差异较大，升级操作不可逆，降级会造成不可用。
3. Zadig 的版本不能低于 v1.18.0，如果版本不能满足，请参考[升级文档](/dev/release-notes/v1.18.0/)先将其升级。

## 准备工作

**1. 准备业务验收项目**

在 Zadig 上准备一个或多个核心验收项目，可以进行查看环境、查看环境中的服务、运行工作流等操作，以便在升级完成后对 Zadig 进行验收。

**2. 备份数据**

备份 MongoDB 数据：zadig 库、zadig_policy 库（数据库名称以安装时指定的为准）。命令参考如下：

``` bash
mongodump -h IP --port 端口 -u 用户名 -p 密码 -d zadig -o 文件存在路径
mongodump -h IP --port 端口 -u 用户名 -p 密码 -d zadig_policy -o 文件存在路径
```

备份 MySQL 数据：user 库、dex 库。命令参考如下：
``` bash
mysqldump -h <HOST> -P <PORT> -u root -p user > user.sql
mysqldump -h <HOST> -P <PORT> -u root -p dex > dex.sql
```

备份安装参数：使用 `helm -n {Namespace} get values {ReleaseName}` 查询安装参数并修改，增加以下配置，保存为 values.yaml。

``` yaml
ee:
  mongodb:
    db: "plutus_zadig"
```

**3. 准备新的数据库**

在 MongoDB 数据库实例中新增数据库 plutus_zadig，并赋予读写权限。

**4. 获取许可证**

联系官方获取 Zadig 许可证。

## 升级步骤
:::warning 注意事项
1. 升级时，确保使用的 ReleaseName 和安装 Zadig 时的值保持一致。
2. 升级时，请勿在 Zadig 上执行任何操作。
:::

### 安装 Zadig

执行以下命令来安装 Zadig：

``` bash
helm repo add koderover-chart https://koderover.tencentcloudcr.com/chartrepo/chart
helm repo update
helm upgrade {ReleaseName} koderover-chart/zadigx -n {Namespace} -f config.yaml
```

安装过程受硬件配置和网络情况影响，不同环境下的时间可能不同，可以执行 `kubectl -n {Namespace} get pod` 查询服务状态，当所有服务都是 `RUNNING` 状态时，则说明安装成功。

### 配置许可证

待 Zadig 成功部署后，访问 Zadig 系统，输入许可证保存后即可。

![安装](../../../_images/install_3.png)

### 导入数据

执行以下命令导入 MongoDB 数据（数据库名称以安装 Zadig 时指定的为准）：

``` bash
mongorestore -h IP --port 端口 -u 用户名 -p 密码 -d zadig --drop 文件存储路径
mongorestore -h IP --port 端口 -u 用户名 -p 密码 -d zadig_policy --drop 文件存储路径
```

执行以下命令导入 MySQL 数据：

``` bash
mysql> drop database user;
mysql> create database user;
mysql> drop database dex;
mysql> create database dex;
mysql -h <HOST> -P <PORT> -u root -p user < user.sql
mysql -h <HOST> -P <PORT> -u root -p dex < dex.sql
```

数据导入完毕后访问 Zadig 系统，输入使用许可证即可。

### 升级验收

检查以下功能是否正常，对此次升级做验收：
1. 检查账号系统是否可以正常登录。
2. 检查项目/环境/服务/系统集成的数据是否正常。
3. 检查验收项目中的环境、服务数据是否展示正常。
4. 检查验收项目中的产品/自定义工作流（若有）是否可正常运行。
