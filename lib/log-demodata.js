var logDemodata = [
    {
        id: "demo1",
        frequency: 0.05,
        model: [
            {
                name: "var1",
                type: "boolean"
            }, {
                name: "var2",
                type: "integer",
                min: 5,
                max: 1000,
            }, {
                name: "var3",
                type: "float",
                min: 0.0,
                max: 500
            }, {
                name: "var4",
                type: "string",
                min: 10,
                max: 60
            }, {
                name: "var6",
                type: "choice",
                list: [
                    "String 1",
                    "String 2",
                    "String 3",
                    "String 4"
                ]
            }, {
                name: "var5",
                type: "datetime"
            }
        ],
        template: {
            engine: "string-format",
            message: "Message include {var6}, '{var1}', {var2} and {var3}"
        },
        logtarget: {
            file: "/tmp/demo1.log",
        },
        status: 0
    },{
        id: "demo2",
        frequency: 0.05,
        model: [
            {
                name: "phone",
                type: "choice",
                list: [
                    "+84912345678",
                    "+84921345679",
                    "+84912345676",
                    "+84912345645"
                ]
            }, {
                name: "verifyCode",
                type: "choice",
                list: [ "2385", "3487", "0923", "1288"]
            }, {
                name: "password",
                type: "choice",
                list: ["s3cr3t", "myg0d", "web4pp"]
            }
        ],
        template: {
            engine: "json",
            message: "Message JSON OBJECT: {jsonobject} done!"
        },
        logtarget: {
            file: "/tmp/demo2.log",
        },
        status: 0
    },{
        id: "demo3",
        frequency: 0.5,
        template: {
            engine: "fix",
            message: "You can win if you want"
        },
        logtarget: {
            file: "/tmp/demo3.log",
        },
        status: 0
    }
];

module.exports = logDemodata;