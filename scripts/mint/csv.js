var fs = require("fs");


let getMoonscapeAuction = function() {
    // READ CSV INTO STRING
    var data = fs.readFileSync("./scripts/mint/addresses/moonscape-auction.csv").toLocaleString();

    let parsedData = [];

    // STRING TO ARRAY
    var rows = data.split("\n"); // SPLIT ROWS
    rows.forEach((row) => {
        columns = row.split(","); //SPLIT COLUMNS
        if (columns[0].length > 0) {
            parsedData.push([parseFloat(columns[0]), columns[1]]);
        }
    })

    return parsedData;
}

module.exports = {
    getMoonscapeAuction: getMoonscapeAuction
};
