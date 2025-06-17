const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  rootDir: path.join(__dirname, './cn'), // 中文文档根目录
  langPrefix: '/cn',                            // 语言前缀
  fileExtension: '.md',                        // 文件扩展名
  permalinkPattern: /^permalink:\s*(.+)$/m,    // 匹配permalink行的正则表达式
  dryRun: false                                // 设为true时只显示会修改的内容，不实际修改文件
};

// 日志颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 彩色日志函数
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 获取所有markdown文件
function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过隐藏目录和特殊目录
        if (!item.startsWith('.') && !item.startsWith('_')) {
          traverse(fullPath);
        }
      } else if (stat.isFile() && item.endsWith(CONFIG.fileExtension)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 检查permalink是否需要更新
function needsUpdate(permalink) {
  // 如果已经有语言前缀，则不需要更新
  return !permalink.startsWith(CONFIG.langPrefix + '/');
}

// 更新单个文件的permalink
function updateFilePermalink(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(CONFIG.permalinkPattern);
    
    if (!match) {
      return { updated: false, reason: 'No permalink found' };
    }
    
    const originalPermalink = match[1].trim();
    
    if (!needsUpdate(originalPermalink)) {
      return { updated: false, reason: 'Already has language prefix' };
    }
    
    // 构造新的permalink
    const newPermalink = `${CONFIG.langPrefix}${originalPermalink}`;
    const newContent = content.replace(
      CONFIG.permalinkPattern,
      `permalink: ${newPermalink}`
    );
    
    if (CONFIG.dryRun) {
      return {
        updated: true,
        dryRun: true,
        original: originalPermalink,
        new: newPermalink
      };
    } else {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return {
        updated: true,
        original: originalPermalink,
        new: newPermalink
      };
    }
  } catch (error) {
    return { 
      updated: false, 
      reason: `Error: ${error.message}` 
    };
  }
}

// 主函数
function main() {
  log('🚀 开始更新permalinks...', colors.cyan);
  log(`📁 扫描目录: ${CONFIG.rootDir}`, colors.blue);
  log(`🏷️  语言前缀: ${CONFIG.langPrefix}`, colors.blue);
  
  if (CONFIG.dryRun) {
    log('⚠️  DRY RUN MODE - 只显示会修改的内容，不实际修改文件', colors.yellow);
  }
  
  console.log();
  
  // 检查根目录是否存在
  if (!fs.existsSync(CONFIG.rootDir)) {
    log(`❌ 错误: 目录不存在 ${CONFIG.rootDir}`, colors.red);
    process.exit(1);
  }
  
  // 获取所有markdown文件
  log('📝 搜索markdown文件...', colors.cyan);
  const markdownFiles = getAllMarkdownFiles(CONFIG.rootDir);
  log(`找到 ${markdownFiles.length} 个markdown文件`, colors.green);
  console.log();
  
  // 处理每个文件
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const filePath of markdownFiles) {
    totalProcessed++;
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    
    const result = updateFilePermalink(filePath);
    
    if (result.updated) {
      totalUpdated++;
      if (result.dryRun) {
        log(`[DRY RUN] 📝 ${relativePath}`, colors.yellow);
        log(`    原始: ${result.original}`, colors.red);
        log(`    新的: ${result.new}`, colors.green);
      } else {
        log(`✅ ${relativePath}`, colors.green);
        log(`    ${result.original} → ${result.new}`, colors.cyan);
      }
    } else {
      if (result.reason.startsWith('Error:')) {
        totalErrors++;
        log(`❌ ${relativePath}`, colors.red);
        log(`    ${result.reason}`, colors.red);
      } else {
        totalSkipped++;
        log(`⏭️  ${relativePath} - ${result.reason}`, colors.yellow);
      }
    }
  }
  
  // 显示统计信息
  console.log();
  log('📊 处理统计:', colors.cyan);
  log(`   总计处理: ${totalProcessed}`, colors.blue);
  log(`   成功更新: ${totalUpdated}`, colors.green);
  log(`   跳过文件: ${totalSkipped}`, colors.yellow);
  log(`   错误文件: ${totalErrors}`, colors.red);
  
  if (CONFIG.dryRun) {
    console.log();
    log('💡 要实际执行修改，请将脚本中的 dryRun 设置为 false', colors.magenta);
  } else if (totalUpdated > 0) {
    console.log();
    log('🎉 Permalink更新完成！', colors.green);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  updateFilePermalink,
  getAllMarkdownFiles,
  CONFIG
}; 