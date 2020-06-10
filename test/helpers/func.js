function zip(rows) {
    return rows[0].map((_,c) => rows.map(row => row[c]));
}

module.exports.zip = zip;