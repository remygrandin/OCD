// AJAX from http://stackoverflow.com/questions/20663353/is-it-feasible-to-do-an-ajax-request-from-a-web-worker
var ajax = function (url, data, callback, type, async) {
    if (typeof async == "undefined")
        async = true;

    var data_array, data_string, idx, req, value;
    if (data == null) {
        data = {};
    }
    if (callback == null) {
        callback = function () { };
    }
    if (type == null) {
        //default to a GET request
        type = 'GET';
    }
    data_array = [];
    for (idx in data) {
        value = data[idx];
        data_array.push("" + idx + "=" + value);
    }
    data_string = data_array.join("&");
    req = new XMLHttpRequest();
    req.open(type, url, async);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            return callback(req.responseText, req.status);
        }
    };
    try {
        req.send(data_string);
            return req;
    } catch (e) {
    }
    
};

const ROUTE_STATE_WORKER_STARTED = 0;
const ROUTE_STATE_DOWNLOAD_STARTED = 1;
const ROUTE_STATE_DOWNLOAD_DONE = 2;
const ROUTE_STATE_PARSING_STARTED = 3;
const ROUTE_STATE_PARSING_DONE = 4;
const ROUTE_STATE_GETTING_MAX_IMAGE = 5;
const ROUTE_STATE_MAX_IMAGE_FOUND = 6;
const ROUTE_STATE_DONE = 7;

var id;
var key;
var url;

self.importScripts('/Assets/Custom/js/unitConverter.js');
self.importScripts('/Assets/Moment/js/moment.js');

self.onmessage = function (event) {
    switch (event.data.cmd) {
        case "SetId":
            id = event.data.id;
            break;
        case "ParseRoute":
            self.postMessage({ cmd: "setState", state: "Worker Started", id: ROUTE_STATE_WORKER_STARTED });
            key = event.data.key;
            url = event.data.url;
            processRoute(event.data.url);
            break;
        case "FindMaxPicture":
            key = event.data.key;
            url = event.data.url;
            findMaxPicture(event.data.url, event.data.pointCount);
            break;

    }
};

function processRoute(url) {
    self.postMessage({ cmd: "setState", state: "Download Started", id: ROUTE_STATE_DOWNLOAD_STARTED });
    downloadRouteFile(url, function (data) {
        self.postMessage({ cmd: "setState", state: "Download Done", id: ROUTE_STATE_DOWNLOAD_DONE });
        self.postMessage({ cmd: "setState", state: "Parsing Started", id: ROUTE_STATE_PARSING_STARTED });
        var retObj = {};

        retObj.data = JSON.parse(data);

        retObj.avgSpeed = 0;
        retObj.totalDist = 0;

        let date = moment(key, "YYYY-MM-DD--HH-mm-ss");

        retObj.maxSpeed = 0;
        retObj.minSpeed = 100000;

        retObj.dataByDate = {};

        for (let i = 0; i < retObj.data.length; i++) {
            let point = retObj.data[i];
            point.secPos = i;

            retObj.avgSpeed += point.speed;

            let pointDate = date.clone().add(i, "seconds");

            point.date = pointDate.toISOString();

            point.dateStr = pointDate.format("YYYY/MM/DD HH:mm:ss");

            retObj.dataByDate[point.date] = point;

            if (point.speed > retObj.maxSpeed)
                retObj.maxSpeed = retObj.data[i].speed;

            if (point.speed < retObj.minSpeed)
                retObj.minSpeed = retObj.data[i].speed;
        }

        retObj.avgSpeed /= retObj.data.length;

        retObj.totalDist = retObj.data[retObj.data.length - 1].dist;

        retObj.startDate = date.format("YYYY/MM/DD HH:mm:ss");

        retObj.endDate = date.clone().add(retObj.data.length, "seconds").format("YYYY/MM/DD HH:mm:ss");

        retObj.duration = retObj.data.length;

        self.postMessage({ cmd: "parsingDone", id: id, key: key, obj: retObj });

        self.postMessage({ cmd: "setState", state: "Parsing Done", id: ROUTE_STATE_PARSING_DONE });

        self.postMessage({ cmd: "done"});
    });
}

function findMaxPicture(url, pointcount) {
    var start = new Date().getTime();
    self.postMessage({ cmd: "setState", state: "Getting Max Image", id: ROUTE_STATE_GETTING_MAX_IMAGE });
    
    // Step 1 : go down 10 by 10
    var aproxId = -1;
    var exit = false;
    for (let i = pointcount; i > 0 ; i -= 20) {
        ajax(url + "/sec" + i + ".jpg", null, function (resp, code) {
            if (code != 403) {
                aproxId = i;
                exit = true;
            }
        }, "GET", false);
        if (exit)
            break;
    }

    // Step 2 : go back up
    exit = false;
    for (let i = aproxId; i <= pointcount ; i++) {
        ajax(url + "/sec" + i + ".jpg", null, function (resp, code) {
            if (code !== 200) {
                aproxId = i - 2;
                exit = true;
            }
        }, "GET", false);
        if (exit)
            break;
    }


    

    self.postMessage({ cmd: "maxPictureFound", id: id, key: key, obj: aproxId });

    self.postMessage({ cmd: "setState", state: "Max Image Found", id: ROUTE_STATE_MAX_IMAGE_FOUND });

    self.postMessage({ cmd: "setState", state: "Done", id: ROUTE_STATE_DONE });

    var end = new Date().getTime();
    var time = end - start;

    self.postMessage({ cmd: "setTime", state: "Done", time: time });

    self.postMessage({ cmd: "done" });
}

function downloadRouteFile(url, callback) {
    ajax(url + "/route.coords", null, function (data) {
        callback(data);
    }, 'GET');

}