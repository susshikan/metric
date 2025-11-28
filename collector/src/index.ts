import { initRedis } from './redis'
import './collector'

initRedis().then(() => {
    console.log('redis connect')
})