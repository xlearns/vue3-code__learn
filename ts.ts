let weakmap = new WeakMap();
let stackEffects = []
let config:Object = {
  get(obj,key){
    const res = obj[key]
    myTrack(obj,key)
    return typeof res == 'object'?reactive(res):res
  },
  set(obj,key,val){
    obj[key] = val
    myTrigger(obj,key,val)
  }
}
function myReactive(obj){
  return new Proxy(obj,config)
}
function myTrack(obj,key){
  let effect = stackEffects[stackEffects.length - 1]
  if(effect){
    let depmap = weakmap.get(obj)
    if(!depmap){
      depmap = new Map()
      weakmap.set(obj,depmap)
    }
    let deps = depmap.get(key)
    if(!deps){
      deps = new Set()
      depmap.set(key,deps)
    }
    //初始化完成
    if(!deps.has(effect)){
      deps.push(effect)
      effect.deps.push(effect)
    }
  }
}
function myTrigger(obj,key,val){
  let depmap = weakmap.get(obj)
  if(!depmap)return
  let effects = new Set()
  let computeds = new Set()
  if(key){
    let dep = depmap.get(key)
    if(!dep)return 
    dep.forEach(effect=>{
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
function myeffect(fn,option:any={}){
  let e = createReactObj(fn,option)
  if(!option.lazy){
    e()
  }
  return e
}
function createReactObj(fn,option){
  const effect = function(...args){
    return myRun(effect,fn,args)
  }
  effect.deps=[]
  effect.computed = option.computed
  effect.lazy = option.lazy
  return effect
}
function myRun(effect,fn,args){
  if(stackEffects.indexOf(effect)==-1){
    try{
      stackEffects.push(effect)
      return fn(...args)
    }finally{
      stackEffects.pop()
    }
  } 
}
function myComputed(fn){
  const runner = effect(fn,{computed:true,lazy:true})
  return {
    effect:runner,
    get value(){
      return runner()
    }
  }
}