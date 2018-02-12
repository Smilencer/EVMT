function extendJTopo() {
    JTopo.TextNode.prototype.objectType = null;  //family or composite
    JTopo.TextNode.prototype.objectName = null;   //composite component name
    JTopo.TextNode.prototype.objectService = null;  //service name
    JTopo.Container.prototype.objectName = null;   //component name (class name) || sequencer etc.
    JTopo.Container.prototype.objectInstance = null;    //instance of component/connector name
    JTopo.Container.prototype.objectStore = null;    //atomic or composite
    JTopo.Container.prototype.objectType = null;   //subcomponent || connector
    JTopo.Container.prototype.objectService = null;   //service name
    JTopo.CircleNode.prototype.objectType = null;   //data
    JTopo.CircleNode.prototype.objectName = null;   //input or output
    JTopo.CircleNode.prototype.objectInstance = null;   //the name of input/output
    JTopo.CircleNode.prototype.objectContainer = null;  //container
    JTopo.Link.prototype.objectType = null;    //coordinator or channel or diversity or constraint
    JTopo.Link.prototype.objectName = null;    //reuqires or excludes
    JTopo.Node.prototype.objectType = null;    //generator (abbr. for variation generator)
    JTopo.Node.prototype.objectName = null;    //Optional etc.
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
    return drawCurrentObject(name, service, "composite");
}

function drawCurrentFamily(name, service) {
    return drawCurrentObject(name, service, "family");
}

function drawComponentBlock(name, storeName, instance, service) {
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
    block.objectService = service;
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
        return e.objectType == "data" && e.objectName == flag && e.objectInstance == name && e.container == container;
    });
    if (result == 0) { return null; }
    else { return result[0]; }
}

function drawDataInFamily(io, name) {
    return drawDataInComposite(io, name);
}

function drawDataInComposite(io, name) {
    var feedback = checkData(currentObject, io, name);
    if (feedback != null) { return feedback };
    var data = new JTopo.Node(name);
    data.setLocation(50 - scene.translateX, 150 - scene.translateY);
    data.setSize(20, 20);
    if (io == "Input") {
        data.setImage("css/images/input.png");
        data.objectName = "input";
    }
    else if (io == "Output") {
        data.setImage("css/images/output.png");
        data.objectName = "output";
    }
    data.fontColor = "0,0,0";
    data.objectInstance = name;
    data.objectType = "data";
    data.objectContainer = currentObject;
    scene.add(data);
    data.mouseover(function (event) {
        $("#IOdiv").append(name)
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
    return data;
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
        data.objectName = "input";
    }
    else if (io == "o") {
        data.fillColor = "96,149,255";
        data.objectName = "output";
    }
    data.borderColor = "0,0,0";
    data.fontColor = "0,0,0";
    data.textPosition = "Middle_Center";
    data.objectInstance = name;
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

function checkFeatureInteration(container, content) {
    var result = scene.findElements(function (e) {
        return e.objectType == "interaction" && e.objectInstance == content && e.container == container;
    });
    if (result == 0) { return null; }
    else { return result[0]; }
}

function drawFeatureInteration(container, content) {
    var feedback = checkFeatureInteration(container, content);
    if (feedback != null) { return feedback };
    var interation = new JTopo.CircleNode("FI");
    interation.font = "bold 8pt Verdana";
    interation.textOffsetY = -2;
    interation.radius = 8;
    interation.alpha = 1.0;
    interation.fillColor = "255, 119, 119";
    interation.borderColor = "0,0,0";
    interation.fontColor = "0,0,0";
    interation.textPosition = "Middle_Center";
    //interation.alarm = content;
    interation.objectInstance = content;
    interation.objectType = "interaction";
    interation.objectContainer = container;
    scene.add(interation);
    container.add(interation);
    interation.mouseup(function (event) {
        if (event.button == 2 && container.objectType == "connector") {
            $(".contextmenu").css({
                top: event.pageY,
                left: event.pageX
            }).show();
        }
    });
    interation.mouseover(function (event) {
        interation.alarm = content;
        interation.alarmFont = "16px Consolas";
        interation.alarmColor = "255, 119, 119";
    });
    interation.mouseout(function (event) {
        interation.alarm = null;
    });
    stage.click(function (event) {
        if (event.button == 0) {
            $(".contextmenu").hide();
        }
    });
    return interation;
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
    if (element.childs != undefined) {
        for (var i = 0; i < element.childs.length; i++) {
            scene.remove(element.childs[i]);
        }
    }
    if (element.objectContainer != undefined && element.objectContainer.objectType == "connector") {
        element.objectContainer.childs.splice(element.objectContainer.childs.findIndex(item => item._id == element._id), 1);
    }
    scene.remove(element);
    $(".contextmenu").hide();
}

function checkConnectionEdge(source, target) {
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.nodeA == source && e.nodeZ == target;
    });
    if (result == 0) { return true; }
    else { return false; }
}

function checkConnectionEdge(source, target, flow) {
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.nodeA == source && e.nodeZ == target && e.text == flow;
    });
    if (result == 0) { return true; }
    else { return false; }
}

function drawCompositionEdge(source, target, condition) {
    if (checkConnectionEdge(source, target)) {
        var textfield = $("#jtopo_textfield");
        var link = new JTopo.FlexionalLink(source, target, condition);
        link.direction = "vertical";
        link.arrowsRadius = 6;
        link.lineWidth = 3; // line width
        link.offsetGap = 20;
        link.bundleGap = 15; // space between lines
        link.textOffsetY = 0; // offset X,Y of the line text
        link.strokeColor = "88, 114, 137";
        link.fontColor = "0,0,0";
        link.font = "italic 10pt Arial";
        link.objectType = "coordinator";
        scene.add(link);
        link.dbclick(function (event) {
            if (event.target == null) { return; }
            var e = event.target;
            textfield.css({
                top: event.pageY,
                left: event.pageX - e.width / 2
            }).show().attr("value", e.text).focus().select();
            e.text = "";
            textfield[0].JTopoNode = e;
        });
        link.mouseup(function (event) {
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
        return link;
    }
}

function drawVariationEdge(source, target) {
    if (checkConnectionEdge(source, target)) {
        var link = new JTopo.Link(source, target, "");
        link.direction = "vertical";
        link.dashedPattern = 3;
        link.arrowsRadius = 0;
        link.lineWidth = 2; // line width
        link.offsetGap = 20;
        link.bundleGap = 15; // space between lines
        link.fontColor = "22, 160, 133";
        link.strokeColor = "22, 160, 133";
        link.textOffsetY = 20;
        scene.add(link);
        link.objectType = "diversity";
        link.mouseup(function (event) {
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
        return link;
    }
}

function drawFeatureInteractionEdge(source, target) {
    if (checkConnectionEdge(source, target)) {
        var link = new JTopo.Link(source, target, "Interaction");
        link.direction = "vertical";
        link.dashedPattern = 4;
        link.arrowsRadius = 0;
        link.lineWidth = 2; // line width
        link.offsetGap = 20;
        link.bundleGap = 15; // space between lines
        link.fontColor = "255, 119, 119";
        link.strokeColor = "255, 119, 119";
        link.textOffsetY = 20;
        scene.add(link);
        link.objectType = "fiEdge";
        link.mouseup(function (event) {
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
        return link;
    }
}

function drawConstraintEdge(source, target, constraint) {
    if (checkConnectionEdge(source, target)) {
        var link = new JTopo.Link(source, target, constraint.toUpperCase() + "S");
        link.direction = "horizontal";
        link.arrowsRadius = 10;
        link.lineWidth = 2.5; // line width
        link.offsetGap = 20;
        link.bundleGap = 15; // space between lines
        link.fontColor = "200,60,196";
        link.strokeColor = "200,60,196";
        link.textOffsetY = 20;
        scene.add(link);
        link.objectType = "constraint";
        link.objectName = constraint;
        link.getStartPosition = function () {
            var a;
            return (a = (function (thisl) {
                var b = thisl.nodeA;
                var c = thisl.nodeZ;
                var d = JTopo.util.lineF(b.cx, b.cy, c.cx, c.cy);
                var e = b.getBound();
                var f = JTopo.util.intersectionLineBound(d, e);
                return f;
            })(this)),
                null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                }), a
        };
        link.getEndPosition = function () {
            var a;
            return (a = (function (thisl) {
                var b = thisl.nodeZ;
                var c = thisl.nodeA;
                var d = JTopo.util.lineF(b.cx, b.cy, c.cx, c.cy);
                var e = b.getBound();
                var f = JTopo.util.intersectionLineBound(d, e);
                return f;
            })(this)),
                null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                }), a
        };
        if (constraint == "exclude") {
            link.paintPath = function (a, b) {
                if (this.nodeA === this.nodeZ) return void this.paintLoop(a);
                a.beginPath(),
                    a.moveTo(b[0].x, b[0].y);
                for (var c = 1; c < b.length; c++) {
                    null == this.dashedPattern ? (
                        (null == this.PointPathColor ? a.lineTo(b[c].x, b[c].y) : a.JtopoDrawPointPath(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, a.strokeStyle, this.PointPathColor))
                    ) : a.JTopoDashedLineTo(b[c - 1].x, b[c - 1].y, b[c].x, b[c].y, this.dashedPattern)
                };
                if (a.stroke(), a.closePath(), null != this.arrowsRadius) {
                    var d = b[b.length - 2],
                        e = b[b.length - 1];
                    this.paintArrow(a, d, e);
                    this.paintArrow(a, e, d);
                }
            };
        }
        link.mouseup(function (event) {
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
        return link;
    }
}

function drawDataChannel(source, target, flow) {
    if (checkConnectionEdge(source, target, flow)) {
        var link = new JTopo.Link(source, target, flow);
        link.direction = "horizontal";
        link.arrowsRadius = 8;
        link.lineWidth = 1; // line width
        link.offsetGap = 35;
        link.bundleGap = 15; // space between lines
        link.textOffsetY = 10; // offset X,Y of the line text
        link.strokeColor = "255, 48, 48";
        link.fontColor = "0,0,0";
        link.objectType = "channel";
        link.getStartPosition = function () {
            var a;
            return (a = (function (thisl) {
                var b = thisl.nodeA;
                var c = thisl.nodeZ;
                var d = JTopo.util.lineF(b.cx, b.cy, c.cx, c.cy);
                var e = b.getBound();
                var f = JTopo.util.intersectionLineBound(d, e);
                return f;
            })(this)),
                null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                }), a
        };
        link.getEndPosition = function () {
            var a;
            return (a = (function (thisl) {
                var b = thisl.nodeZ;
                var c = thisl.nodeA;
                var d = JTopo.util.lineF(b.cx, b.cy, c.cx, c.cy);
                var e = b.getBound();
                var f = JTopo.util.intersectionLineBound(d, e);
                return f;
            })(this)),
                null == a && (a = {
                    x: this.nodeZ.cx,
                    y: this.nodeZ.cy
                }), a
        };
        scene.add(link);
        link.mouseup(function (event) {
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
        return link;
    }
}

function drawVariationGenerator(name) {
    var node = new JTopo.Node(name.substr(0, 3).toUpperCase());
    node.fontColor = "255,255,255";
    node.font = "bold 20pt Verdana";
    node.textPosition = "Middle_Center";
    node.textOffsetY = -2.5;
    node.beginDegree = 0;
    node.width = 80;
    node.height = 40;
    node.setLocation(400, 90);
    node.paint = function (g) {
        g.beginPath();
        g.moveTo(-40, -20);
        g.lineTo(40, -20);
        g.lineTo(30, 20);
        g.lineTo(-30, 20);
        g.lineTo(-40, -20);
        g.fillStyle = "#999999";
        g.fill();
        g.lineWidth = 3;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.strokeStyle = "#000000";
        g.stroke();
        g.closePath();
        this.paintText(g);
    };
    node.objectType = "generator";
    node.objectName = name;
    scene.add(node);
    node.mouseup(function (event) {
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
    return node;
}