
import PubSub from "./PubSub"

import { campfire } from "./sketch"

campfire.on('render-fn',render =>{
    console.log('hey render-fn!!')
    setTimeout(render,3000);
})

console.log('main.ts!!')
