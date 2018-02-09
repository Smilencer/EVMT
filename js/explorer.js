var xmlDoc = "";

$(document).ready(function () {
    //xmlDoc = window.opener.xmlDoc;
    xmlDoc = `<family class="VendingMachine" service="VendingMachineSvc"><connector type="F-Sequencer" name="f-seq1" data=""><condition value="0"><vg type="Or"><connector type="F-Sequencer" name="f-seq2" data=""><condition value="0"><vg type="Alternative"><component store="Atomic" class="Mocha" name="mocha" service="MochaSvc"></component><component store="Atomic" class="Latte" name="latte" service="LatteSvc"></component></vg></condition><condition value="1"><vg type="Optional"><component store="Atomic" class="Cream" name="cream" service="CreamSvc"></component></vg></condition></connector><component store="Atomic" class="Tea" name="tea" service="TeaSvc"></component></vg></condition><condition value="1"><vg type="Alternative"><component store="Atomic" class="Card" name="card" service="CardSvc"></component><component store="Atomic" class="Cash" name="cash" service="CashSvc"></component><component store="Atomic" class="Gift" name="gift" service="GiftSvc"></component></vg></condition><condition value="2"><vg type="Optional"><component store="Atomic" class="Change" name="change" service="ChangeSvc"></component></vg></condition></connector><dataChannel><inputs list="coffeesize,teatype,money"></inputs><outputs list=""></outputs><channel from="coffeesize" to="mocha.size"></channel><channel from="coffeesize" to="latte.size"></channel><channel from="mocha.price" to="cream.coffeeprice"></channel><channel from="latte.price" to="cream.coffeeprice"></channel><channel from="cream.sumprice" to="card.amount"></channel><channel from="cream.sumprice" to="cash.amount"></channel><channel from="cream.sumprice" to="gift.amount"></channel><channel from="latte.price" to="card.amount"></channel><channel from="latte.price" to="cash.amount"></channel><channel from="latte.price" to="gift.amount"></channel><channel from="mocha.price" to="card.amount"></channel><channel from="mocha.price" to="cash.amount"></channel><channel from="mocha.price" to="gift.amount"></channel><channel from="teatype" to="tea.decaf"></channel><channel from="tea.price" to="card.amount"></channel><channel from="tea.price" to="cash.amount"></channel><channel from="tea.price" to="gift.amount"></channel><channel from="money" to="cash.pay"></channel><channel from="cash.change" to="change.change"></channel></dataChannel><constraints><constraint type="exclude" from="gift" to="change"></constraint></constraints></family>`;
    var xmlTree = $(xmlDoc);
    var depthMap = assessDepth(xmlTree);
    var connectorMap = generateComposition(depthMap, xmlTree);
    var root = $(xmlTree).children("connector").attr("name");
    var rootSet = connectorMap.get(root);
    connectorMap.delete(root);
    var finalSet = combineComposition(connectorMap, rootSet);
    generateProductsXML(finalSet, xmlTree);
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
            connectorMap.set(connectorName, filterOut(doCartesian(setArray), $(xmlTree).children("constraints")));
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
                let arr = str.split("+");
                if (arr.includes(from) && !arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
        if (type == "exclude") {
            for (let str of oneSet) {
                let arr = str.split("+");
                if (arr.includes(from) && arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
    }
    return oneSet;
}

//TODO
function generateProductsXML(finalSet, xmlTree) {
    for (let config of finalSet) {
        let className = $(xmlTree).attr("class");
        let serviceName = $(xmlTree).attr("service");
        let productXML = $(`<product store="Composite" class="${className}" service="${serviceName}"></product>`);
        $(productXML).append($(xmlTree).children("connector"));
        $(productXML).append($(xmlTree).children("dataChannel"));
        console.log(productXML[0].outerHTML);
    }
}