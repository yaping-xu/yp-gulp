#!/usr/bin/env node

console.log('hello');
// 把gulp-cli 的操作经过包装放在这个文件就可以了
// 先去找到gulp.cmd的代码


// 命令行中传递的参数可以通过process.argv 来拿到，这是一个数组 
// 所以在代码运行前，我们可以现在cli中push 对应的参数

process.argv.push('--cwd')
process.argv.push(process.cwd()); // 当前命令行所在目录
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp') // 自动去载入gulp-cli