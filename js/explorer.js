var xmlDoc = "";

$(document).ready(function () {
    //xmlDoc = window.opener.xmlDoc;
    xmlDoc = `<family class="ff" service="ffSvc"><connector type="F-Selector" name="sel1" data="fi1"><condition value="fi1==1"><vg type="Alternative"><connector type="F-Sequencer" name="seq1" data=""><condition value="0"><vg type="Optional"><component store="Atomic" class="aaa" name="a1" service="aaaSvc"></component></vg></condition><condition value="1"><component store="Atomic" class="aaa" name="a2" service="aaaSvc"></component></condition></connector><vg type="Or"><component store="Atomic" class="aaa" name="a3" service="aaaSvc"></component><component store="Atomic" class="aaa" name="a4" service="aaaSvc"></component></vg></vg></condition><condition value="fi1==2"><component store="Composite" class="bbb" name="b1" service="bbbSvc"></component></condition></connector><dataChannel><input list="fi1"></input><output list=""></output></dataChannel></family>`;
})

function assessDepth() {
    var depthMap = new Map();
    var xmlTree = $(xmlDoc);
    var connectorArray = $(xmlTree).find("connector");
    for (let connectorNode of connectorArray) {
        var subConnectorArray = $(connectorNode).find("connector");
        var len = subConnectorArray.length;
        if (depthMap.has(len)) {
            let arr = depthMap.get(len);
            arr.push($(connectorNode).attr("name"));
            depthMap.set(len, arr);
        }
        else {
            let arr = [];
            arr.push($(connectorNode).attr("name"));
            depthMap.set(len, arr);
        }
    }
    return depthMap;  //new Map([...depthMap.entries()].sort())
}

function ExpandOptional(oneSet) {
    oneSet.add("");
    return oneSet;
}

function ExpandAlternative(...mulptiSets) {
    let oneSet = new Set();
    for (let item of mulptiSets) {
        for (let v of item.values()) {
            oneSet.add(v);
        }
    }
    return oneSet;
}

function ExpandOr(...mulptiSets) {
    let oneSet = ExpandAlternative(...mulptiSets);
    var arr = [...oneSet];
    var listArr = [""];
    var result = [];
    for (var k = 0, len = arr.length; k < len; k++) {
        listArr.forEach(x => {
            listArr.push(x + "," + arr[k]);
        });
    }
    for (var n = 0; n < listArr.length; n++) {
        if (listArr[n] != "") {
            let str = listArr[n].replace(",", "");
            if (str.endsWith(",")) {
                str = str.substr(0, str.length - 1)
            }
            result.push(str);
        }
    }
    oneSet.clear();
    for (let item of result) {
        if (item != "") {
            let tempArr = item.split(",");
            oneSet.add([...new Set(tempArr)].sort().join(","))
        }
    }
    return oneSet;
}