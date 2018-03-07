var xmlDoc = "";
var products = [];
var currentObject = null;
var zoomlevel = 1;
var stage;
var scene;

$(document).ready(function () {
    String.prototype.abbr = function () {
        return this.substr(0, 3).toUpperCase();
    }
    String.prototype.trimComma = function () {
        if (this.charAt(this.length - 1) == ',') {
            return this.slice(0, -1);
        }
        return this;
    }

    xmlDoc = window.opener.xmlDoc;

    var xmlTree = $(xmlDoc);
    var depthMap = assessDepth(xmlTree);
    var connectorMap = generateComposition(depthMap, xmlTree);
    var root = $(xmlTree).children("connector").attr("name");
    var rootSet = connectorMap.get(root);
    connectorMap.delete(root);
    var finalSet = combineComposition(connectorMap, rootSet);
    generateProductsXML(finalSet, xmlTree);
    $("#product_summary>span").append(`${$(xmlTree).attr("class")}: ${finalSet.size} products`);
    showExplorer();

    OpenDB();
    var canvas = document.getElementById("canvas");
    stage = new JTopo.Stage(canvas);
    scene = new JTopo.Scene();
    stage.add(scene);
    scene.mousedown(function (event) {
        if (currentObject != null) {
            currentObject.visible = false;
        }
    });
    scene.mouseup(function (event) {
        if (currentObject != null) {
            relocate();
        }
    });
    extendJTopo();
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
    return new Map([...depthMap.entries()].sort());
}

function combineComposition(connectorMap, rootSet) {
    var isToEnd = true;
    let newSet = new Set();
    for (let [key, value] of connectorMap) {
        if ([...rootSet].join("+").split(/\+|,/).includes(key)) {
            isToEnd = false;
            for (let str of rootSet) {
                if (str.includes(key)) {
                    for (let arr of value) {
                        let result = str.replace(key, arr);
                        newSet.add(result);
                    }
                }
                else {
                    newSet.add(str);
                }
            }
        }
    }
    if (isToEnd) {
        return rootSet;
    }
    else {
        return combineComposition(connectorMap, newSet);
    }
}

function generateComposition(depthMap, xmlTree) {
    var connectorMap = new Map();
    for (let key of depthMap.keys()) {
        let valueArr = depthMap.get(key);
        for (let connectorName of valueArr) {
            let setArray = generateSubComposition(connectorName, xmlTree);
            let oneSet = filterOut(doCartesian(setArray), $(xmlTree).children("constraints"));
            let interactions = $(xmlTree).find(`connector[name="${connectorName}"]`).attr("interaction");
            if (interactions != "") {
                oneSet = setInteraction(interactions, oneSet);
            }
            connectorMap.set(connectorName, oneSet);
        }
    }
    return connectorMap;
}

function generateSubComposition(connectorName, xmlTree) {
    let setArray = [];
    let connector = $(xmlTree).find(`connector[name='${connectorName}']`);
    let condition = $(connector).children("condition");
    for (let item of condition) {
        if ($(item).children().is("vg")) {
            setArray.push(digNode($(item).children()));
        }
        else if ($(item).children().is("connector")) {
            let set = new Set();
            set.add($(item).children().attr("name"));
            setArray.push(set);
        }
        else if ($(item).children().is("component")) {
            let set = new Set();
            set.add($(item).children().attr("name"));
            setArray.push(set);
        }
    }
    return setArray;
}

function digNode(node) {
    if ($(node).is("component")) {
        let set = new Set();
        set.add($(node).attr("name"));
        return set;
    }
    else if ($(node).is("connector")) {
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
                var expandedSet = expandOr(...arr);
                var finalSet = new Set();
                var card = $(node).attr("cardinality")
                if (card != undefined) {
                    var cardArr = card.split("..");
                    for (let item of expandedSet) {
                        let tempArr = item.split(",");
                        if (tempArr.length >= cardArr[0] && tempArr.length <= cardArr[1]) {
                            finalSet.add(item);
                        }
                    }
                }
                else {
                    finalSet = expandedSet;
                }
                return finalSet;
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

function doCartesian(setArray) {
    var seed = setArray[0];
    for (let i = 1, len = setArray.length; i < len; i++) {
        seed = CartesianProducts(seed, setArray[i]);
    }
    return seed;
}

function CartesianProducts(set1, set2) {
    var set3 = new Set();
    for (let s1 of set1.values()) {
        for (let s2 of set2.values()) {
            if (s1 == "") {
                set3.add(s2);
            }
            else if (s2 == "") {
                set3.add(s1);
            }
            else {
                set3.add(s1 + "+" + s2);
            }
        }
    }
    return set3;
}

function filterOut(oneSet, constraintsTree) {
    for (let constraint of $(constraintsTree).children()) {
        let type = $(constraint).attr("type");
        let from = $(constraint).attr("from");
        let to = $(constraint).attr("to");
        if (type == "require") {
            for (let str of oneSet) {
                let arr = str.split(/\+|,/);
                if (arr.includes(from) && !arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
        if (type == "exclude") {
            for (let str of oneSet) {
                let arr = str.split(/\+|,/);
                if (arr.includes(from) && arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
    }
    return oneSet;
}

function setInteraction(interactions, oneSet) {
    var interactionArray = interactions.split(",");
    var newSet = new Set();
    for (let str of oneSet) {
        let arr = str.split(/\+|,/);
        let flag = true;
        for (let item of interactionArray) {
            let itemArr = item.split("->");
            let fromArr = itemArr[0].split(")");
            let oldName = fromArr[1];
            let newName = oldName;
            if (itemArr[1] != "|") {
                let toArr = itemArr[1].split(")");
                newName = toArr[1];
            }
            if (arr.includes(oldName)) {
                str = str.replace(new RegExp(`${oldName}`, "gm"), newName);
            }
            else {
                flag = false;
                newSet.add(str);
                break;
            }
        }
        if (flag) {
            newSet.add(str);
        }
    }
    return newSet;
}

function generateProductsXML(finalSet, xmlTree) {
    for (let config of finalSet) {
        let cloneTree = mergeInteraction($(xmlTree).clone());
        let configArray = config.split(/\+|,/);
        let className = $(cloneTree).attr("class");
        let serviceName = $(cloneTree).attr("service");
        let productXML = $(`<product store="Composite" class="${className}" service="${serviceName}"></product>`);
        $(productXML).append($(cloneTree).children("connector"));
        $(productXML).append($(cloneTree).children("dataChannel"));
        let componentArray = $(productXML).find("component");
        for (let componentObj of componentArray) {
            if (!configArray.includes($(componentObj).attr("name"))) {
                $(componentObj).remove();
            }
        }
        let inputArray = $(productXML).find("inputs").attr("list").split(",");
        let outputArray = $(productXML).find("outputs").attr("list").split(",");
        let inputSet = new Set();
        let outputSet = new Set();
        let channelArray = $(productXML).find("channel");
        for (let channelObj of channelArray) {
            let from = $(channelObj).attr("from");
            let to = $(channelObj).attr("to");
            let fromArray = from.split(".");
            let toArray = to.split(".");
            let fromClass = fromArray[0];
            let toClass = toArray[0];
            if (fromArray.length == 1) {
                if (!configArray.includes(toClass)) {
                    $(channelObj).remove();
                }
                else if (inputArray.includes(fromArray[0])) {
                    inputSet.add(fromArray[0]);
                }
            }
            else if (toArray.length == 1) {
                if (!configArray.includes(fromClass)) {
                    $(channelObj).remove();
                }
                else if (outputArray.includes(toArray[0])) {
                    outputSet.add(toArray[0]);
                }
            }
            else {
                if (!configArray.includes(fromClass) || !configArray.includes(toClass)) {
                    $(channelObj).remove();
                }
            }
        }
        $(productXML).find("inputs").attr("list", [...inputSet].join(","));
        $(productXML).find("outputs").attr("list", [...outputSet].join(","));
        productXML = cleanJunkNode(productXML);
        let vgArray = $(productXML).find("vg");
        let index = 1;
        for (let vgObj of vgArray) {
            if ($(vgObj).attr("type") == "Or") {
                for (let orkid of $(vgObj).children()) {
                    $(orkid).wrap(`<condition value="${$(orkid).attr("name")}"></condition>`);
                }
                $(vgObj).wrapInner(`<connector type="Aggregator" name="Agg${index}" data="agg${index}"></connector>`);
                index++;
            }
            $(vgObj).children().unwrap();
        }
        let connectorArray = $(productXML).find("connector");
        for (let connectorObj of connectorArray) {
            let connectorType = $(connectorObj).attr("type");
            if (connectorType.startsWith("F-")) {
                $(connectorObj).attr("type", connectorType.slice(2));
            }
            connectorType = $(connectorObj).attr("type");
            if (connectorType == "Sequencer" || connectorType == "Selector" || connectorType == "Aggregator") {
                if ($(connectorObj).children().length == 1) {
                    let conditionObj = $(connectorObj).children("condition");
                    $(conditionObj).children().unwrap();
                    $(connectorObj).children().unwrap();
                }
            }
        }
        products.push($(productXML)[0].outerHTML);
    }
}

function cleanJunkNode(productXML) {
    var doClean = function (tagName) {
        let subNodes = $(productXML).find(tagName);
        for (let obj of subNodes) {
            let result = $(obj).has("component");
            if ($(result).length == 0) {
                $(obj).remove();
            }
        }
    }
    doClean("connector");
    doClean("condition");
    doClean("vg");
    return productXML;
}

function mergeInteraction(oneTree) {
    let connectors = $(oneTree).find(`connector[interaction!=""]`);
    for (let connector of connectors) {
        let interactionArray = $(connector).attr("interaction").split(",");
        for (let item of interactionArray) {
            let itemArr = item.split("->");
            let pattern = /\(([^()]+)\)/;
            let arr1 = pattern.exec(itemArr[0]);
            let oldClass = arr1[1];
            let oldName = itemArr[0].replace(arr1[0], "");
            if (itemArr[1] != "|") {
                let arr2 = pattern.exec(itemArr[1]);
                let newClass = arr2[1];
                let newName = itemArr[1].replace(arr2[0], "");
                let fi = $(oneTree).find(`fi[class="${newClass}"][name="${newName}"]`);
                let newNode = `<component store="${$(fi).attr("store")}" class="${newClass}" name="${newName}" service="${$(fi).attr("service")}"></component>`;
                let oldNode = $(oneTree).find(`component[class="${oldClass}"][name="${oldName}"]`);
                $(oldNode).after($(newNode));
            }
        }
    }
    $(oneTree).find("connector").removeAttr("interaction");
    $(oneTree).find("interactions").remove();
    return oneTree;
}

function showExplorer() {
    let i = 0;
    for (let productXML of products) {
        i++;
        let result = digDeeper($(productXML).children("connector"), "").trimComma();
        result = result.replace(/,/g, ", ");
        let liStr = `<li><input type="checkbox" class="tickproduct"><a href="javascript: void(0)" onclick="showProduct(${i})">Product ${i}: ${result}</a></li>`;
        $("#product_list").append(liStr);
    }
}

function digDeeper(connector, str) {
    var result = `<span>${$(connector).attr("type").abbr()}</span><font>(</font>`;
    var conditions = $(connector).children("condition");
    for (let condition of conditions) {
        let child = $(condition).children();
        if ($(child).is("component")) {
            result += `<i>${$(child).attr("name")}</i>,`;
        }
        else if ($(child).is("connector")) {
            result += digDeeper(child, result);
        }
    }
    result = result.trimComma();
    result += "<font>)</font>,";
    return result;
}

function selectAll() {
    $("input.tickproduct").prop("checked", true);
}

function unselectAll() {
    $("input.tickproduct").prop("checked", false);
}

function showProduct(num) {
    $("#product_summary>a").append($("#product_list>li").eq(num - 1).children("a").html());
    $("#product_main").hide("slide", 500, function () {
        $("#box").show("fade", 500, function () {
            $("#product_summary>span").hide("fade", 100, function () {
                $("#product_summary>a").show("fade", 100);
            });
            var tree = $(products[num - 1]);
            currentObject = drawCurrentCompositeComponent($(tree).attr("class"), $(tree).attr("service"));
            var inputDataArray = $(tree).find("inputs").attr("list").split(",");
            for (let inputData of inputDataArray) {
                if (inputData != "") {
                    drawDataInComposite("Input", inputData);
                }
            }
            var outputDataArray = $(tree).find("outputs").attr("list").split(",");
            for (let outputData of outputDataArray) {
                if (outputData != "") {
                    drawDataInComposite("Output", outputData);
                }
            }
            getAllComponent($(tree).find("component"), function (componentArray) {
                var drawPicture = function (node, array) {
                    if ($(node).is("connector")) {
                        let connectorObj = drawConnector($(node).attr("type"), $(node).attr("name"));
                        if ($(node).attr("data") != "") {
                            let dataArray = $(node).attr("data").split(",");
                            for (let dataNode of dataArray) {
                                drawInputInBlock(connectorObj, dataNode);
                            }
                        }
                        for (let conditionNode of $(node).children("condition")) {
                            let endNode = $(conditionNode).children();
                            let endObj = drawPicture(endNode, array);
                            drawCompositionEdge(connectorObj, endObj, $(conditionNode).attr("value"));
                        }
                        return connectorObj;
                    }
                    else if ($(node).is("component")) {
                        return array.find(x => x.objectName == $(node).attr("class") && x.objectInstance == $(node).attr("name"));
                    }
                }
                drawPicture($(tree).children("connector"), componentArray);
                scene.doLayout(JTopo.layout.TreeLayout("down", 200, 107));
                for (let channelNode of $(tree).find("channel")) {
                    let fromArr = $(channelNode).attr("from").split(".");
                    let toArr = $(channelNode).attr("to").split(".");
                    let target;
                    let source;
                    if (fromArr.length == 1) {
                        let result = scene.findElements(function (e) {
                            return e.objectType == "data" && e.objectInstance == fromArr[0];
                        });
                        source = result[0];
                    }
                    else {
                        source = componentArray.find(x => x.objectInstance == fromArr[0]);
                    }
                    if (toArr.length == 1) {
                        let result = scene.findElements(function (e) {
                            return e.objectType == "data" && e.objectInstance == toArr[0];
                        });
                        target = result[0];
                    }
                    else {
                        target = componentArray.find(x => x.objectInstance == toArr[0]);
                    }
                    drawDataChannel(source, target, `${$(channelNode).attr("from")}->${$(channelNode).attr("to")}`);
                }
                relocate();
            });
        });
    });
}

function hideProduct() {
    $("#box").hide("slide", { direction: "right" }, 500, function () {
        $("#product_main").show("fade", 500, function () {
            $("#product_summary>a").hide("fade", 100, function () {
                $("#product_summary>span").show("fade", 100);
            });
            scene.clear();
            currentObject = null;
            $("#product_summary>a").empty();
        });
    });
}

function download() {
    let num;
    if ($("#product_main").is(":visible ")) {
        if ($(".tickproduct:checked").length != 1) {
            alert("Please select one product.")
            return;
        }
        num = $(".tickproduct:checked").index(".tickproduct");
    }
    else {
        $("#product_summary>a").clone().children().remove();
        let arr = $("#product_summary>a").text().split(/[\s,:]/);
        num = parseInt(arr[1], 10) - 1;
    }
    let productXML = products[num];
    downloadProduct($(productXML).find("component"), function (codeSet) {
        var codeArray = Array.from(codeSet);
        var code = generateCode($(productXML)) + " " + codeArray.join(" ");
        downloadFile(`${$(xmlDoc).attr("class")}_${num + 1}.js`, code);
    });
}

function batchdownload() {
    if ($("#product_main").is(":visible ")) {
        if ($(".tickproduct:checked").length == 0) {
            alert("Please select products.")
            return;
        }
        let productXMLMap = new Map();
        for (let item of $(".tickproduct:checked")) {
            let num = $(item).index(".tickproduct");
            productXMLMap.set(`${$(xmlDoc).attr("class")}_${num + 1}`, products[num]);
        }
        downloadBatch(productXMLMap, function (batchMap) {
            zip.workerScriptsPath = "js/";
            zip.createWriter(new zip.BlobWriter("application/zip"), function (writer) {
                var titles = [];
                var files = [];
                for (let [key, value] of batchMap) {
                    titles.push(key);
                    files.push(value);
                }
                var f = 0;
                function nextFile(f) {
                    fblob = new Blob([files[f]], { type: "text/javascript" });
                    writer.add(titles[f], new zip.BlobReader(fblob), function () {
                        f++;
                        if (f < files.length) {
                            nextFile(f);
                        } else close();
                    });
                }
                function close() {
                    writer.close(function (blob) {
                        var eleLink = document.createElement('a');
                        eleLink.download = $(xmlDoc).attr("class") + ".zip";
                        eleLink.style.display = 'none';
                        eleLink.href = URL.createObjectURL(blob);
                        document.body.appendChild(eleLink);
                        eleLink.click();
                        document.body.removeChild(eleLink);
                    });
                }
                nextFile(f);
            }, onerror);
        });
    }
}

function openTestWindow2() {
    if ($("#product_main").is(":visible ")) {
        if ($(".tickproduct:checked").length != 1) {
            alert("Please select one product.")
            return;
        }
    }
    window.open("test.html", "test", `location=no,toolbar=no,height=${screen.height},width=${screen.width}`);
}