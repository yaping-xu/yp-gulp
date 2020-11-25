// 作为这个模块的入口文件

const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync') // 依靠这个模块加载开发服务器

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins() //loadPlugins导出的是一个方法，通过方法得到plugins
const bs = browserSync.create() // 用提供的creat()方法创建服务器

const cwd = process.cwd() // 会返回当前命令行工作的目录
let config = {
  // default config
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({},config,loadConfig)
}catch(e){}

const clean = ()=>{
  return del(['dist','temp'])
}

const page = ()=>{
  // swig 为模板引擎的转换插件
  // 原来的模板用到了一些数据标记，去标记开发中可能变化的东西
  // 通过swig的data参数，把设定的data传入到模板中
  return src('src/*.html', { base: 'src'})
    .pipe(plugins.swig({ data : config.data }))
    .pipe(dest('temp'))
    .pipe(bs.reload({stream: true})) // 内部以流的方式推到浏览器，
}

const script = ()=>{
  // gulp-babel只是帮你唤起@babel/core的转换过程
  // preset-env会帮助转换所有的es6模块，他是可以转换所有新特性的集合
  return src('src/assets/scripts/*.js', { base: 'src' })
  .pipe(plugins.babel({presets: [require('@babel/preset-env')]}))
  .pipe(dest('temp'))
  .pipe(bs.reload({stream: true})) // 内部以流的方式推到浏览器，
}

const style = ()=>{
  // outputStyle: 'expanded' 是指定转换后结束括号的位置
  return src('src/assets/styles/*.scss', { base: 'src' })
  .pipe(plugins.sass({ outputStyle: 'expanded'}))
  .pipe(dest('temp'))
  .pipe(bs.reload({stream: true})) // 内部以流的方式推到浏览器，
}

const image = ()=>{
  // imagemin插件用于图片的压缩
  return src('src/assets/images/**', { base: 'src'})
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = ()=>{
  // imagemin可以压缩字体文件中的svg
  return src('src/assets/fonts/**', { base: 'src'})
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

// 处理其他文件
const extra = ()=>{
  return src('public/**',  { base: 'public' })
    .pipe(dest('dist'))
}

const serve = ()=>{
  // watch下面监听src的变化
  watch('src/*.html',page)
  watch('src/assets/scripts/*.js',script)
  watch('src/assets/styles/*.scss',style)

  // 只是去监听iamge,font,public文件的变化，不去构建
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ],bs.reload)

  // 初始化服务器配置
  bs.init({
    port: '2080', // 服务器端口号
    // browser-sync 启动后用来去监听的路径通配符
    // files:'temp/**',
    server: {
      // 请求过来后先从[0]目录下面去找，如果找不到就去src下面查找...
      baseDir: ['temp','src','public'],
      // 优先于baseDir的配置
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () =>{
  // useref 自动处理构建注释
  return src('temp/*.html', {base: 'temp'})
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    // 希望对生成的文件进行压缩,因为读取流中有三个不同的文件，希望对不同文件进行不同操作
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 可以在方法中配置一些自定义的选项，下面的选项是压缩空白字符,压缩行内css，压缩w文件内js
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ 
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest('dist'))
}

// 使用parallel把这些任务通过并行的方式导出
const compile = parallel(page,script,style )

// 一般 iamge,font public 的任务，项目开发阶段不会让他自动化构建，只是再发布的时候去构建项目

const build = series( 
  clean, 
  parallel(
    series(compile,useref),
  image,
  font,
  extra
  ) 
) 

const start = series(compile, serve)

module.exports = {
  build,
  start,
  clean
}