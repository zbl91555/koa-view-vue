import * as Koa from 'koa'

declare module "koa" {
  interface BaseContext {
    render(filename: string, store: Object, pipe?: IPipe): Promise<string>
  }
}

export declare function vueView(options: IVueViewOptions)

interface IVueViewOptions {
  ext?: string
  layout?: string
  root: string
  bundleOptions?: {
    ext?: string
    cache?: boolean
    root?: string
  }
}

interface IPipe {
  (context: Object): Object
}
