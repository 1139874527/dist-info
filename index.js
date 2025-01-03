const { execSync } = require('child_process') //同步子进程

const isVite = process.argv.some((arg) => arg.includes('vite')) || process.env.VITE_ !== undefined

const getDate = (time = '') => {
	const date = new Date(time || Date.now())
	const [y, M, d, h, m] = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
	return `${y}-${M}-${d} ${h}:${m}`
}

const getGitInfo = (gitMeta) => {
	try {
		return execSync(gitMeta)?.toString().trim()
	} catch {
		return '--'
	}
}

const getJsContent = (options = {}) => {
	const defaultOptions = {
		name: 'info',
		immediate: false,
		preset: true,
		consoleList: []
	}

	const opts = { ...defaultOptions, ...options }

	const consoleList = () => {
		const userConsoleList = Array.isArray(opts.consoleList) ? opts.consoleList.filter((res) => res?.description) : []

		const descriptionList = userConsoleList.map((item) => item.description)

		const presetConsoleList = [
			{
				description: '提交人员',
				value: getGitInfo('git show -s --format=%cn')
			},
			{
				description: '版本信息',
				value: getGitInfo('git show -s --format=%h')
			},
			{
				description: '代码分支',
				value: getGitInfo('git symbolic-ref --short -q HEAD')
			},
			{
				description: '提交说明',
				value: getGitInfo('git show -s --format=%s')
			},
			{
				description: '提交时间',
				value: getDate(getGitInfo('git show -s --format=%cd'))
			}
		].filter((res) => !descriptionList.includes(res.description))

		const finalConsoleList = opts.preset
			? [...presetConsoleList, ...userConsoleList]
			: userConsoleList.length
			? userConsoleList
			: [
					{
						description: '异常提示',
						value: '无可输出的信息！请检查配置或将preset设置为true'
					}
			  ]

		return JSON.stringify(
			finalConsoleList.map(({ description, value }) => ({
				description: encode(description),
				value: encode(value || '')
			}))
		)
	}

	const encode = (str = '') => {
		if (!str) return ''
		let r = ''
		for (let i = 0; i < str.length; i++) {
			r += str.charCodeAt(i) + ','
		}
		return r
	}

	const getConsoleStr = '`%c ${decode(description)} %c ${decode(value)} `'

	return `(function(window){
  function decode(str = ""){
    if(!str) return ""
    let arr = str.split(",");
    let r = "";
    for (let i = 0; i < arr.length; i++){
      r += String.fromCharCode(parseInt(arr[i]));
    }
    return r;
  }
  function log (description, value) {
    console.log(
      ${getConsoleStr},
      "background:#ff4d4f;border:1px solid #ff4d4f; padding: 1px; border-radius: 2px 0 0 2px; color: #fff",
      "border:1px solid #ff4d4f; padding: 1px; border-radius: 0 2px 2px 0; color: #ff4d4f",
    )
  }

  const BUILD_INFO_CONSOLE_LIST = ${consoleList()} || []

  if(${opts.immediate}){
    BUILD_INFO_CONSOLE_LIST.forEach(res=>{
      log (res.description, res.value) 
    })
  }
  Object.defineProperty(window, '${opts.name}', {
    get: function() {
      console.clear();
      BUILD_INFO_CONSOLE_LIST.forEach(res=>{
        log (res.description, res.value) 
      })
    }
  })
})(window)`
}

function webpackPlugin(jsContent) {
	const createAsset = (content) => {
		return {
			source: () => content,
			size: () => content.length
		}
	}
	return {
		apply(compiler) {
			compiler.hooks.emit.tap('distInfoPlugin', (compilation) => {
				// 获取 HTML 和 JS 文件的路径
				const jsAsset = Object.keys(compilation.assets).find((assetPath) => assetPath.endsWith('.js'))
				const htmlAsset = Object.keys(compilation.assets).find((assetPath) => assetPath.endsWith('.html'))

				if (!jsAsset || !htmlAsset) return

				// 生成唯一的 JS 文件路径
				const jsPathParts = jsAsset.split('/')
				const timestamp = Date.now().toString()
				jsPathParts[jsPathParts.length - 1] = `dist-info-${timestamp}.js`
				const jsFilePath = jsPathParts.join('/')

				// 修改 HTML 文件内容，插入新的 JS 文件路径
				const originalHtmlContent = compilation.assets[htmlAsset]?.source()
				if (!originalHtmlContent) return

				const updatedHtmlContent = originalHtmlContent.replace(
					/(<head[^>]*>)/,
					`$1<script src="${compiler.options.output.publicPath}${jsFilePath}"></script>`
				)

				// 更新 HTML 文件内容到编译输出
				compilation.assets[htmlAsset] = createAsset(updatedHtmlContent)

				compilation.assets[jsFilePath] = createAsset(jsContent)
			})
		}
	}
}

function vitePlugin(jsContent) {
	return {
		name: 'vite-plugin-dist-info',
		transformIndexHtml(html) {
			const scriptTag = `<script>${jsContent}</script>`
			return html.replace(/<\/body>/, `${scriptTag}</body>`)
		}
	}
}

function DistInfoPlugin(options = {}) {
	try {
		const jsContent = getJsContent(options)
		return isVite ? vitePlugin(jsContent) : webpackPlugin(jsContent)
	} catch (err) {
		console.log('DistInfoPlugin', err)
	}
}
// 确保插件作为默认导出
module.exports = DistInfoPlugin
module.exports.default = DistInfoPlugin
