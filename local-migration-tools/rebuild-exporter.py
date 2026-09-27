"""Rebuild the self-contained, read-only original-site exporter."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'project' / 'dist'
ENTRY = r'''
(async()=>{
  if(location.origin!=='https://last-cloudia-skill-table.yuhao200124.chatgpt.site'){alert('请在原网站页面运行导出脚本。未读取数据。');return;}
  try{
    const backup=await LCBackup.capture();LCBackup.download(backup);const s=LCBackup.summary(backup);
    console.info('完整备份：',s,'SHA256',backup.sha256);
    alert('已发起备份下载：'+s.localKeys+' 项长期存档、'+s.sessionKeys+' 项本标签页草稿、'+s.records+' 条数据库记录。请保留下载的 JSON 文件，并到本地版恢复核对。其他标签页的临时草稿需要分别导出。原数据未删除。');
  }catch(e){console.error(e);alert('备份未完成：'+e.message+'。请保留原网站数据，不要清理浏览器。');}
})();
'''
(DIST / 'export-old-site.js').write_text((DIST / 'local-backup.js').read_text(encoding='utf-8') + ENTRY, encoding='utf-8')
print('export-old-site.js rebuilt')
