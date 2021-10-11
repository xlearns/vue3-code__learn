//核心逻辑
//proxy 在get中收集依赖、在set中触发依赖【执行收集到的effect】。将所有依赖都收集到weakMap中，weakMap中存储的key也就是目标在vue2.x中为watcher在vue3.x中为target


/*  
  //dep中存储这effect

  targetMap【new WeakMap】 {
      depsMap 【new Map】{
        effect1【dep】:xx 【new Set】 
        effect2:xx
      }
  }
*/
//收集依赖，利用weakMap防止内存泄漏
let targetMap = new WeakMap()

//存储所有effect
let effectStack = []
//收集依赖
function track(target,key){
  //获取最新的effect
  const effect = effectStack[effectStack.length-1] 
  
  //如果effect存在则说明需要收集
  if(effect){
    //需求收集
     let depMap = targetMap.get(target)
     if(depMap===undefined){
    //开始初始化
      depMap=new Map();
      targetMap.set(target,depMap)
     }
     let dep = depMap.get(key)
     if(dep==undefined){
        dep = new Set()
        depMap.set(key,dep)
     }  
     //完成初始化
     //开始收集依赖
     if(!dep.has(effect)){
        dep.add(effect)
        //双向缓存
        effect.deps.push(dep)
     }
  }
}
const baseHandler = {
  //delete、和是否存在暂时不写
    get(target,key){
        //  console.log("get拦截")
        //  const res = Reflect.get(target,key) 
        const res = target[key]
         //搜集依赖【effect】
         track(target,key)
         return typeof res =='object'?reactive(res):res
    },
    set(target,key,value){
       //新老值
       const info = {oldValue:target[key],newValue:value}
        // console.log("set拦截")
        //触发依赖
        // const res = Reflect.set(target,key,value)  
        target[key]= value
        //拿到收集的依赖【effect】，执行 
        trigger(target,key,info)  
    }
}
//触发依赖
//1.通过 targetMap 拿到 target 对应的依赖集合 depsMap；
//2.创建运行的 effects 集合；
//3.根据 key 从 depsMap 中找到对应的 effects 添加到 effects 集合；
//4.遍历 effects 执行相关的副作用函数。
function trigger(target,key,info){
  let depMap = targetMap.get(target)
  if(depMap===undefined)return //没有依赖也就没有副作用
  const effects = new Set()
  const computeds = new Set()  //计算属性特殊的effect 【懒执行】
  if(key){
    let deps = depMap.get(key)
    deps.forEach(effect=>{
      if(effect.computed){
        computeds.add(effect)
      }else{
        effects.add(effect)
      }
    })
  }
  effects.forEach(effect=>effect())
  computeds.forEach(computed=>computed())
}
//等同vue2.x中Observer
function reactive(target){
  const observed = new Proxy(target,baseHandler)
  return observed
}

function computed(fn){
//特殊的effect对象,可以加一些配置
const runner = effect(fn,{computed:true,lazy:true})
return {
  effect:runner,
  get value(){
    return runner()
  }
}
}

function effect(fn,options={}){
  let e = createReactiveEffect(fn,options)
  if(!options.lazy){
    e()
  }
  return e
}

function createReactiveEffect(fn,options){
    const effect = function effect(...args){
      return run(effect,fn,args)
    }
    effect.deps=[]
    effect.computed = options.computed
    effect.lazy = options.lazy
    return effect
}

function run(effect,fn,args){
  if(effectStack.indexOf(effect)==-1){
   try{
    effectStack.push(effect)
    return fn(...args)
   }finally{
    effectStack.pop()
   }
  }
}
