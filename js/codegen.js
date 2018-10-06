function generateCode(xmlTree) {
    var code =
        `class ${$(xmlTree).attr("class")} {
        constructor() {
            ${generateConstructor(xmlTree)}
        }
        ${$(xmlTree).attr("service")}() {
            ${initDataflow(xmlTree)}
            ${generateService(xmlTree)}
        }
    }`;
    return code;
}

function generateConstructor(xmlTree) {
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
    var result = $(xmlTree).find("component");
    for (let item of result) {
        str += `this.${$(item).attr("name")}=new ${$(item).attr("class")}();\n`;
    }
    return str;
}

function generateService(xmlTree) {
    var obj = $(xmlTree);
    var tree = $(obj).children().eq(0);
    var dataflow = $(obj).children().eq(1);
    var code = "";
    var parseTree = function(node) {
        if ($(node).is("connector")) {
            var condition = $(node).children("condition");
            var single = $(condition).eq(0);
            switch ($(node).attr("type")) {
                case "Sequencer":
                    condition.sort(compareUp());
                    for (let item of condition) {
                        parseTree($(item).children().eq(0));
                    }
                    break;
                case "Selector":
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
                case "Guard":
                    code += `if(${$(single).attr("value")}){`;
                    parseTree($(single).children().eq(0));
                    code += "}";
                    break;
                case "Loop":
                    code += `while(${$(single).attr("value")}){`;
                    parseTree($(single).children().eq(0));
                    code += "}";
                    break;
                case "Aggregator":
                    for (let item of condition) {
                        code += `if(this.${$(node).attr("data")}.split(",").includes("${$(item).attr("value")}")){`;
                        parseTree($(item).children().eq(0));
                        code += "}";
                    }
                    break;
            }
        } else if ($(node).is("component")) {
            code += `this.${$(node).attr("name")}.${$(node).attr("service")}();`;
            code += `${generateDataFlow(xmlTree, $(node).attr("name"))}`;
        }
    }
    parseTree($(tree).eq(0));
    return code;
}

function compareUp() {
    return function(obj1, obj2) {
        var value1 = Number($(obj1).attr("value"));
        var value2 = Number($(obj2).attr("value"));
        return value1 - value2;
    }
}

function initDataflow(xmlTree) {
    var str = "";
    var inputArray = $(xmlTree).find("inputs").attr("list").split(",");
    for (let inputName of inputArray) {
        var channelArray = $(xmlTree).find(`channel[from='${inputName}']`);
        if (channelArray.length > 0) {
            for (let channel of channelArray) {
                let start = $(channel).attr("from");
                let end = $(channel).attr("to");
                str += `this.${end}=this.${start};\n`;
            }
        }
    }
    return str;
}

function generateDataFlow(xmlTree, componentInstance) {
    var str = "";
    var channelArray = $(xmlTree).find(`channel[from^='${componentInstance}.']`);
    if (channelArray.length > 0) {
        for (let channel of channelArray) {
            str += `this.${$(channel).attr("to")}=this.${$(channel).attr("from")};`;
        }
    }
    return str;
}

function downloadFile(fileName, content) {
    var eleLink = document.createElement('a');
    eleLink.download = fileName;
    eleLink.style.display = 'none';
    var blob = new Blob([content], { type: "text/javascript" });
    eleLink.href = URL.createObjectURL(blob);
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
}