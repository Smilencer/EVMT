var family;
var manIndex = 1;
var optIndex = 1;
var altIndex = 1;
var orIndex = 1;
var nodeJSON = {};
var productList = [];

$(document).ready(function () {
    Array.prototype.del = function (n) {
        if (n < 0)
            return this;
        else
            return this.slice(0, n).concat(this.slice(n + 1, this.length));
    }

    var canvas = document.getElementById("canvas");
    stage = new JTopo.Stage(canvas);
    scene = new JTopo.Scene();
    stage.add(scene);
    JTopo.Node.prototype.xType = "";
    JTopo.FoldLink.prototype.xType = "";
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
}

function startFM() {
    var fName = $("#ipt_sname").val();
    drawFeature(fName, "root");
    family = fName;
    closeDialog();
}

function drawFeature(fName, featureType) {
    var defaultNode = new JTopo.Node();
    var textfield = $("#jtopo_textfield");
    defaultNode.text = fName;
    defaultNode.textPosition = 'Middle_Center';
    defaultNode.textOffsetY = -2;
    defaultNode.font = '14px Arial';
    defaultNode.fillColor = '240,240,240';
    defaultNode.fontColor = '0,0,0';
    defaultNode.setLocation(180, 100);
    defaultNode.setSize(120, 30);
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
    });
    defaultNode.addEventListener("mouseup", function (event) {
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
    $("#jtopo_textfield").blur(function () {
        textfield[0].JTopoNode.text = textfield.hide().val();
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
    scene.doLayout(JTopo.layout.TreeLayout("down", 150, 75));
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
                links[0].text = "OR" + orIndex;
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
    var link = drawFoldLink(source, target, constraint);
    link.xType = constraint;
}

function drawFoldLink(nodeA, nodeZ, text) {
    var link = new JTopo.FoldLink(nodeA, nodeZ, text);
    link.lineWidth = 1;
    link.dashedPattern = 5;
    link.fontColor = '0,0,0';
    link.strokeColor = '0,0,0';
    link.direction = 'horizontal' || 'vertical';
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
        productList = filterOut(productList);
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
                        subArr[i].push(listArr[n].replace(",", ""));
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
        return e.xType == "Requires";
    });
    if (result.length > 0) {
        for (var i = 0; i < result.length; i++) {
            var source = result[i].nodeA.text;
            var target = result[i].nodeZ.text;
            for (var j = productArray.length - 1; j >= 0; j--) {
                var productItem = productArray[j].split(",");
                if ($.inArray(source, productItem) != -1 && $.inArray(target, productItem) == -1) {
                    productArray.del(j);
                }
            }
        }
    }
    result = scene.findElements(function (e) {
        return e.xType == "Excludes";
    });
    if (result.length > 0) {
        for (var i = 0; i < result.length; i++) {
            var source = result[i].nodeA.text;
            var target = result[i].nodeZ.text;
            for (var j = productArray.length - 1; j >= 0; j--) {
                var productItem = productArray[j].split(",");
                if ($.inArray(source, productItem) != -1 && $.inArray(target, productItem) != -1) {
                    productArray = productArray.del(j);
                }
            }
        }
    }
    return productArray;
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