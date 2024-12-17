概述：基于 postMessage API 封装的一款用于父子页面(子页面为iframe形式)双向通信的工具包

#### 核心思想
- 基于 [postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)  API 封装 
- owner：明确当前通道给谁用
- trustOrigin：信任谁传来的消息 ( 更安全 🎉 ～)

#### 优势
- 父子页面双向通信，更全面
- 子页面被其他子页面替换时，自动建立新的父子页面的消息通道，更便捷 🍊
- 符合消息订阅与发布的使用模式，易于上手 🍓

#### 使用范围
- 父页面嵌套子页面，子页面使用iframe实现
- 父子页面紧邻，不是深层嵌套
- 父页面同时只可以和一个子页面之间建立双向消息通信
- 允许一个子页面销毁，另一个子页面在创建消息通道时会自动和父页面建立双向通信关系

#### 示例

- 父页面：假设运行在 http://localhost:5173
```ts

import { MESSAGE_PIPE_OWNER, MessagePip } from 'iframe-message-pipe';


/*
 * 创建消息通道
 * 1.owner: 消息通道持有者（父页面）
 * 2.trustOrigin：父页面信任的消息源（正则表达式，匹配子页面iframe的src）
*/
const pip = new MessagePip({
    owner: MESSAGE_PIPE_OWNER.PARENT,
    trustOrigin: /http:\/\/localhost:5174/
});


/*
 * 父页面监听消息
*/
pip.$on('eatFruit', （value：any) => {
    console.log(value);
});

/*
 * 父页面触发事件
 */
pip.$emit('goSleep', {data: 'time to sleep'});
```
- 子页面：假设运行在 http://localhost:5174
```ts
import { MESSAGE_PIPE_OWNER, MessagePip } from 'iframe-message-pipe';


/*
 * 创建消息通道
 * 1.owner: 消息通道持有者（子页面）
 * 2.trustOrigin：子页面信任的消息源（正则表达式，匹配父页面url）
*/
const pip = new MessagePip({
    owner: MESSAGE_PIPE_OWNER.CHILD,
    trustOrigin: /http:\/\/localhost:5173/
});

/*
 * 子页面触发事件
 */
pip.$emit('eatFruit', {data: 'good for health'});


/*
 * 子页面监听消息
*/
pip.$on('goSleep', （value：any) => {
    console.log(value);
});
```
#### 核心构造函数
- 指定消息通道的所有者
- 指定当前通道所信任的消息源（信任哪个页面传来的消息，更安全）
```ts
const pip = new MessagePip({
    owner: MESSAGE_PIPE_OWNER.CHILD,
    trustOrigin: /http:\/\/localhost:5173/
});
```

#### API
- $on (type: string, cb: Function)
    - 绑定事件
    - 同一个key可以绑定多个回调函数
- $emit (type: string, value: object)
    - 触发事件
- $off (type: string)
    - 解绑事件
    - 解绑key对应的所有回调函数 