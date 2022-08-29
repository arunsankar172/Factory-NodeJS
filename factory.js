const express = require('express')
var url = require('url');
var mysql = require('mysql2');
var bodyParser = require('body-parser');
var request = require('request');
const path = require('path');
var count = 0;
var onFlag = 0;
var waitTill;
var alarmFlag;
var kw;
var oldTime=new Date()
const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var con = mysql.createConnection({
    host: "localhost",
    user: "root1",
    password: "Arun@172000",
    database: "factory"
});

app.post('/update_data', (req, res) => {
    var data = req.body
    var response = {
        status: ""
    }
    // console.log(data)
    if (data.kw > 100) {
        sendNotification();
    }
    else {
        count = 0;
    }
    con.connect(function (err) {
        if (err) throw err
        con.query("UPDATE energy SET kw=?, vp1=?, vp2=? ,vp3=? ,il1=? ,il2=? ,il3=?  WHERE id LIKE 1;", [data.kw, data.vp1, data.vp2, data.vp3, data.il1, data.il2, data.il3, data.alarm, data.relay], function (err, result) {
            if (err) throw err
            response.status = "updated"
            res.status(200).send(JSON.stringify(response))
        })
    })
})

app.get('/get_data', (req, res) => {
    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM energy ORDER BY id DESC LIMIT 1;", function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                res.status(200).send(JSON.stringify(result[0]));
            }
        });
    });
})

app.get('/get_data1', (req, res) => {
    var response = {
        data: "",
        usage: ""
    }
    var dataJSON='{"id":0,"kw":"Power OFF","vp1":"0.00","vp2":"0.00","vp3":"0.00","il1":"","il2":"","il3":"","pf":"0.00","alarm":"1","relay":"1}'
    var newTime=new Date()
    var timeDiff=(newTime.getTime()-oldTime.getTime())/1000
    if(parseFloat(timeDiff)>15){    
     console.log("Power OFF")
    // console.log(JSON.stringify(dataJSON))
     response.data = JSON.stringify(dataJSON)
    }
    else{
    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM energy ORDER BY id DESC LIMIT 1;", function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                response.data = JSON.stringify(result[0])
                // console.log(JSON.stringify(result[0]))
                // console.log(response.data)
                // res.status(200).send(JSON.stringify(result[0]));
            }
        });
    });
    }

    con.connect(function (err) {
        if (err) throw err;
        con.query('SELECT (SELECT SUM(kw*0.000972222) AS "usage" from energy WHERE DAY(time) = DAY(CURRENT_DATE())) as "today" ,(SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE YEARWEEK(time) = YEARWEEK(CURRENT_DATE()) ) as "thisweek", (SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE MONTH(time) = MONTH(CURRENT_DATE())) as "thismonth";', function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                response.usage = JSON.stringify(result[0])
                // console.log(response)
                res.status(200).send(JSON.stringify(response));
            }
        });
    });
    console.log(response.data)
})

app.get('/update1_data/', (req, res) => {
    var data = url.parse(req.url, true).query;
    kw = data.kw
//console.log(data)
	
	 if (parseFloat(data.kw) < 1000) {

        if (data.kw > 100) {
            sendNotification();
        }
        else {
            count = 0;
        }
        var volt = parseFloat(data.vp1) + parseFloat(data.vp2) + parseFloat(data.vp3)
        console.log(volt)
        
	if (volt <= 0) {
            console.log("Power OFF")
            onFlag = 1;
        }
        else {
            if (onFlag == 1 && (volt > 0)) {
                console.log("Power ON")
                onAlarm();
            }
        }
	var newTime=new Date()
	var timeDiff=(newTime.getTime()-oldTime.getTime())/1000
	if(parseFloat(timeDiff)>60){	
	console.log("Power ON")
	onAlarm()
	}
	oldTime= new Date()
        con.connect(function (err) {
            if (err) throw err
            // con.query("UPDATE energy SET kw=?, vp1=?, vp2=? ,vp3=? ,il1=? ,il2=? ,il3=?  WHERE id LIKE 1;", [data.kw, data.vp1, data.vp2, data.vp3, data.il1, data.il2, data.il3, data.alarm, data.relay], function (err, result) {
            con.query("INSERT INTO energy (kw, vp1, vp2 ,vp3 ,il1 ,il2 ,il3, pf) VALUES (?,?,?,?,'','','',?) ;", [data.kw, data.vp1, data.vp2, data.vp3, data.pf], function (err, result) {
                if (err) throw err
                res.status(200).send("success");
            })
        })

        con.connect(function (err) {
            if (err) throw err
            con.query("INSERT INTO volt (volt) VALUES (?);", [timeDiff], function(err, result) {
                if (err) throw err
                //res.status(200).send("success");
            })
        })
    }

})

app.get('/update_alarm/:state', (req, res) => {
    con.connect(function (err) {
        if (err) throw err;
        con.query("UPDATE energy SET alarm =? WHERE id LIKE 1", [req.params.state], function (err, result, fields) {
            if (err) throw err;
            res.status(200).send("success");
        });
    });
})

app.get('/iframe', (req, res) => {
    // res.send('<iframe src="https://grafana.aruncloud.ga/d-solo/k3-uGnqnk/power-monitor?orgId=1&refresh=10s&theme=dark&panelId=19" width="100%" height="100%" frameborder="0" border-radius: "20px";  allowfullscreen"></iframe>')
    res.sendFile(path.join(__dirname + '/iframe.html'))
})
app.get('/iframe1', (req, res) => {
    // res.send('<iframe src="https://grafana.aruncloud.ga/d-solo/k3-uGnqnk/power-monitor?orgId=1&refresh=10s&theme=dark&panelId=19" width="100%" height="100%" frameborder="0" border-radius: "20px";  allowfullscreen"></iframe>')
    res.sendFile(path.join(__dirname + '/iframe1.html'))
})

app.listen(5000, () => {
    console.log(`Example app listening at http://localhost:5000`)
})

function sendNotification() {
    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM energy ORDER BY id DESC LIMIT 1;", function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                alarmFlag = result[0].alarm
            }
        });
    });

    console.log("Alarm: " + alarmFlag + " | Wait: " + waitTill + " | Now: " + new Date())
    if ((alarmFlag != '0' || alarmFlag == undefined) && (waitTill < new Date() || waitTill == undefined) && count < 3) {

        con.connect(function (err) {
            if (err) throw err
            con.query("INSERT INTO alarm_log (kw) VALUES (?) ;", [kw], function (err, result) {
                if (err) throw err
                // res.status(200).send("success");
            })
        })


        console.log("Sending Notification")
        count += 1;
        var headersOpt = {
            "content-type": "application/json",
            "Authorization": "key=AAAA2Y0T-qE:APA91bGuJwoJ5Kgov1f6h8ru2963O9TkJNSNWjhrqGpijI3RKsBPdGhHQYeyPnhE8lK_4MVcxXODt036U4eK-Tc-n6V7o_2HXJDpNnW3zDXvS-vJwTBmaLrGUxCDQsGsDLJh_ukadFuX"
        };
        var data = {
            "to": "/topics/factoryupdate",
            "data": {
                "title": "Power Usage",
                "content": "Limit Reached",
                "type": "usage"
            }
        }
        request(
            {
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                headers: headersOpt,
                json: data,
            }, function (error, response, body) {
                //Print the Response
                console.log(body);
            });
        waitTill = new Date(new Date().getTime() + 120 * 1000);
    }
}

function onAlarm() {
    console.log("ON Alarm");
    onFlag = 0;
    con.connect(function (err) {
        if (err) throw err
        con.query("INSERT INTO alarm_log (kw) VALUES ('Power ON') ;", function (err, result) {
            if (err) throw err
            // res.status(200).send("success");
        })
    })
    var headersOpt = {
        "content-type": "application/json",
        "Authorization": "key=AAAA2Y0T-qE:APA91bGuJwoJ5Kgov1f6h8ru2963O9TkJNSNWjhrqGpijI3RKsBPdGhHQYeyPnhE8lK_4MVcxXODt036U4eK-Tc-n6V7o_2HXJDpNnW3zDXvS-vJwTBmaLrGUxCDQsGsDLJh_ukadFuX"
    };
    var data = {
        "to": "/topics/factoryupdate",
        "data": {
            "title": "Power ON",
            "content": "Power ON",
            "type": "poweron"
        }
    }
    request(
        {
            method: 'POST',
            url: 'https://fcm.googleapis.com/fcm/send',
            headers: headersOpt,
            json: data,
        }, function (error, response, body) {
            //Print the Response
            console.log(body);
        });
}

// SELECT SUM(power*0.00194444)/1000 AS DailyKW, Date(time) FROM power GROUP BY DATE(time) ORDER BY `Date(time)` DESC;
// SELECT SUM(power*0.00194444)/1000 AS DailyKW, Date(time) as Time FROM power GROUP BY DATE(time) ORDER BY Date(time) DESC LIMIT 10;

// SELECT
//   unix_timestamp(date(time)) AS "time",
//   SUM(power*0.001944) AS "Power"
// FROM power
// GROUP BY unix_timestamp(date(time))
// ORDER BY time desc limit 10

// SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE MONTH(time) = MONTH(CURRENT_DATE());

// SELECT kw AS "usage",time FROM energy WHERE YEARWEEK(time)=YEARWEEK(NOW());

// SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE YEARWEEK(time) = YEARWEEK(CURRENT_DATE())

// SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE time > current_date - interval 7 day;

// SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE DATE(time) = CURDATE();

// SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE DAY(time) = DAY(CURRENT_DATE());

// SELECT (SELECT SUM(kw*0.000972222) AS "usage" from energy WHERE DAY(time) = DAY(CURRENT_DATE())) as "today" ,(SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE time > current_date - interval 7 day) as "last7days", (SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE MONTH(time) = MONTH(CURRENT_DATE())) as "last30days";

// SELECT (SELECT SUM(kw*0.000972222) AS "usage" from energy WHERE DAY(time) = DAY(CURRENT_DATE())) as "today" ,(SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE YEARWEEK(time) = YEARWEEK(CURRENT_DATE())
// ) as "last7days", (SELECT SUM(kw*0.000972222) AS "usage" FROM energy WHERE MONTH(time) = MONTH(CURRENT_DATE())) as "last30days";


