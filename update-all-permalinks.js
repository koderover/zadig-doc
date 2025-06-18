const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 语言配置
const LANGUAGE_CONFIGS = [
  {
    name: '中文',
    code: 'cn',
    rootDir: path.join(__dirname, './cn'),
    langPrefix: '/cn',
    scriptPath: path.join(__dirname, 'update-permalinks.js')
  },
  {
    name: '英文',
    code: 'en', 
    rootDir: path.join(__dirname, './en'),
    langPrefix: '/en',
    scriptPath: path.join(__dirname, 'update-permalinks-en.js')
  }
];

// 日志颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bg: {
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m'
  }
};

// 彩色日志函数
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 打印分隔线
function printSeparator(title = '', char = '=', width = 80) {
  const padding = Math.max(0, width - title.length - 4);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  const line = char.repeat(leftPad) + (title ? ` ${title} ` : '') + char.repeat(rightPad);
  log(line, colors.cyan);
}

// 获取所有markdown文件数量（用于预览）
function getMarkdownFileCount(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  
  let count = 0;
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.startsWith('.') && !item.startsWith('_')) {
            traverse(fullPath);
          }
        } else if (stat.isFile() && item.endsWith('.md')) {
          count++;
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }
  
  traverse(dir);
  return count;
}

// 执行单个语言的permalink更新
function processLanguage(config, dryRun = false) {
  log(`\n🔄 处理${config.name}文档...`, colors.yellow);
  
  try {
    // 检查目录是否存在
    if (!fs.existsSync(config.rootDir)) {
      log(`⚠️  ${config.name}文档目录不存在: ${config.rootDir}`, colors.yellow);
      return {
        success: false,
        reason: '目录不存在',
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };
    }
    
    // 检查脚本是否存在
    if (!fs.existsSync(config.scriptPath)) {
      log(`❌ ${config.name}处理脚本不存在: ${config.scriptPath}`, colors.red);
      return {
        success: false,
        reason: '脚本不存在',
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0
      };
    }
    
    // 执行对应的脚本
    const command = `node "${config.scriptPath}"`;
    log(`📝 执行命令: ${command}`, colors.blue);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: __dirname,
      env: { 
        ...process.env,
        DRY_RUN: dryRun ? 'true' : 'false'
      }
    });
    
    log(output, colors.reset);
    
    // 解析输出以获取统计信息 (简化版本)
    return {
      success: true,
      processed: 0, // 这里可以解析output来获取实际数字
      updated: 0,
      skipped: 0,
      errors: 0
    };
    
  } catch (error) {
    log(`❌ 处理${config.name}文档时出错: ${error.message}`, colors.red);
    return {
      success: false,
      reason: error.message,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }
}

// 显示处理前的概览
function showOverview() {
  printSeparator('文档概览', '=', 80);
  
  let totalFiles = 0;
  
  for (const config of LANGUAGE_CONFIGS) {
    const fileCount = getMarkdownFileCount(config.rootDir);
    totalFiles += fileCount;
    
    const status = fs.existsSync(config.rootDir) ? '✅' : '❌';
    log(`${status} ${config.name} (${config.code}): ${fileCount} 个文件`, colors.blue);
    log(`   📁 目录: ${config.rootDir}`, colors.reset);
    log(`   🏷️  前缀: ${config.langPrefix}`, colors.reset);
    console.log();
  }
  
  log(`📊 总计: ${totalFiles} 个markdown文件`, colors.green);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const helpRequested = args.includes('--help') || args.includes('-h');
  const onlyLang = args.find(arg => arg.startsWith('--lang='))?.split('=')[1];
  
  // 显示帮助信息
  if (helpRequested) {
    printSeparator('Permalink批量更新工具', '=', 80);
    log('这个工具可以批量为中文和英文文档的permalink添加语言前缀\n', colors.cyan);
    
    log('使用方法:', colors.yellow);
    log('  node update-all-permalinks.js [选项]\n', colors.reset);
    
    log('选项:', colors.yellow);
    log('  --dry-run, -d     预览模式，只显示会修改的内容', colors.reset);
    log('  --lang=<code>     只处理指定语言 (cn 或 en)', colors.reset);
    log('  --help, -h        显示帮助信息\n', colors.reset);
    
    log('示例:', colors.yellow);
    log('  node update-all-permalinks.js --dry-run  # 预览模式', colors.reset);
    log('  node update-all-permalinks.js --lang=cn  # 只处理中文', colors.reset);
    log('  node update-all-permalinks.js            # 处理所有语言', colors.reset);
    
    return;
  }
  
  printSeparator('Permalink批量更新工具', '=', 80);
  
  if (dryRun) {
    log('⚠️  DRY RUN MODE - 预览模式，不会实际修改文件', colors.bg.yellow + colors.white);
    console.log();
  }
  
  // 显示概览
  showOverview();
  
  // 过滤要处理的语言
  let configsToProcess = LANGUAGE_CONFIGS;
  if (onlyLang) {
    configsToProcess = LANGUAGE_CONFIGS.filter(config => config.code === onlyLang);
    if (configsToProcess.length === 0) {
      log(`❌ 错误: 不支持的语言代码 '${onlyLang}'`, colors.red);
      log(`支持的语言: ${LANGUAGE_CONFIGS.map(c => c.code).join(', ')}`, colors.yellow);
      process.exit(1);
    }
    log(`🎯 只处理 ${onlyLang} 语言文档`, colors.magenta);
    console.log();
  }
  
  printSeparator('开始处理', '-', 80);
  
  // 处理每种语言
  const results = [];
  for (const config of configsToProcess) {
    const result = processLanguage(config, dryRun);
    results.push({ config, result });
  }
  
  // 显示最终统计
  printSeparator('处理完成', '=', 80);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const { config, result } of results) {
    if (result.success) {
      totalSuccess++;
      log(`✅ ${config.name}文档处理成功`, colors.green);
    } else {
      totalFailed++;
      log(`❌ ${config.name}文档处理失败: ${result.reason}`, colors.red);
    }
  }
  
  console.log();
  log('📊 最终统计:', colors.cyan);
  log(`   成功: ${totalSuccess}`, colors.green);
  log(`   失败: ${totalFailed}`, colors.red);
  
  if (dryRun) {
    console.log();
    log('💡 要实际执行修改，请去掉 --dry-run 参数重新运行', colors.magenta);
  } else if (totalSuccess > 0) {
    console.log();
    log('🎉 所有文档的Permalink更新完成！', colors.green);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  processLanguage,
  getMarkdownFileCount,
  LANGUAGE_CONFIGS
}; 