knock_robot_neopixel.onCmdReceived("alm", function ({ args }) {
    switch (args) {
        case "1":
            break;
        default:
            music.playTone(523, 50)
            music.playTone(988, 50)
            music.playTone(523, 50)
            music.playTone(988, 50)
            music.playTone(523, 50)
            music.playTone(988, 50)

            //I2C_LCD1602_14.ShowString("Hello micro:bit!", 0, 0)
            break;
    }
})
knock_robot_neopixel.onCmdReceived("hnd", function ({ args }) {
    if (args.length < 2) {
        return;
    }
    cmd = args.substr(0, 2)
    switch (cmd) {
        case "zz"://左转
            if (s1 < 175) s1 += 5;
            robotbit.Servo(robotbit.Servos.S1, s1)
            break;
        case "yz"://右转
            if (s1 > 5) s1 -= 5;
            robotbit.Servo(robotbit.Servos.S1, s1)
            break;
        case "st"://上抬
            if (s2 < 175) s2 += 5;
            robotbit.Servo(robotbit.Servos.S2, s2)
            break;
        case "xy"://下压
            if (s2 > 90) s2 -= 5;
            robotbit.Servo(robotbit.Servos.S2, s2)
            break;
        case "qs"://前伸
            if (s3 < 175) s3 += 5;
            robotbit.Servo(robotbit.Servos.S3, s3)
            break;
        case "hs"://后缩
            if (s3 > 60) s3 -= 5;
            robotbit.Servo(robotbit.Servos.S3, s3)
            break;
        case "jz"://夹住
            robotbit.Servo(robotbit.Servos.S4, 60);
            break;
        case "fk"://放开
            robotbit.Servo(robotbit.Servos.S4, 90)
            break;
        case "hy"://还原
            hyServo();
            break;
    }
})
function hyServo() {
    robotbit.Servo(robotbit.Servos.S1, 90);
    robotbit.Servo(robotbit.Servos.S2, 90);
    robotbit.Servo(robotbit.Servos.S3, 90);
    robotbit.Servo(robotbit.Servos.S4, 90);
    s1 = 90, s2 = 90, s3 = 90;
}
let args = ""
let s1 = 0
let s2 = 0
let s3 = 0
let cmd = ""

// I2C_LCD1602_14.LcdInit()
// knock_robot_neopixel.init(true, 4)
hyServo()
//serial.redirect(SerialPin.P1, SerialPin.P2, 9600)


basic.forever(function () {

})
