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
    return depthMap;
}