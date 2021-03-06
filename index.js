const SerialPort = require('serialport')
const color = require('colors-cli')
require('colors-cli/toxic')
const time = require('./tool/time')

const portPath = '/dev/cu.SLAB_USBtoUART64'
const baudRate = 115200
let logLineCache = ''

const port = new SerialPort(portPath, {
  baudRate,
})

const onData = data => {
    let dataString = data.toString('binary')
    logLineCache += dataString
    if (!/\n$/.test(dataString)) {
        return
    }
    printLog(logLineCache)
    logLineCache = ''
}

const printLog = log => {
    // 显示配置
    const ignoreOriginalDeviceLogTag = true
    const displayTypeTag = true
    const displayCurrentTime = true
    const displayUnknowTagLog = false // 显示未知、未预先定义的日志

    // 计算缓存变量
    let unknowTag = false

    switch(true) {
        case /Property\sSet\sReceived/ig.test(log): // 固件收到 APP 下发的指令
        case /fromCloud/ig.test(log): // 固件收到 APP 下发的指令
            log = log.green
            break
        case /Message Post Reply Received/ig.test(log): // 固件上报数据给云端完成
        case /sendToCloud/ig.test(log): // 固件收到 APP 下发的指令
            log = log.blue
            break    
        case /Property post all/ig.test(log): // 全部数据上报（每分钟 1 次）
            log = log.blue
            break
        default:
            log = log.white
            break
    }

    if (ignoreOriginalDeviceLogTag) {
        // log = log.replace(/\[\w+\]\[[\w\:\s]+\]/ig, '')
        log = log.replace(/\[\w+\]/ig, '') // 保留固件代码行数打印
    }

    if (displayTypeTag) {
        let tag = 'No Tag'
        switch(true) {
            case /Property\sSet\sReceived/ig.test(log): // 固件收到 APP 下发的指令
            case /fromCloud/ig.test(log): // 固件收到 APP 下发的指令
                tag = 'From APP'
                break
            case /Message Post Reply Received/ig.test(log): // 固件上报数据给云端完成
            case /sendToCloud/ig.test(log): // 固件收到 APP 下发的指令
                tag = 'To Cloud'
                break    
            case /Property post all/ig.test(log): // 全部数据上报（每分钟 1 次）
                tag = 'Post all'
                break
            default:
                unknowTag = true
                break
        }
        const tagMaxLength = 12 // 预定义 tag 字符串最大长度
        const padString = '-' // 前后填充字符
        const padStartLength = Math.floor((tagMaxLength - tag.length)/2)
        const padEndLength = tagMaxLength - tag.length - padStartLength

        tag = tag.padStart(padStartLength, padString)
        tag = tag.padEnd(padEndLength, padString)
        tag = `[ ${tag} ]`
        log = `${tag.yellow} ${log}`
    }

    if (displayCurrentTime) {
        log = `${time.stringForNow.cyan}  ${log}`
    }

    // 不显示未知、未预定义的日志
    if (!displayUnknowTagLog && unknowTag) {
        return
    }

    // 去除行尾换行
    log = log.replace(/\n+/ig, '')

    console.log(log)
}

port.on('open', function() {
    console.log(`Has been open port ${portPath} by baudRate ${baudRate}`)
})

port.on('readable', () => {
    port.read()
})
  
// Switches the port into "flowing mode"
port.on('data', onData)