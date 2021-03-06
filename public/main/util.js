const csvStringToArray = strData => {
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"), "gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData)) {
        if (arrMatches[1].length && arrMatches[1] !== ",") arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ?
            arrMatches[2].replace(new RegExp("\"\"", "g"), "\"") :
            arrMatches[3]);
    }
    return arrData;
},
    copy = navigator.clipboard.writeText,
    forObj = (ob, f) => {
        for (let i in ob) if (!isNaN(Number(i))) f(ob[i], i);
    },
    capitalize = text =>  text.charAt(0).toUpperCase() + text.slice(1);