# 本地迁移维护说明

新增浏览器工具位于 ../dist/local-backup.js、local-data.html/.css/.js、export-old-site.js；这些不更改既有72个发布文件。

完整本地包根目录的 server.py、tools/、runtime/、启动器和说明必须一同保留。这里保存了对应服务器与重建脚本的源码副本，便于随网站 Git 历史维护；运行时入口仍为完整包根目录。

原站头像链接保持原字节。只有本地服务返回 characters.html 时才把4个头像地址换成包内 assets/characters 图片，因此通过其他临时静态服务运行时仍会看到原外链。

请以完整本地包中的 CLAUDE_HANDOFF.md 为最新交接，执行前先备份个人数据。修改 local-backup.js 后，运行完整包 tools/rebuild-exporter.py；正式交付前更新测试记录并用 tools/rebuild-manifest.py 生成新的文件清单。不要通过重新生成清单来掩盖意外文件损坏。

浏览器验证用新建的隔离浏览器配置与模拟存档；绝不在用户日常浏览器配置上注入测试数据。verification/BROWSER_QA.json 是本轮实际结果，Windows 启动仍需用户本机验证。
