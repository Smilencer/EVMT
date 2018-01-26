function extendJTopo() {
    JTopo.TextNode.prototype.objectType = null;  //family or composite
    JTopo.TextNode.prototype.objectName = null;   //composite component name
    JTopo.TextNode.prototype.objectService = null;  //service name
    JTopo.Container.prototype.objectName = null;   //component name (class name) || sequencer etc.
    JTopo.Container.prototype.objectInstance = null;    //instance of component/connector name
    JTopo.Container.prototype.objectStore = null;    //atomic or composite
    JTopo.Container.prototype.objectType = null;   //subcomponent || connector
    JTopo.CircleNode.prototype.objectType = null;   //data
    JTopo.CircleNode.prototype.objectName = null;   //the name of input/output
    JTopo.CircleNode.prototype.objectDataType = null;   //input or output
    JTopo.CircleNode.prototype.objectContainer = null;  //container
}

function zoomIn() {
    stage.zoomOut();
    zoomlevel = scene.scaleX;
    growl("Zoom level: " + Math.round(zoomlevel * 100) / 100);
    relocate();
}

function zoomOut() {
    stage.zoomIn();
    zoomlevel = scene.scaleX;
    growl("Zoom level: " + Math.round(zoomlevel * 100) / 100);
    relocate();
}

function relocate() {
    var zoomX = stage.width / zoomlevel - stage.width;
    var zoomY = stage.height / zoomlevel - stage.height;
    currentObject.setLocation(10 - scene.translateX - zoomX / 2, 10 - scene.translateY - zoomY / 2);
    currentObject.visible = true;
}

function keydownTextarea(obj) {
    if (event.keyCode == 13) { obj.blur(); }
}

function drawCurrentObject(name, service, objType) {
    var textfield = $("#jtopo_textfield");
    var obj = new JTopo.TextNode(name + " : " + service);
    obj.textPosition = "Top_Center";
    obj.setLocation(10 - scene.translateX, 10 - scene.translateY);
    obj.fontColor = "47, 108, 19"; //font colour
    obj.font = "bold 14pt Verdana";
    obj.zIndex = 999;
    obj.objectType = objType;
    obj.objectName = name;
    obj.objectService = service;
    scene.add(obj);
    obj.dbclick(function (event) {
        if (event.target == null) { return; }
        scene.remove(currentObject);
        currentObject = null;
        createCompositeService();
    });
    return obj;
}

function drawCurrentCompositeComponent(name, service) {
    return drawCurrentObject(name, service, "Composite");
}

function drawCurrentFamily(name, service) {
    return drawCurrentObject(name, service, "Family");
}

function drawComponentBlock(name, storeName, instance) {
    var block = new JTopo.Container("(" + name + ")" + instance);
    block.textPosition = "Bottom_Center";
    block.setLocation(10 - scene.translateX, 200 - scene.translateY);
    block.fillColor = "210,210,210"; //background colour
    block.borderColor = "0,0,0"; //border colour
    block.fontColor = "0,0,0"; //font colour
    block.font = "12pt Verdana";
    block.setSize(100, 60);
    block.borderRadius = 30;
    block.borderWidth = 2;
    block.alpha = 1.0;
    block.layout = JTopo.layout.GridLayout(2, 4);
    block.objectName = name;
    block.objectInstance = instance;
    block.objectStore = storeName;
    block.objectType = "subcomponent";
    scene.add(block);
    block.mouseup(function (event) {
        if (event.button == 2) {
            $(".contextmenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $(".contextmenu").hide();
        }
    });
    return block;
}

function checkData(container, io, name) {
    var flag;
    if (io == "i") {
        flag = "input";
    }
    else if (io == "o") {
        flag = "output";
    }
    var result = scene.findElements(function (e) {
        return e.objectType == "data" && e.objectDataType == flag && e.objectName == name && e.container == container;
    });
    if (result == 0) { return null; }
    else { return result[0]; }
}

function drawDataInBlock(container, io, name) {
    var feedback = checkData(container, io, name);
    if (feedback != null) { return feedback };
    var data = new JTopo.CircleNode(io);
    data.font = "bold 8pt Verdana";
    data.textOffsetY = -2;
    data.radius = 8;
    data.alpha = 1.0;
    if (io == "i") {
        data.fillColor = "27,236,10";
        data.objectDataType = "input";
    }
    else if (io == "o") {
        data.fillColor = "96,149,255";
        data.objectDataType = "output";
    }
    data.borderColor = "0,0,0";
    data.fontColor = "0,0,0";
    data.textPosition = "Middle_Center";
    data.objectName = name;
    data.objectType = "data";
    data.objectContainer = container;
    scene.add(data);
    container.add(data);
    data.mouseover(function (event) {
        $("#IOdiv").append(name);
        $("#IOdiv").css({
            top: event.pageY + 20,
            left: event.pageX
        }).show();
    });
    data.mouseout(function (event) {
        $("#IOdiv").hide();
        $("#IOdiv").children().remove();
        $("#IOdiv").text("");
    });
    data.mouseup(function (event) {
        if (event.button == 2 && container.objectType == "connector") {
            $(".contextmenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $(".contextmenu").hide();
        }
    });
    return data;
}

function drawInputInBlock(container, name) {
    return drawDataInBlock(container, "i", name);
}

function drawOutputInBlock(container, name) {
    return drawDataInBlock(container, "o", name);
}

function drawConnector(name, instance) {
    var textfield = $("#jtopo_textfield");
    var fcon = new JTopo.Container(instance);
    fcon.textPosition = "Middle_Center";
    fcon.textOffsetY = 6;
    fcon.setLocation(200 - scene.translateX, 100 - scene.translateY);
    fcon.fillColor = "253, 250, 208"; //background colour
    fcon.borderColor = "88, 114, 137"; //border colour
    fcon.fontColor = "88, 114, 137"; //font colour
    fcon.font = "bold italic 14pt Courier New";
    fcon.setSize(80, 50);
    fcon.borderWidth = 3;
    fcon.alpha = 1.0;
    fcon.layout = JTopo.layout.GridLayout(3, 4);
    fcon.objectType = "connector";
    fcon.objectName = name;
    fcon.objectInstance = instance;
    scene.add(fcon);
    fcon.dbclick(function (event) {
        if (event.target == null) { return; }
        var e = event.target;
        textfield.css({
            top: event.pageY,
            left: event.pageX - e.width / 2
        }).show().attr("value", e.text).focus().select();
        e.text = "";
        textfield[0].JTopoNode = e;
    });
    fcon.mouseup(function (event) {
        if (event.button == 2) {
            $(".contextmenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $(".contextmenu").hide();
        }
    });
    $("#jtopo_textfield").blur(function () {
        textfield[0].JTopoNode.text = textfield.hide().val();
    });
    return fcon;
}

function removeElementFromCanvas() {
    var element = scene.currentElement;
    for (var i = 0; i < element.childs.length; i++) {
        scene.remove(element.childs[i]);
    }
    scene.remove(element);
    $(".contextmenu").hide();
}