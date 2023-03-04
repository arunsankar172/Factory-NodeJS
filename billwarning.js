const request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
request('http://tneb.tnebnet.org/newlt/detconws.php?rsno=4&reg=4&sec=555&dist=001&serno=1172', function (error, response, body) {
//   console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//   console.log('body:', body); 
const dom = new JSDOM(body);
if((response && response.statusCode)==200){
    
    var due=null;
    try{
        due=dom.window.document.querySelector("body > table:nth-child(1) > tbody > tr:nth-child(6) > td > table:nth-child(1) > tbody > tr > td > font > b").textContent;
        console.log(due);
    }
    catch (err){
        console.log(err);
    }
    if(due!=null){
        const amt=dom.window.document.querySelector("body > table:nth-child(1) > tbody > tr:nth-child(6) > td > table:nth-child(4) > tbody > tr:nth-child(3) > td:nth-child(4)").textContent;
        const dueDate=dom.window.document.querySelector("body > table:nth-child(1) > tbody > tr:nth-child(6) > td > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(5) > font").textContent;
        var notification="Amount: ₹"+amt+", Due: "+dueDate;
        console.log(notification);
        billNotification(notification);

    }
}
});

function billNotification(message) {
    console.log("Bill Notification");
    var headersOpt = {
        "content-type": "application/json",
        "Authorization": "key=AAAA2Y0T-qE:APA91bGuJwoJ5Kgov1f6h8ru2963O9TkJNSNWjhrqGpijI3RKsBPdGhHQYeyPnhE8lK_4MVcxXODt036U4eK-Tc-n6V7o_2HXJDpNnW3zDXvS-vJwTBmaLrGUxCDQsGsDLJh_ukadFuX"
    };
    var data = {
        "to": "/topics/factoryupdate",
        "data": {
            "title": "Bill Warning: Unpaid Bill",
            "content": message,
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
