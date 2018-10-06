function generateMainClass(xmlTree) {
    var code =
        `class ${$(xmlTree).attr("class")} {
            constructor() {
                ${generateVariable(xmlTree)}
                ${generateClassInstances(xmlTree)}
            }
            ${$(xmlTree).attr("service")}() {
                ${generateInitDataflow(xmlTree)}
                ${generateMethodCalls(xmlTree)}
            }
        }`;
    return code;
}

function generateVariable(xmlTree) {
    var str = "";
    var inputArray = [];
    var outputArray = [];
    var inputList = $(xmlTree).find("inputs").attr("list");
    var outputList = $(xmlTree).find("outputs").attr("list");
    if (inputList != "") {
        inputArray = inputList.split(",");
    }
    if (outputArray != "") {
        outputArray = outputList.split(",");
    }
    var dataArray = inputArray.concat(outputArray);
    for (let data of dataArray) {
        str += `this.${data}=null;\n`;
    }
    return str;
}

function generateClassInstances(xmlTree) {
    var str = "";
    var result = $(xmlTree).find("component,fi");
    for (let item of result) {
        if ($(item).is("fi")) {
            str += pv_getAnnotationForFI(item) + "\n"
            str += `this.${$(item).attr("name")}=new ${$(item).attr("class")}();\n`;
        } else {
            str += pv_getAnnotationForComponent(item) + "\n";
            str += `this.${$(item).attr("name")}=new ${$(item).attr("class")}();\n`;
            str += "// PV:ENDCOND\n";
        }
    }
    return str;
}

function generateInitDataflow(xmlTree) {
    var str = "";
    var result = $(xmlTree).find("component,fi");
    for (let item of result) {
        var channelArray = $(xmlTree).find(`channel[to^="${$(item).attr("name")}."]`);
        for (let channel of channelArray) {
            let start = $(channel).attr("from");
            let end = $(channel).attr("to");
            if ($(item).is("fi")) {
                str += pv_getAnnotationForFI(item) + "\n"
                str += `this.${end}=this.${start};\n`;
            } else {
                str += pv_getAnnotationForComponent(item) + "\n";
                str += `this.${end}this.${start};\n`;
                str += "// PV:ENDCOND\n";
            }
        }
    }
    return str;
}

function generateMethodCalls(xmlTree) {
    var obj = $(xmlTree);
    var tree = $(obj).children().eq(0);
    var dataflow = $(obj).children().eq(1);
    var code = "";
    var parseTree = function(node) {
        if ($(node).is("connector")) {
            var condition = $(node).children("condition");
            var single = $(condition).eq(0);
            switch ($(node).attr("type")) {
                case "F-Sequencer":
                    condition.sort(compareUp());
                    for (let item of condition) {
                        parseTree($(item).children().eq(0));
                    }
                    break;
                case "F-Selector":
                    for (let item of condition) {
                        if ($(item).index(condition) == 0) {
                            code += `if(${$(item).attr("value")}){`;
                        } else {
                            code += `else if(${$(item).attr("value")}){`;
                        }
                        parseTree($(item).children().eq(0));
                        code += "}";
                    }
                    break;
                case "F-Guard":
                    code += `if(${$(single).attr("value")}){`;
                    parseTree($(single).children().eq(0));
                    code += "}";
                    break;
                case "F-Loop":
                    code += `while(${$(single).attr("value")}){`;
                    parseTree($(single).children().eq(0));
                    code += "}";
                    break;
            }
        } else if ($(node).is("vg")) {
            if ($(node).parent().is("vg")) {
                code += "\n" + pv_getAnnotationForVG(node) + "\n";
                let subNodes = $(node).children();
                for (let subNodeObj of subNodes) {
                    parseTree($(subNodeObj));
                }
                code += "\n// PV:ENDCOND\n";
            } else {
                let subNodes = $(node).children();
                for (let subNodeObj of subNodes) {
                    parseTree($(subNodeObj));
                }
            }
        } else if ($(node).is("fi")) {
            code += pv_getAnnotationForFI(node) + "\n";
            code += `this.${$(node).attr("name")}.${$(node).attr("service")}();`;
            code += `${generateAnnotativeDataFlow(xmlTree, $(node).attr("name"))}`;
            code += "\n";
        } else if ($(node).is("component")) {
            code += pv_getAnnotationForComponent(node) + "\n";
            code += `this.${$(node).attr("name")}.${$(node).attr("service")}();`;
            code += `${generateAnnotativeDataFlow(xmlTree, $(node).attr("name"))}`;
            code += "\n// PV:ENDCOND\n";
        }
    }
    parseTree($(tree).eq(0));
    return code;
}

function generateAnnotativeDataFlow(xmlTree, componentInstance) {
    var str = "";
    var channelArray = $(xmlTree).find(`channel[from^='${componentInstance}.']`);
    if (channelArray.length > 0) {
        for (let channel of channelArray) {
            let start = $(channel).attr("from");
            let end = $(channel).attr("to");
            let endObj = $(xmlTree).find(`fi[name="${end.split(".")[0]}"],component[name="${end.split(".")[0]}"]`);
            let annotation;
            if ($(endObj).is("fi")) {
                annotation = pv_getAnnotationForFI($(endObj));
            } else {
                annotation = pv_getAnnotationForComponent($(endObj));
            }
            str += "\n" + annotation + "\n" + `this.${end}this.${start};` + "\n// PV:ENDCOND\n";
        }
    }
    return str;
}

function pv_positionInteraction(xmlTree) {
    var xmlObj = $(xmlTree);
    let founder = new Map();
    for (let connectorNode of xmlObj.find("connector")) {
        if ($(connectorNode).attr("interaction") != "") {
            let interactionList = $(connectorNode).attr("interaction").split("@");
            for (let interactionItem of interactionList) {
                let stakeholder = [];
                let interactionArray = interactionItem.split(",");
                for (let interactionElement of interactionArray) {
                    let interactionElementPair = interactionElement.split("->");
                    let origin = interactionElementPair[0].split(")")[1];
                    if (interactionElementPair[1] != "|") {
                        let outcome = interactionElementPair[1].split(")")[1];
                        let originComponent = $(connectorNode).find(`component[name="${origin}"]`);
                        let outcomeComponent = xmlObj.find(`fi[name="${outcome}"]`);
                        $(originComponent).before($(outcomeComponent).clone());
                        $(originComponent).attr("stakeholder", "stakeholder");
                        founder.set(outcome, stakeholder);
                    }
                    stakeholder.push(origin);
                }
            }
        }
    }
    for (let [key, value] of founder) {
        xmlObj.find(`fi[name="${key}"]`).attr("founder", value.join(","));
    }
    xmlObj.children("interactions").remove();
    return xmlObj;
}

function pv_getAnnotationForVG(vgNode) {
    let annotationArray = [];
    for (let componentNode of $(vgNode).find("component")) {
        annotationArray.push(`pv:hasFeature('${$(componentNode).attr("name")}')`);
    }
    let annotation = annotationArray.join(" or ");
    return `// PV:IFCOND(${annotation})`
}

function pv_getAnnotationForComponent(componentNode) {
    if ($(componentNode).attr("stakeholder") == "stakeholder") {
        return `// PV:ELSEIFCOND(pv:hasFeature('${$(componentNode).attr("name")}'))`;
    } else {
        return `// PV:IFCOND(pv:hasFeature('${$(componentNode).attr("name")}'))`;
    }
}

function pv_getAnnotationForFI(fiNode) {
    let annotationArray = [];
    for (let founder of $(fiNode).attr("founder").split(",")) {
        annotationArray.push(`pv:hasFeature('${founder}')`);
    }
    let annotation = annotationArray.join(" and ");
    return `// PV:IFCOND(${annotation})`;
}

function generateCodebase(xmlTree) {
    queryComponents($(xmlTree).find("component,fi"), function(codeMap) {
        let componentCode = new Set();
        for (let [key, value] of codeMap) {
            let objArray = $(xmlTree).find(`fi[class="${key}"],component[class="${key}"]`);
            let annotationSet = new Set();
            if (objArray.length > 0) {
                for (let obj of objArray) {
                    if ($(obj).is("fi")) {
                        let annotation = pv_getAnnotationForFI($(obj));
                        annotation = annotation.replace("// PV:IFCOND", "");
                        annotationSet.add(annotation);
                    } else {
                        let annotation = pv_getAnnotationForComponent($(obj));
                        annotation = annotation.replace("// PV:IFCOND", "");
                        annotation = annotation.replace("// PV:ELSEIFCOND", "");
                        annotationSet.add(annotation);
                    }
                }
                componentCode.add("// PV:IFCOND(" + [...annotationSet].join(" or ") + ")\n" + value + "\n// PV:ENDCOND\n");
            } else {
                componentCode.add(value);
            }
        }
        var codebase = generateMainClass(xmlTree) + "\n" + [...componentCode].join("\n");
        downloadFile(`${$(xmlTree).attr("class")}.js`, codebase);
    });
}

function queryComponents(domArray, feedbackMethod) {
    var codeMap = new Map();
    var transaction = mydb.transaction(["Composite", "Atomic"], IDBTransaction.READ_ONLY);
    var CompositeStore = transaction.objectStore("Composite");
    var AtomicStore = transaction.objectStore("Atomic");
    for (let componentNode of domArray) {
        var getCode = function(name, storeName) {
            let request;
            if (storeName == "Composite") {
                request = CompositeStore.get(name);
            } else if (storeName == "Atomic") {
                request = AtomicStore.get(name);
            }
            request.onsuccess = function(e) {
                let data = e.target.result;
                codeMap.set(data.name, data.code);
                if (storeName == "Composite") {
                    for (let [key, value] of data.subComponent) {
                        getCode(key, value);
                    }
                }
            }
            request.onerror = function(e) {
                console.log("Retrieve failed.");
            }
        }
        getCode($(componentNode).attr("class"), $(componentNode).attr("store"));
    }
    transaction.oncomplete = function() {
        feedbackMethod(codeMap);
    }
}