function pv_positionInteraction(xmlTree) {
    var xmlObj = $(xmlTree);
    for (let connectorNode of xmlObj.find("connector")) {
        if ($(connectorNode).attr("interaction") != "") {
            let interactionList = $(connectorNode).attr("interaction").split("@");
            for (let interactionItem of interactionList) {
                let interactionArray = interactionItem.split(",");
                for (let interactionElement of interactionArray) {
                    let interactionElementPair = interactionElement.split("->");
                    if (interactionElementPair[1] != "|") {
                        let origin = interactionElementPair[0].split(")")[1];
                        let outcome = interactionElementPair[1].split(")")[1];
                        let originComponent = $(connectorNode).find(`component[name="${origin}"]`);
                        let outcomeComponent = xmlObj.find(`fi[name="${outcome}"]`);
                        $(originComponent).after(`<component store="${$(outcomeComponent).attr("store")}" class="${$(outcomeComponent).attr("class")}" name="${$(outcomeComponent).attr("name")}" service="${$(outcomeComponent).attr("service")}"></component>`);
                    }
                }
            }
        }
    }
    return xmlObj;
}

function pv_getAnnotationForVG(vgNode) {
    let annotation = "// PV:IFCOND(";
    let annotationArray=[];
    for (let componentNode of $(vgNode).find("component")) {
        
    }
}