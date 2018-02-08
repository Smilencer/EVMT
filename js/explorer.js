var xmlDoc = "";

$(document).ready(function () {
    //xmlDoc = window.opener.xmlDoc;
    xmlDoc = `<family class="ff" service="ffSvc"><connector type="F-Selector" name="sel1" data="fi1"><condition value="fi1==1"><vg type="Alternative"><connector type="F-Sequencer" name="seq1" data=""><condition value="0"><vg type="Optional"><component store="Atomic" class="aaa" name="a1" service="aaaSvc"></component></vg></condition><condition value="1"><component store="Atomic" class="aaa" name="a2" service="aaaSvc"></component></condition></connector><vg type="Or"><component store="Atomic" class="aaa" name="a3" service="aaaSvc"></component><component store="Atomic" class="aaa" name="a4" service="aaaSvc"></component></vg></vg></condition><condition value="fi1==2"><component store="Composite" class="bbb" name="b1" service="bbbSvc"></component></condition></connector><dataChannel><input list="fi1"></input><output list=""></output></dataChannel></family>`;
    var xmlTree = $(xmlDoc);
    var depthMap = assessDepth(xmlTree);
    generateComposition(depthMap, xmlTree);
})

function assessDepth(xmlTree) {
    let depthMap = new Map();
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

function generateComposition(depthMap, xmlTree) {
    // for (let key of depthMap.keys()) {
    //     if(key==0){

    //     }
    // }
    let value = depthMap.get(0);
    console.log(generateBottomComposition(value[0], xmlTree));
}

function generateBottomComposition(connectorName, xmlTree) {
    let mapArray = [];
    let connector = $(xmlTree).find(`connector[name='${connectorName}']`);
    let condition = $(connector).children("condition");
    for (let item of condition) {
        if ($(item).children().is("vg")) {
            mapArray.push(digNode($(item).children()));
        }
        else if ($(item).children().is("component")) {
            let set = new Set();
            set.add($(item).children().attr("name"));
            mapArray.push(set);
        }
    }
    return mapArray;
}

function digNode(node) {
    if ($(node).is("component")) {
        let set = new Set();
        set.add($(node).attr("name"));
        return set;
    }
    else if ($(node).is("vg")) {
        switch ($(node).attr("type")) {
            case "Optional":
                return expandOptional(digNode($(node).children().eq(0)));
            case "Alternative":
                var arr = [];
                var vgChildren = $(node).children();
                for (let vgChild of vgChildren) {
                    arr.push(digNode(vgChild));
                }
                return expandAlternative(...arr);
            case "Or":
                var arr = [];
                var vgChildren = $(node).children();
                for (let vgChild of vgChildren) {
                    arr.push(digNode(vgChild));
                }
                return expandOr(...arr);
            default:
                break;
        }
    }
}

function expandOptional(oneSet) {
    oneSet.add("");
    return oneSet;
}

function expandAlternative(...mulptiSets) {
    let oneSet = new Set();
    for (let item of mulptiSets) {
        for (let v of item.values()) {
            oneSet.add(v);
        }
    }
    return oneSet;
}

function expandOr(...mulptiSets) {
    let oneSet = expandAlternative(...mulptiSets);
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