var family;
var manIndex = 1;
var optIndex = 1;
var altIndex = 1;
var orIndex = 1;
var nodeJSON = {};
var productList = [];
var lastSelectedNode = null;

$(document).ready(function () {
    var canvas = document.getElementById("canvas");
    stage = new JTopo.Stage(canvas);
    scene = new JTopo.Scene();
    stage.add(scene);
    JTopo.Node.prototype.xType = "";
    JTopo.Link.prototype.xType = "";
});

function createFeatureModel() {
    if (family == null) {
        $.blockUI({
            message: $("#NewFMDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "425px",
                height: "149px",
                top: "30%",
                cursor: "default"
            },
            overlayCSS: {
                cursor: "default"
            }
        });
    }
}

function closeDialog() {
    $("#NewFMDialog").find("input").val("");
    $.unblockUI();
    $("#featureMenu").hide();
}

function startFM() {
    var fName = $("#ipt_sname").val();
    drawFeature(fName, "root");
    family = fName;
    closeDialog();
}

function drawFeature(fName, featureType) {
    let ctx = stage.canvas.getContext("2d");
    ctx.font = "14px Arial";
    let nameWidth = ctx.measureText(fName).width;
    if (nameWidth < 40) { nameWidth = 40; }
    var defaultNode = new JTopo.Node();
    var textfield = $("#jtopo_textfield");
    defaultNode.text = fName;
    defaultNode.textPosition = 'Middle_Center';
    defaultNode.textOffsetY = -2;
    defaultNode.font = '14px Arial';
    defaultNode.fillColor = '240,240,240';
    defaultNode.fontColor = '0,0,0';
    defaultNode.setLocation(180, 100);
    defaultNode.setSize(nameWidth + 20, 30);
    defaultNode.borderRadius = 5;
    defaultNode.borderWidth = 2;
    if (featureType == "Optional") {
        defaultNode.borderColor = '216,0,0';
    }
    else if (featureType == "Alternative") {
        defaultNode.borderColor = '188, 190, 44';
    }
    else if (featureType == "Or") {
        defaultNode.borderColor = '217, 24, 227';
    }
    else {
        defaultNode.borderColor = '0, 17, 139';
    }
    defaultNode.alpha = 1.0;
    defaultNode.xType = featureType;
    scene.add(defaultNode);
    defaultNode.dbclick(function (event) {
        if (event.target == null) { return; }
        var e = event.target;
        textfield.css({
            top: event.pageY,
            left: event.pageX - e.width / 2
        }).show().attr("value", e.text).focus().select();
        e.text = "";
        textfield[0].JTopoNode = e;
        lastSelectedNode = defaultNode;
    });
    defaultNode.mouseup(function (event) {
        if (event.button == 2) {
            $("#featureMenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $("#featureMenu").hide();
        }
    });
    $("#jtopo_textfield").blur(function (event) {
        textfield[0].JTopoNode.text = textfield.hide().val().trim();
        var e = event.target;
        let ctx = stage.canvas.getContext("2d");
        ctx.font = "14px Arial";
        let nameWidth = ctx.measureText(textfield.val().trim()).width;
        if (nameWidth < 40) { nameWidth = 40; }
        lastSelectedNode.width = nameWidth + 20;
    });
    return defaultNode;
}

function removeFeatureFromCanvas() {
    var currentElement = scene.selectedElements[0];
    if (currentElement.xType == "root") {
        family = null;
    }
    scene.remove(currentElement);
    currentElement = null;
    $("#featureMenu").hide();
}

function keydownTextarea(obj) {
    if (event.keyCode == 13) { obj.blur(); }
}

function addNewFeature(featureType) {
    drawFeature("new feature", featureType);
}

function drawConnection(nodeA, nodeZ) {
    var link = new JTopo.Link(nodeA, nodeZ, "");
    link.lineWidth = 3;
    link.bundleOffset = 60;
    link.bundleGap = 20;
    link.textOffsetY = 3;
    link.fontColor = '0,0,0';
    if (nodeZ.xType == "Optional") {
        link.strokeColor = '216,0,0';
    }
    else if (nodeZ.xType == "Alternative") {
        link.strokeColor = '188, 190, 44';
    }
    else if (nodeZ.xType == "Or") {
        link.strokeColor = '217, 24, 227';
    }
    else {
        link.strokeColor = '0, 17, 139';
    }
    link.xType = nodeZ.xType;
    scene.add(link);
    link.mouseup(function (event) {
        if (event.button == 2) {
            if (link.xType == "Or" && link.text != "") {
                if ($("#featureMenu .or-card").length == 0) {
                    $("#featureMenu>li").append(`<a class="or-card" href="javascript:void(0)" onclick="setCardinality()">Set Cardinality</a>`);
                    $("#featureMenu>li").append(`<a class="or-card" href="javascript:void(0)" onclick="restoreCardinality()">Restore Cardinality</a>`);
                }
            }
            else {
                $(".or-card").remove();
            }
            $("#featureMenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $("#featureMenu").hide();
        }
    });
    return link;
}

function addNewLink() {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    var link = drawConnection(source, target);
    if (target.xType == "Optional") {
        link.text = "OPT" + optIndex;
        optIndex++;
    }
    if (target.xType == "Mandatory") {
        link.text = "MAN" + manIndex;
        manIndex++;
    }
    scene.doLayout(JTopo.layout.TreeLayout("right", 45, 150));
}

function setGroup() {
    var pair = scene.selectedElements;
    if (pair.length <= 1) { return; }
    var featureType = pair[0].xType;
    if (featureType == "Optional" || featureType == "Mandatory") { return; }
    var flag = true;
    for (var i = 1; i < pair.length; i++) {
        if (featureType != pair[i].xType) {
            flag = false;
            break;
        }
    }
    if (flag) {
        for (var i = 0; i < pair.length; i++) {
            var links = scene.findElements(function (e) {
                return e.nodeZ == pair[i];
            });
            if (featureType == "Alternative") {
                links[0].text = "ALT" + altIndex;
            }
            else if (featureType == "Or") {
                links[0].text = "OR" + orIndex + " <1..*>";
            }
        }
        if (featureType == "Alternative") {
            altIndex++;
        }
        else if (featureType == "Or") {
            orIndex++;
        }
    }
}

function addNewConstraint(constraint) {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    var link = drawLink(source, target, constraint);
    link.xType = constraint;
}

function drawLink(nodeA, nodeZ, text) {
    var link = new JTopo.FoldLink(nodeA, nodeZ, text);
    link.lineWidth = 3;
    link.dashedPattern = 1.5;
    link.fontColor = '8, 100, 0';
    link.strokeColor = '10, 130, 0';
    link.font = "14px Verdana bolder";
    link.direction = "vertical";
    link.arrowsRadius = 15;
    link.bundleOffset = 60;
    link.bundleGap = 20;
    link.textOffsetY = 3;
    scene.add(link);
    link.addEventListener("mouseup", function (event) {
        if (event.button == 2) {
            $("#featureMenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $("#featureMenu").hide();
        }
    });
    return link;
}

function refreshVariants() {
    nodeJSON = {};
    productList = [];
    $("#categoryDiv>ol").empty();
    var result = scene.findElements(function (e) {
        return e.xType == "root";
    });
    var root = result[0];
    mapChildren(root);
    digDeeper(root);
    if (root.text in nodeJSON) {
        productList = nodeJSON[root.text];
        expandDeeper(root.text);
        var productSet = new Set();
        for (let item of productList) {
            var set = new Set(item.split(/,/g));
            set.delete("");
            productSet.add([...set].join(", "));
        }
        productList = filterOut([...productSet]);
        productList.sort();
        $("#dataTitle>span").empty().append(productList.length + " Valid Variants");
        for (var i = 0; i < productList.length; i++) {
            $("#categoryDiv>ol").append("<li>" + productList[i] + "</li>");
        }
    }
}

function mapChildren(featureNode) {
    var childrenNames = [];
    var links = featureNode.outLinks;
    if (links == null) { return; }
    if (links.length > 0) {
        for (var i = 0; i < links.length; i++) {
            var linkName = links[i].text;
            if ($.inArray(linkName, childrenNames) == -1) {
                childrenNames.push(linkName);
            }
        }
        var subArr = new Array(childrenNames.length);
        for (var i = 0; i < childrenNames.length; i++) {
            subArr[i] = new Array();
        }
        for (var i = 0; i < childrenNames.length; i++) {
            var linkName = childrenNames[i];
            var linkType = linkName.substr(0, 2);
            var linkNameArr = linkName.split(" ");
            var linkCard = [];
            if (linkNameArr.length > 1) {
                if (!linkNameArr[1].includes("*")) {
                    var cardStr = linkNameArr[1].replace("<", "").replace(">", "");
                    linkCard = cardStr.split("..");
                }
            }
            var children = scene.findElements(function (e) {
                return e.elementType == "link" && e.text == linkName;
            });
            if (linkType == "MA") {
                subArr[i].push(children[0].nodeZ.text);
            }
            else if (linkType == "OP") {
                subArr[i].push(children[0].nodeZ.text);
                subArr[i].push("");
            }
            else if (linkType == "AL") {
                for (var j = 0; j < children.length; j++) {
                    subArr[i].push(children[j].nodeZ.text);
                }
            }
            else if (linkType == "OR") {
                var arr = [];
                var listArr = [""];
                var tempArr = [];
                for (var j = 0; j < children.length; j++) {
                    arr.push(children[j].nodeZ.text);
                }
                for (var k = 0, len = arr.length; k < len; k++) {
                    listArr.forEach(x => {
                        listArr.push(x + "," + arr[k]);
                    });
                }
                for (var n = 0; n < listArr.length; n++) {
                    if (listArr[n] != "") {
                        tempArr.push(listArr[n].replace(",", ""));
                    }
                }
                if (linkCard.length == 0) {
                    subArr[i] = subArr[i].concat(tempArr);
                }
                else {
                    for (let item of tempArr) {
                        var itemArr = item.split(",");
                        var min = parseInt(linkCard[0], 10);
                        var max = parseInt(linkCard[1], 10);
                        if (itemArr.length >= min && itemArr.length <= max) {
                            subArr[i].push(item);
                        }
                    }
                }
            }
            else {
                return;
            }
        }
        var temp = subArr[0];
        for (var i = 1; i < subArr.length; i++) {
            temp = CartesianProducts(temp, subArr[i]);
        }
        nodeJSON[featureNode.text] = temp;
    }
}

function digDeeper(featureNode) {
    var links = featureNode.outLinks;
    if (links == null) { return; }
    if (links.length > 0) {
        for (var i = 0; i < links.length; i++) {
            var endNode = links[i].nodeZ;
            mapChildren(endNode);
            digDeeper(endNode);
        }
    }
}

function CartesianProducts(arr1, arr2) {
    var arr3 = [];
    for (var i = 0; i < arr1.length; i++) {
        for (var j = 0; j < arr2.length; j++) {
            if (arr1[i] == "") {
                arr3.push(arr2[j]);
            }
            else if (arr2[j] == "") {
                arr3.push(arr1[i]);
            }
            else {
                arr3.push(arr1[i] + "," + arr2[j]);
            }
        }
    }
    return arr3;
}

function expandDeeper(rootName) {
    for (var key in nodeJSON) {
        if (key == rootName)
            continue;
        expandResult(key);
    }
}

function expandResult(featureKey) {
    var subArray = nodeJSON[featureKey];
    if (subArray != null) {
        var resultArray = [];
        for (var i = 0; i < productList.length; i++) {
            var str1 = productList[i];
            for (var j = 0; j < subArray.length; j++) {
                var str2 = subArray[j];
                var str3 = str1.replace(featureKey, str2);
                if ($.inArray(str3, resultArray) == -1) {
                    resultArray.push(str3);
                }
            }
        }
        productList = resultArray;
    }
}

function filterOut(productArray) {
    var result = scene.findElements(function (e) {
        return e.xType == "Requires" || e.xType == "Excludes";
    });
    if (result.length == 0) {
        return productArray;
    }

    var finalSet = new Set(productArray);
    result = scene.findElements(function (e) {
        return e.xType == "Requires";
    });
    if (result.length > 0) {
        let resultArray = ExpandConstraint(result);
        for (let productStr of finalSet) {
            var productItem = productStr.split(", ");
            for (let item of resultArray) {
                let itemArr = item.split(";");
                let sourceArr = itemArr[0].split(",");
                let targetArr = itemArr[1].split(",");
                let intersect1 = productItem.filter(x => sourceArr.includes(x));
                let intersect2 = productItem.filter(x => targetArr.includes(x));
                if (intersect1.length > 0 && intersect2.length == 0) {
                    finalSet.delete(productStr);
                }
            }
        }
    }
    result = scene.findElements(function (e) {
        return e.xType == "Excludes";
    });
    if (result.length > 0) {
        let resultArray = ExpandConstraint(result);
        for (let productStr of finalSet) {
            var productItem = productStr.split(", ");
            for (let item of resultArray) {
                let itemArr = item.split(";");
                let sourceArr = itemArr[0].split(",");
                let targetArr = itemArr[1].split(",");
                let intersect1 = productItem.filter(x => sourceArr.includes(x));
                let intersect2 = productItem.filter(x => targetArr.includes(x));
                if (intersect1.length > 0 && intersect2.length > 0) {
                    finalSet.delete(productStr);
                }
            }
        }
    }
    return [...finalSet];
}

function ExpandConstraint(linkArray) {
    var resultArray = [];
    for (let link of linkArray) {
        var source = link.nodeA;
        var target = link.nodeZ;
        if (isLeaf(source)) {
            if (isLeaf(target)) {
                resultArray.push(source.text + ";" + target.text);
            }
            else {
                let targetArr = getAllLeaves(target, []);
                let targetSet = new Set();
                for (let item of targetArr) {
                    targetSet.add(item.text);
                }
                resultArray.push(source.text + ";" + [...targetSet].join(","));
            }
        }
        else {
            if (isLeaf(target)) {
                let sourceArr = getAllLeaves(source, []);
                let sourceSet = new Set();
                for (let item of sourceArr) {
                    sourceSet.add(item.text);
                }
                resultArray.push([...sourceSet].join(",") + ";" + target.text);
            }
            else {
                let sourceArr = getAllLeaves(source, []);
                let targetArr = getAllLeaves(target, []);
                let sourceSet = new Set();
                let targetSet = new Set();
                for (let item of sourceArr) {
                    sourceSet.add(item.text);
                }
                for (let item of targetArr) {
                    targetSet.add(item.text);
                }
                resultArray.push([...sourceSet].join(",") + ";" + [...targetSet].join(","));
            }
        }
    }
    return resultArray;
}

function isLeaf(node) {
    let olinks = node.outLinks;
    if (olinks.length == 0) { return true; }
    else {
        for (let link of olinks) {
            if (link.xType != "Requires" && link.xType != "Excludes") {
                return false;
            }
        }
    }
    return true;
}

function getAllLeaves(node, arr) {
    if (node.outLinks.length == 0) {
        arr.push(node);
    }
    else {
        let olinks = node.outLinks;
        for (let link of olinks) {
            if (link.xType != "Requires" && link.xType != "Excludes") {
                let child = link.nodeZ;
                getAllLeaves(child, arr);
            }
        }
    }
    return arr;
}

function zoomIn() {
    stage.zoomOut();
    zoomlevel = scene.scaleX;
    growl("Zoom level: " + Math.round(zoomlevel * 100) / 100);
}

function zoomOut() {
    stage.zoomIn();
    zoomlevel = scene.scaleX;
    growl("Zoom level: " + Math.round(zoomlevel * 100) / 100);
}

function growl(msg) {
    $.growlUI("Operation Complete", msg);
}

function reset() {
    var msg = "Are you sure you want to remove everything?";
    if (confirm(msg) == true) {
        scene.clear();
        family = null;
        manIndex = 1;
        optIndex = 1;
        altIndex = 1;
        orIndex = 1;
        nodeJSON = {};
        productList = [];
    }
    else {
        return false;
    }
}

function setCardinality() {
    var orLink = scene.currentElement;
    var orText = orLink.text;
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.xType == "Or" && e.text == orText;
    });
    $("#ipt_min").attr("max", result.length - 1);
    $("#ipt_max").attr("max", result.length);
    $.blockUI({
        message: $("#NewCardinalityDialog"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "252px",
            height: "179px",
            top: "35%",
            left: "40%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function restoreCardinality() {
    var orLink = scene.currentElement;
    var orText = orLink.text;
    var orId = (orText.split(" "))[0];
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.xType == "Or" && e.text == orText;
    });
    for (let link of result) {
        link.text = `${orId} <1..*>`;
    }
    closeDialog();
}

function setMax() {
    var min = parseInt($("#ipt_min").val(), 10);
    min++;
    var max = parseInt($("#ipt_max").val(), 10);
    $("#ipt_max").attr("min", min);
    if (max <= min) {
        $("#ipt_max").val(min)
    }
}

function confirmCardinality() {
    var orLink = scene.currentElement;
    var orText = orLink.text;
    var orId = (orText.split(" "))[0];
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.xType == "Or" && e.text == orText;
    });
    for (let link of result) {
        link.text = `${orId} <${$("#ipt_min").val()}..${$("#ipt_max").val()}>`;
    }
    closeDialog();
}

function resize() {
    if ($(".partArea:first").is(":visible")) {
        $(".partArea:first").hide(function () {
            $("#dataTree-toggle").switchClass("dataTree-before", "dataTree-after", 1000);
        });
    }
    else {
        $("#dataTree-toggle").switchClass("dataTree-after", "dataTree-before", 1000, function () {
            $(".partArea:first").show();
        })
    }
}