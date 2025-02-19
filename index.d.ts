declare module "dist-info-plugin" {
  // 插件选项的接口
  interface DistInfoPluginOptions {
    name?: string; // 输出的变量名，默认为 'info'
    immediate?: boolean; // 是否立即输出信息，默认为 false
    preset?: boolean; // 是否启用预设的控制台信息，默认为 true
    consoleList?: Array<{
      description: string; // 控制台输出的描述
      value: string; // 控制台输出的值
    }>; // 自定义的控制台输出信息
  }

  // 插件的返回值类型
  type Plugin = {
    apply: (compiler: any) => void;
  };

  // Vite 插件接口
  type VitePlugin = {
    name: string;
    transformIndexHtml: (html: string) => string;
  };

  // DistInfoPlugin 的导出接口
  function DistInfoPlugin(
    options?: DistInfoPluginOptions
  ): Plugin | VitePlugin | undefined;

  // 插件的默认导出
  export default DistInfoPlugin;
  // 导出 DistInfoPluginOptions 接口
  export { DistInfoPluginOptions };
}
