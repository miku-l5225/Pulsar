const fs = require('fs');
const path = require('path');

// 配置：需要忽略的文件夹名称
const IGNORE_DIRS = ['node_modules', '.git', '.idea', '.vscode', 'ui'];

let fileCount = 0;
let dirCount = 0;

/**
 * 获取目录树结构的递归函数
 * @param {string} currentPath 当前路径
 * @param {string} prefix 前缀字符（用于绘制树枝）
 * @returns {string} 树形结构字符串
 */
function getFileTree(currentPath, prefix = '') {
    let output = '';

    try {
        const items = fs.readdirSync(currentPath);

        // 过滤掉忽略的目录，并排序（文件夹在前，文件在后，或者按字母顺序）
        const filteredItems = items.filter(item => !IGNORE_DIRS.includes(item));

        filteredItems.forEach((item, index) => {
            const isLast = index === filteredItems.length - 1;
            const itemPath = path.join(currentPath, item);

            let stats;
            try {
                stats = fs.statSync(itemPath);
            } catch (e) {
                return; // 如果无法读取文件信息（如权限问题），跳过
            }

            // 绘制树枝符号
            const connector = isLast ? '└── ' : '├── ';

            // 添加当前项到输出
            output += `${prefix}${connector}${item}\n`;

            if (stats.isDirectory()) {
                dirCount++;
                // 递归处理子目录
                // 如果当前是最后一个元素，子元素的前缀是空格，否则是竖线
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                output += getFileTree(itemPath, newPrefix);
            } else {
                fileCount++;
            }
        });
    } catch (err) {
        console.error(`无法读取目录: ${currentPath}`, err.message);
    }

    return output;
}

// 主程序开始
const rootDir = process.cwd(); // 获取当前执行命令的目录
console.log(`📁 正在扫描: ${rootDir}\n`);

// 打印根目录名称
console.log(path.basename(rootDir));

// 生成并打印树
const treeStructure = getFileTree(rootDir);
console.log(treeStructure);

// 打印统计结果
console.log('--------------------------------------------------');
console.log(`📊 统计结果:`);
console.log(`   📂 文件夹数量: ${dirCount}`);
console.log(`   📄 文件数量:   ${fileCount}`);
console.log('--------------------------------------------------');
