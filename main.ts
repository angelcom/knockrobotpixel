// 2018-10-7 makecode的substr默认长度10？太坑了
class ArgsContainer {
    args: string;
}

//% color=#0062dB weight=96 icon="\uf294" block="KNOCKBIT"
namespace knock_robot_neopixel {
    let delimiter = "^";
    let terminator = "\n";

    let MIN_SEND_TIMEOUT = 100; // 最小发送间隔，500
    let us = 0
    let BluetoothConnected: boolean = false
    // 超声波是否初始化
    let US_INIT: boolean = false
    // 超声波端口
    let US_PORT = -1

    // 2018-10-18 暂时去除了其他传感器的自动发送
    // 指南针是否初始化
    //let CH_INIT: boolean = false
    // 指南针_自动发送
    //let CH_AUTO_SEND = false
    //let CH_TIMEOUT = MIN_SEND_TIMEOUT
    //let CH_NEXTTIME = 0   // 下次发送时间
    // 超声波_自动发送
    //let US_AUTO_SEND = false
    //let US_TIMEOUT = MIN_SEND_TIMEOUT
    //let US_NEXTTIME = 0   // 下次发送时间
    // 加速度_自动发送
    //let AC_AUTO_SEND = false
    //let AC_TIMEOUT = MIN_SEND_TIMEOUT    // 自动发送延迟（ms）
    //let AC_NEXTTIME = 0   // 下次发送时间
    // user-defined;内置3组自定义发送内容
    //let UD_AUTO_SEND = [false, false, false]
    //let UD_TIMEOUT = [MIN_SEND_TIMEOUT, MIN_SEND_TIMEOUT, MIN_SEND_TIMEOUT]
    // let UD_NEXTTIME = [0, 0, 0]
    // let UD_MAX_ID = 3;

    // 电机速度
    let M1A_SPEED = 0, M2A_SPEED = 0, M1B_SPEED = 0, M2B_SPEED = 0;

    //let SCAN_ULTRASONIC = false;// 超声波扫描前方障碍物
    let CMD_HANDLERS: LinkedKeyHandlerList = null;  // 自定义命令处理器
    let UD_HANDLERS: LinkedIdHandlerList = null;  // 用户自动发送数据处理器
    // ROBOTBIT内建4个LED灯
    let strip: neopixel.Strip = null;

    export enum CustomCmd {
        //% block="reset_microbit"
        rst = -1,
        //% block="show_string"
        str = 1,
        //% block="show_image"
        img = 2,
        //% block="move"
        //mov = 10,
        //% block="led"
        led = 100,
        //% block="servo"
        ser = 1000,
        //% block="set_tt4_motor"
        tt4 = 20,   // 控制4路电机
    }

    //% blockId="knock_robot_neopixel_CustomCharConv" block="内置命令 %c"
    export function CustomCharConv(c: CustomCmd): string {
        switch (c) {
            case CustomCmd.rst: return "rst";
            case CustomCmd.str: return "str";
            //case CustomCmd.mov: return "mov";
            case CustomCmd.img: return "img";
            case CustomCmd.led: return "led";
            case CustomCmd.ser: return "ser";
            case CustomCmd.tt4: return "tt4";
        }
        return "???";
    }

    class LinkedKeyHandlerList {
        key: string;
        // microbit中的callbak最多支持3个参数
        callback: (args: ArgsContainer) => void;
        next: LinkedKeyHandlerList
    }

    class LinkedIdHandlerList {
        id: number;
        callback: () => void;
        next: LinkedIdHandlerList
    }

    let messageContainer = new ArgsContainer;

    //% mutate=objectdestructuring
    //% mutateText="My Arguments"
    //% mutateDefaults="key,args"
    //% blockId=knock_robot_neopixel_onCmdReceived
    //% block="当收到蓝牙数据时 |命令 %cmd"
    export function onCmdReceived(cmd: string, callback: (args: ArgsContainer) => void) {
        let newHandler = new LinkedKeyHandlerList()
        newHandler.callback = callback;
        newHandler.key = cmd;
        newHandler.next = CMD_HANDLERS;
        CMD_HANDLERS = newHandler;
    }


    //% blockId=knock_robot_neopixel_onUserAutoSend
    //% block="当返回数据时 |id %id"
    export function onUserAutoSend(id: number, callback: () => void) {
        let newHandler = new LinkedIdHandlerList()
        newHandler.callback = callback;
        newHandler.id = id;
        newHandler.next = UD_HANDLERS;
        UD_HANDLERS = newHandler;
    }

    let splitString = (splitOnChar: string, input: string) => {
        //basic.showString(input);
        let result: string[] = []
        let count = 0
        let startIndex = 0
        for (let index = 0; index < input.length; index++) {
            if (input.charAt(index) == splitOnChar) {
                result[count] = input.substr(startIndex, index - startIndex)
                startIndex = index + 1
                count = count + 1
            }
        }
        if (startIndex != input.length)
            result[count] = input.substr(startIndex, input.length - startIndex)
        //basic.showNumber(count);
        return result;
    }

    /* 有问题，暂时不支持
        function playMusic(arg: string) {
            switch (arg) {
                case "nyan":
                    music.beginMelody(music.builtInMelody(Melodies.Nyan), MelodyOptions.Once)
                    break;
                case "powerup":
                    music.beginMelody(music.builtInMelody(Melodies.PowerUp), MelodyOptions.Once)
                    break;
                case "powerdown":
                    music.beginMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
                    break;
                case "birthday":
                    music.beginMelody(music.builtInMelody(Melodies.Birthday), MelodyOptions.Once)
                    break;
                case "wedding":
                    music.beginMelody(music.builtInMelody(Melodies.Wedding), MelodyOptions.Once)
                    break;
            }
        }
    */
    function handleMessage(cmd: string, arg: string) {
        //读取传感器
        // if (getSensor(cmd, arg)) {
        //     return;
        // }
        switch (cmd) {    // 1开启自动发送，0关闭自动发送
            case "str": // 显示消息
                basic.showString(arg);
                break;
            case "rst": // 重启
                control.reset();
                break;
            case "mov": //移动  // 下次精简时再和tt4合并
                doMove(arg);
                break;
            case "tt4": // 同时控制4路tt电机
                tt4(arg);
                break;
            case "img": // 显示图案
                basic.showIcon(parseInt(arg));
                ledOnBoard("llp");// 回发板载led信息给敲比特
                break;
            // case "ply": // 播放乐曲
            //     playMusic(arg);
            //     break;
            case "led": // 点亮Microbit自带LED
            case "lnp": // 2018-7-24 更新为led neo pixel
                showLed(arg);
                break;
            case "ser": // 伺服电机（舵机）
                servo(arg);
                break;
            // case "udx": // 用户自定义自动发送信息    //2018-10-18 暂时取消
            //     UsesDefinedMessage(arg);
            //     break;
            case "lob": // led on-board 板载 5*5led
                ledOnBoard(arg);
                break;
            case "msc":// music // 直接播放频率
                playMusic(arg);
                break;
            default:    // 未知的消息
                break;
        }
    }

    let toneStartTime = 0;
    let tonebeat = 125;
    let currentDuration = 4;
    function playMusic(msg: string) {
        let cmd = msg.substr(0, 4);
        let arg = msg.substr(4, msg.length - 4);
        let frequency = arg;
        switch (cmd) {
            case "play":
                if (arg.length > 5) {
                    frequency = arg.substr(0, 4);
                    let duration = parseInt(arg.substr(5, 1));
                    currentDuration = duration > 0 ? duration : currentDuration;
                }
                music.playTone(parseInt(frequency), currentDuration * tonebeat);
                break;
            case "ring":
                if (tonebeat > 0)   // 等于0的时候放开就停止演奏
                    basic.pause(tonebeat * currentDuration - (input.runningTime() - toneStartTime) % tonebeat);
                if (arg.length > 5) {
                    frequency = arg.substr(0, 4);
                    let duration = parseInt(arg.substr(5, 1));
                    currentDuration = duration > 0 ? duration : currentDuration;
                }
                toneStartTime = input.runningTime();
                music.ringTone(parseInt(frequency));
                break;
            case "rest":
                if (tonebeat > 0)   // 等于0的时候放开就停止演奏
                    basic.pause(tonebeat * currentDuration - (input.runningTime() - toneStartTime) % tonebeat);
                music.rest(1);
                break;
            case "beat":
                tonebeat = parseInt(arg) >= 0 ? parseInt(arg) : tonebeat;
                break;
            case "dura":
                currentDuration = parseInt(arg) >= 0 ? parseInt(arg) : currentDuration;
                //basic.showNumber(currentDuration);
                break;
        }
    }


    //% blockId=knock_robot_neopixel_getLedPlots
    //% block="读取led5*5状态，按位组成一个整数返回"
    export function getLedPlots(): number {
        let plots = 0;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                plots = plots * 2;
                if (led.point(i, j)) {
                    plots += 1;
                }
            }
        }
        return plots;
    }

    function ledOnBoard(msg: string) {
        let cmd = msg.substr(0, 3);
        let arg = msg.substr(3, msg.length - 3);
        switch (cmd) {
            case "llp": // 读取板载led5*5状态
                bluetooth.uartWriteString("llp" + getLedPlots())
                break;
            case "slp":   // 设置板载led一点
                let x = parseInt(arg.substr(0, 1))
                let y = parseInt(arg.substr(1, 1))
                let b = arg.substr(2, 1)
                if (b == "1") {
                    led.plot(x, y); // 点亮
                }
                else {
                    led.unplot(x, y); // 关闭
                }
                bluetooth.uartWriteString("llp" + getLedPlots())
                break;
        }
    }

    // 处理用户自定义自动发送信息
    // function UsesDefinedMessage(arg: string) {
    //     // 2位ID，为了扩展，暂时其实只用到1位，不使用0，从1开始
    //     let id = parseInt(arg.substr(0, 2));
    //     if (id == 0 || id > UD_MAX_ID) return; // ID不合法，反馈
    //     let enable = parseInt(arg.substr(3, 1)); // 0 停止，1开始
    //     let timeout = parseInt(arg.substr(4, 4)); // 发送延迟，不能小于min
    //     UD_TIMEOUT[id - 1] = timeout > MIN_SEND_TIMEOUT ? timeout : MIN_SEND_TIMEOUT;
    //     UD_NEXTTIME[id - 1] = input.runningTime();

    //     UD_AUTO_SEND[id - 1] = enable == 1; // 设置自动发送
    // }

    // 第一位为停止位，如果为1，则转动舵机后不断电，如果为0，则转动后断电
    // 第二位开始每4位为一个组，其中第一位为舵机编号，支持0-9共10个舵机，
    // 接下去3位为转动角度，0～990(一般为0～180)
    function servo(arg: string) {

        let stop = parseInt(arg.substr(0, 1));
        if (arg.length >= 5) {
            let index = parseInt(arg.substr(1, 1));
            let degree = parseInt(arg.substr(2, 3));
            robotbit.Servo(index, degree);
            if (stop) {
                basic.pause(50);
                //setPwm(index + 7, 0, 0);// 舵机断电
                ServosOff(7);
            }
        }
        if (arg.length >= 9) {
            let index = parseInt(arg.substr(5, 1));
            let degree = parseInt(arg.substr(6, 3));
            robotbit.Servo(index, degree);
            if (stop) {
                basic.pause(50);
                //setPwm(index + 7, 0, 0);// 舵机断电
                ServosOff(7);
            }
        }
        if (arg.length >= 13) {
            let index = parseInt(arg.substr(9, 1));
            let degree = parseInt(arg.substr(10, 3));
            robotbit.Servo(index, degree);
            if (stop) {
                basic.pause(50);
                //setPwm(index + 7, 0, 0);// 舵机断电
                ServosOff(7);
            }
        }
        basic.pause(20);

    }

    // 前4位LED偏移，后面的N位为颜色（int32）
    function showLed(arg: string) {
        //basic.showString(arg);
        if (strip != null) {
            let ledstr = arg.substr(6, arg.length - 6);
            let rgb = parseInt("0x" + arg.substr(0, 6));
            let leds = splitString("|", ledstr);
            //basic.showNumber(leds.length);
            for (let i = 0; i < leds.length; i++) {
                strip.setPixelColor(parseInt(leds[i]), rgb);

            }
            strip.show();
        }
    }

    // 4个速度，分别为M1A,M2B,M2A,M1B,每个速度4位-255～0255
    function tt4(arg: string) {
        M1A_SPEED = parseInt(arg.substr(0, 4));
        M2B_SPEED = parseInt(arg.substr(4, 4));
        if (arg.length >= 16) {
            M2A_SPEED = parseInt(arg.substr(8, 4));
            M1B_SPEED = parseInt(arg.substr(12, 4));
        }
        motorRestore();
    }
    // 2018-10-6，doMove 这个方法以后直接可以用tt4替代，暂时保留
    function doMove(arg: string) {
        let direction = arg.substr(0, 3);

        switch (direction) {
            case "fwd":
                let speed = parseInt(arg.substr(3));
                M1A_SPEED = -speed, M2B_SPEED = speed;
                break;
            case "spd": // 默认M1A,M2B，2018-6-13从5位改为4位
                M1A_SPEED = parseInt(arg.substr(3, 4));
                M2B_SPEED = parseInt(arg.substr(7));
                break;
            case "end"://end
                M1A_SPEED = 0, M2B_SPEED = 0, M2A_SPEED = 0, M1B_SPEED = 0;;
                break;
            default:
                // 此时自定义马达运转，3位标识，4位速度
                if (arg.length > 7) {
                    let m = direction;
                    let s = parseInt(arg.substr(3, 4));
                    setSpeed(m, s);
                }
                if (arg.length >= 14) {
                    let m = arg.substr(7, 3);
                    let s = parseInt(arg.substr(10, 4));
                    setSpeed(m, s);
                }
                break;
        }
        motorRestore();
    }
    // 2018-10-06   setSpeed 这个方法以后直接可以用tt4替代，暂时保留
    function setSpeed(Motor: string, Speed: number) {
        switch (Motor) {
            case "m1a":
                M1A_SPEED = Speed;
                break;
            case "m2b":
                M2B_SPEED = Speed;
                break;
            case "m2a":
                M2A_SPEED = Speed;
                break;
            case "m1b":
                M1B_SPEED = Speed;
                break;
        }
    }

    // function doPause() {
    //     //robotbit.MotorRun(robotbit.Motors.M1A, 0);
    //     //robotbit.MotorRun(robotbit.Motors.M2B, 0);
    //     //robotbit.MotorRun(robotbit.Motors.M2A, 0);
    //     //robotbit.MotorRun(robotbit.Motors.M1B, 0);
    //     M1A_SPEED = 0, M2B_SPEED = 0, M2A_SPEED = 0, M1B_SPEED = 0;
    //     motorRestore();
    // }

    function motorRestore() {
        robotbit.MotorRun(robotbit.Motors.M1A, M1A_SPEED);
        robotbit.MotorRun(robotbit.Motors.M2B, M2B_SPEED);
        robotbit.MotorRun(robotbit.Motors.M2A, M2A_SPEED);
        robotbit.MotorRun(robotbit.Motors.M1B, M1B_SPEED);
    }

    // function getSensor(cmd: string, arg: string): boolean {
    //     switch (cmd) {    // 1开启自动发送，0关闭自动发送
    //         case "us1":
    //             US_AUTO_SEND = true;
    //             US_TIMEOUT = parseInt(arg);
    //             if (US_TIMEOUT < MIN_SEND_TIMEOUT) US_TIMEOUT = MIN_SEND_TIMEOUT;
    //             break;
    //         case "us0":
    //             US_AUTO_SEND = false;
    //             break;
    //         case "ac1":
    //             AC_AUTO_SEND = true;
    //             AC_TIMEOUT = parseInt(arg);
    //             if (AC_TIMEOUT < MIN_SEND_TIMEOUT) AC_TIMEOUT = MIN_SEND_TIMEOUT;
    //             break;
    //         case "ac0":
    //             AC_AUTO_SEND = false;
    //             break;
    //         case "ch1":
    //             CH_AUTO_SEND = true;
    //             CH_TIMEOUT = parseInt(arg);
    //             if (CH_TIMEOUT < MIN_SEND_TIMEOUT) CH_TIMEOUT = MIN_SEND_TIMEOUT;
    //             break;
    //         case "ch0":
    //             CH_AUTO_SEND = false;
    //             break;
    //         case "usp": // 设置超声波端口
    //             let usp = parseInt(arg);
    //             initUltrasonic(usp);
    //             break;
    //         case "usc": // 用舵机带动超声波扫描前方障碍物
    //             SCAN_ULTRASONIC = true;
    //             break;
    //         default:
    //             return false;
    //     }
    //     return true;
    // }
    //% blockId=knock_robot_neopixel_isBluetoothConnected
    //% block="是否已通过蓝牙连接"
    export function isBluetoothConnected(): boolean {
        return BluetoothConnected;
    }

    //% blockId=knock_robot_neopixel_initUltrasonic
    //% block="初始化超声波 |端口（-1为禁止） %us_port"
    export function initUltrasonic(us_port: number): boolean {
        if (us_port > -1 && us_port < 17) {
            US_PORT = us_port + 7;
            US_INIT = true;
        }
        else if (us_port == 19 || us_port == 20) {
            US_PORT = us_port + 5;
            US_INIT = true;
        }
        else {
            US_INIT = false;
        }
        return US_INIT;
    }

    //let messageArgString = new CommandContainer();
    /**
     * Handles any incoming message
     */
    function handleIncomingUARTData(auto: boolean) {
        let msg = bluetooth.uartReadUntil(terminator)

        if (msg.length < 3) return;// 非法命令（以后再处理）
        let cmd = msg.substr(0, 3);
        let args = msg.substr(3, msg.length - 3);

        let handlerToExamine = CMD_HANDLERS;

        messageContainer.args = args;

        //analyzeCmd(cmd, arg);
        //messageContainer = arg;
        if (handlerToExamine == null) { //empty handler list
            //basic.showString("nohandler")
            if (auto) {   //handle message with auto handler
                handleMessage(cmd, args);
            }
        }
        else {
            let handled = false;

            while (handlerToExamine != null) {
                if (handlerToExamine.key == cmd) {
                    handlerToExamine.callback(messageContainer)
                    handled = true;
                }
                handlerToExamine = handlerToExamine.next
            }

            if (!handled && auto) {   //handle message with auto handler
                handleMessage(cmd, args);
            }
        }
    }
    /**
      * init microbit with robotbit and neopixel
      * @param id; eg: "1"
    */
    //% blockId=knock_robot_neopixel_sendUserMessage
    //% block="发送用户消息 |id（0~9） %id | 消息（最大长度17） %msg"
    export function sendUserMessage(id: number, msg: string) {
        if (BluetoothConnected) {
            bluetooth.uartWriteString("ud" + (id % 10).toString() + msg.substr(0, 17));
        }
    }

    //% blockId=knock_robot_neopixel_sendSuperMessage
    //% block="发送超级消息 | 消息（最大长度20） %msg"
    export function sendSuperMessage(msg: string) {
        if (BluetoothConnected) {
            bluetooth.uartWriteString(msg.substr(0, 20));
        }
    }

    //% block="自动返回消息（如陀螺仪，指南针，超声波等）"
    // export function sendMessage() {
    //     if (BluetoothConnected) {   // 3个字符为命令，第三个字符1为正常，0为异常
    //         if (CH_AUTO_SEND && CH_NEXTTIME < input.runningTime()) {
    //             if (CH_INIT) {
    //                 bluetooth.uartWriteString("ch1" + input.compassHeading())
    //                 CH_NEXTTIME = input.runningTime() + CH_TIMEOUT;
    //             } else {
    //                 bluetooth.uartWriteString("ch0" + "-1")
    //                 CH_AUTO_SEND = false;   // 自动停止发送
    //             }
    //         }
    //         if (US_AUTO_SEND && US_NEXTTIME < input.runningTime()) {
    //             if (US_INIT) {
    //                 bluetooth.uartWriteString("us1" + Ultrasonic(US_PORT))
    //                 US_NEXTTIME = input.runningTime() + US_TIMEOUT;
    //             } else {
    //                 bluetooth.uartWriteString("us0" + "-1")
    //                 US_AUTO_SEND = false;   // 自动停止发送
    //             }
    //         }
    //         if (AC_AUTO_SEND && AC_NEXTTIME < input.runningTime()) {
    //             bluetooth.uartWriteString("ac1" + input.acceleration(Dimension.X) + "|" + input.acceleration(Dimension.Y) + "|" + input.acceleration(Dimension.Z))
    //             AC_NEXTTIME = input.runningTime() + AC_TIMEOUT;
    //         }
    //         // if (SCAN_ULTRASONIC) {   // 扫描功能调试后再启用
    //         //     SCAN_ULTRASONIC = false;
    //         //     scanUltrasonic();
    //         // }

    //         // 处理用户自定义数据返回
    //         for (let i = 0; i < UD_MAX_ID; i++) {
    //             if (UD_AUTO_SEND[i] && UD_NEXTTIME[i] < input.runningTime()) {
    //                 UD_NEXTTIME[i] = input.runningTime() + UD_TIMEOUT[i];
    //                 let handlerToExamine = UD_HANDLERS;

    //                 while (handlerToExamine != null) {
    //                     if (handlerToExamine.id == i) {
    //                         handlerToExamine.callback()
    //                         break;
    //                     }
    //                     handlerToExamine = handlerToExamine.next
    //                 }
    //             }
    //         }
    //     }
    // }

    // 期待下个版本支持浮点数的makecode
    // robotbit引入模块 ，此处测到的距离是58倍的CM，因为MAKECODE暂时无法处理浮点数
    // function Ultrasonic(pin: DigitalPin): number {

    //     // send pulse
    //     pins.setPull(pin, PinPullMode.PullNone);
    //     pins.digitalWritePin(pin, 0);
    //     control.waitMicros(2);
    //     pins.digitalWritePin(pin, 1);
    //     control.waitMicros(10);
    //     pins.digitalWritePin(pin, 0);

    //     // read pulse
    //     //In JavaScript, numbers are floating point values. However, for the micro:bit, numbers are integer values.
    //     // 所以这里获得的超声波数值不除58，发送到手机端操作。
    //     let d = pins.pulseIn(pin, PulseValue.High, 11600);
    //     return d;
    // }


    // 发送多次扫描结果，us9表示停车扫描
    // function scanUltrasonic() {
    //     doPause();
    //     robotbit.Servo(robotbit.Servos.S1, 10);
    //     basic.pause(150);
    //     let us_AUTO_SEND = US_AUTO_SEND;
    //     US_AUTO_SEND = false;
    //     let dddd = [10, 30, 60, 90, 120, 150, 170];
    //     dddd.forEach((value: number, index: number) => {
    //         robotbit.Servo(robotbit.Servos.S1, value);
    //         basic.pause(80);
    //         if (US_INIT) {
    //             bluetooth.uartWriteString("us9" + value.toString() + "|" + Ultrasonic(US_PORT))
    //         }
    //     })
    //     robotbit.Servo(robotbit.Servos.S1, 90);
    //     basic.pause(100);// 等待舵机复位
    //     setPwm(robotbit.Servos.S1 + 7, 0, 0);// 舵机断电
    //     US_AUTO_SEND = us_AUTO_SEND;
    //     motorRestore();
    // }
    // const PCA9685_ADDRESS = 0x40
    // const LED0_ON_L = 0x06
    // function setPwm(channel: number, on: number, off: number): void {
    //     if (channel < 0 || channel > 15)
    //         return;

    //     let buf = pins.createBuffer(5);
    //     buf[0] = LED0_ON_L + 4 * channel;
    //     buf[1] = on & 0xff;
    //     buf[2] = (on >> 8) & 0xff;
    //     buf[3] = off & 0xff;
    //     buf[4] = (off >> 8) & 0xff;
    //     pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    // }

    function ServosOff(channel: number) {
        robotbit.Servo(channel, -60);
    }

    /**
      * init microbit with robotbit and neopixel
      * @param autoHandle; eg: true
      * @param drobotled; eg: 4
      */
    //% blockId=knock_robot_neopixel_init
    //% block="初始化 |自动处理消息 %autoHandle | 启用板载LED %robotled"
    export function init(autoHandle: boolean, robotled: number) {
        bluetooth.startUartService();
        bluetooth.onUartDataReceived(terminator, () => {
            handleIncomingUARTData(autoHandle);
            basic.pause(10);
        })

        bluetooth.onBluetoothConnected(() => {
            BluetoothConnected = true
            basic.showIcon(IconNames.Diamond)
            // music.playTone(600, 50)
            // music.playTone(800, 50)
            // music.playTone(1200, 50)
            music.playTone(523, 50) // 调整音调，和前端演示代码一致
            music.playTone(698, 50)
            music.playTone(988, 50)
            basic.pause(10)
        })
        bluetooth.onBluetoothDisconnected(() => {
            BluetoothConnected = false
            basic.showIcon(IconNames.SmallDiamond)
            if (strip != null) {    // 断开蓝牙时关闭led灯
                for (let i = 0; i < 4; i++)
                    strip.setPixelColor(i, 0);
                strip.show();
            }
            // music.playTone(1200, 50)
            // music.playTone(800, 50)
            // music.playTone(600, 50)
            music.playTone(988, 50)
            music.playTone(698, 50)
            music.playTone(523, 50)
            basic.pause(10)

            // 置零自动发送变量
            // AC_AUTO_SEND = false;
            // CH_AUTO_SEND = false;
            // UD_AUTO_SEND = [false, false, false];
            // US_AUTO_SEND = false;
        })

        // 初始化罗盘
        // if (ch_init) {
        //     //input.calibrateCompass()
        //     let chtest = input.compassHeading()
        //     CH_INIT = true
        // }
        // 开启蓝牙uart服务
        //bluetooth.startUartService()
        // 初始化完成，等待蓝牙连接，这里可以加一些判断，显示ch,us,ac这些有没有初始化
        basic.showLeds(`
                        . . # # .
                        # . # . #
                        . # # # .
                        # . # . #
                        . . # # .
                        `)
        if (robotled > 0) {
            strip = neopixel.create(DigitalPin.P16, robotled, NeoPixelMode.RGB);
            for (let i = 0; i < 4; i++) // 初始化所有灯为关闭
                strip.setPixelColor(i, 0);
            strip.show();
        }
    }
}