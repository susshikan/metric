import { initRedis } from './redis'
import './collector'
import './dockerCollector'

initRedis().then(() => {
    console.log('redis connect')
})