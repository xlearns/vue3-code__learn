# vue3-
vue3源码学习。
- vue3的核心 = 响应式 + 模板编译 +  虚拟DOM + 组件话
- sleep实现
```js
	function sleep(time){
	     return new Promise(resolve=>setTimeout(resolve,time))
	}
//测试
function test(){
	console.log(123)
}
sleep(1000).then(test)
```
- vue3源码学习

# Composition api体验
- setup：componsition的入口，在beforeCreate之前被调用，return的内容作为render。在vue2.x中created中声明的变量跟直接在setup作用一样都是还有被挂载proxy既不是响应式。
- reactive:与vue2中observerable一样吧数据变成响应式【独立】
- 全局import：之前vue2.x把data、methods、computed都挂载在this上面。这导致即使项目中没用到computed代码也会被打包，通过手动import方便tree-shaking
- ref：【为了解决reactivity操作简单数据结构的命名空间问题】reactive负责复杂的数据结构，ref可以把基础的数据变成响应式、而且不用初始化
- vue组件不需要根节点了,好处：dom结构平级。适用于虚拟列表、tree组件

- 异步组件
`import { defineAsyncComponent } from "vue"`

```js
<template>
  <h1>一个异步小组件</h1>
</template>

<script>
function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
export default {
  name: "AsyncComponent",
  props: {
    timeout: {
      type: Number,
      required: true
    }
  },
  async setup(props) {
   //同步
    await sleep(props.timeout);
   //继续执行
  }
};
</script>
```
##  reactivity独立后，可以在任何框架或者任意地方把想要的数据变成响应式比如three、phaser这点可太棒了。
- 只要是需要额外数据同步或者操作的，都可以用
- 使用`import {reactive,effect} from '@vue/reactivity'`
```js
//封装一个动态的localstorage
import {reactive,effect} from '@vue/reactivity'
export default function useStorage(key:any,value=[]){
    let data = reactive({})
    //将数据变成响应式
    Object.assign(data,localStorage[key]&&JSON.parse(localStorage[key])||value)
    effect(()=>{
      localStorage[key] = JSON.stringify(data)
    })
    return data
}
//需要存储数据就调用useStorage即可
```
#vue2迁移到vue3需要注意点
- provide/inject
- vue3中删除this.on
- v-model变化`prop:value->modelValue`。`event:input->update:modelValue`
- ref变化
- 支持jsx
- 单文件组件和template编译转换成vue3写法

# 重写button组件
- 流程：1.确定需求。2.Tasking。3.Tdd。4.snapshot
- tast:1.设置显示内容。2.size
