var ArcDialog = ArcBaseObject();
ArcDialog.prototype.init = function (csvUrl) {
    var _this = this;
    this.data = {};
    
    this.getId = function(name, line){
        return '_' + name + '__' + line;
    };
    
    // Open the dialog file and read each line
    $.ajax({
        url: csvUrl,
        method: "GET",
        async: false,
        success: function (result) {
            var lines = result.split('\n');
            for (var i = 1; i < lines.length; ++i) {
                var line = $.csv.toArray(lines[i]);

                if (line.length > 12) {
                    _this.insert(line[0], parseInt(line[1]),
                            line[2], line[3],
                            line[4], line[5], line[6].length === 0 ? null : parseInt(line[6]),
                            line[7].length === 0 ? null : line[7], line[8].length === 0 ? null : parseInt(line[8]),
                            line[9].length === 0 ? null : line[9], line[10].length === 0 ? null : parseInt(line[10]),
                            line[11].length === 0 ? null : line[11], line[12].length === 0 ? null : parseInt(line[12]));
                }
            }
        }
    });
};
ArcDialog.prototype.insert = function (name, lineNumber, character, message, variable, setVariable, nextLine, option1, option1Line, option2, option2Line, option3, option3Line) {
    var id = this.getId(name, lineNumber);
    
    this.data[id] = {
        'NAME' : name,
        'LINE_NUMBER' : lineNumber,
        'CHARACTER' : character, 
        'MESSAGE' : message,
        'VARIABLE' : variable,
        'SET_VARIABLE' : setVariable,
        'NEXT_LINE' : nextLine,
        'OPTION_1' : option1,
        'OPTION_1_LINE' : option1Line,
        'OPTION_2' : option2,
        'OPTION_2_LINE' : option2Line,
        'OPTION_3' : option3,
        'OPTION_3_LINE' : option3Line
    };
};
ArcDialog.prototype.getDialog = function (name, line, successFunction) {
    var data = this.data[this.getId(name, line)];
    
    if(data && data != null){
        successFunction(data);
    }
};

var ArcSQLDialog = ArcBaseObject();
ArcSQLDialog.prototype = Object.create(ArcDialog.prototype);
ArcSQLDialog.prototype.init = function (csvUrl) {
    var _this = this;
    this.db = openDatabase('arc_db', '1.0', 'Databse to store needed ARC information.', 2 * 1024 * 1024);

    // Create the table if needed
    this.db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS DIALOGS (NAME, LINE_NUMBER, CHARACTER, MESSAGE, VARIABLE, SET_VARIABLE, NEXT_LINE, OPTION_1, OPTION_1_LINE, OPTION_2, OPTION_2_LINE, OPTION_3, OPTION_3_LINE, PRIMARY KEY (NAME, LINE_NUMBER))');
    });

    // Open the dialog file and read each line
    $.ajax({
        url: csvUrl,
        method: "GET",
        async: false,
        success: function (result) {
            var lines = result.split('\n');
            for (var i = 1; i < lines.length; ++i) {
                var line = $.csv.toArray(lines[i]);

                if (line.length > 12) {
                    _this.insert(line[0], parseInt(line[1]),
                            line[2], line[3],
                            line[4], line[5], line[6].length === 0 ? null : parseInt(line[6]),
                            line[7].length === 0 ? null : line[7], line[8].length === 0 ? null : parseInt(line[8]),
                            line[9].length === 0 ? null : line[9], line[10].length === 0 ? null : parseInt(line[10]),
                            line[11].length === 0 ? null : line[11], line[12].length === 0 ? null : parseInt(line[12]));
                }
            }
        }
    });
};
ArcSQLDialog.prototype.insert = function (name, lineNumber, character, message, variable, setVariable, nextLine, option1, option1Line, option2, option2Line, option3, option3Line) {
    this.db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM DIALOGS WHERE NAME = ? AND LINE_NUMBER = ?', [name, lineNumber], function (tx2, results) {
            if (results.rows.length > 0) {
                tx2.executeSql('UPDATE DIALOGS SET CHARACTER = ?, MESSAGE = ?, VARIABLE = ?, SET_VARIABLE = ?, NEXT_LINE = ?, OPTION_1 = ?, OPTION_1_LINE = ?, OPTION_2 = ?, OPTION_2_LINE = ?, OPTION_3 = ?, OPTION_3_LINE = ? WHERE NAME = ? AND LINE_NUMBER = ?',
                        [character, message, variable, setVariable, nextLine, option1, option1Line, option2, option2Line, option3, option3Line, name, lineNumber]);
            } else {
                tx2.executeSql('INSERT INTO DIALOGS(NAME, LINE_NUMBER, CHARACTER, MESSAGE, VARIABLE, SET_VARIABLE, NEXT_LINE, OPTION_1, OPTION_1_LINE, OPTION_2, OPTION_2_LINE, OPTION_3, OPTION_3_LINE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [name, lineNumber, character, message, variable, setVariable, nextLine, option1, option1Line, option2, option2Line, option3, option3Line]);
            }
        }, null);
    });
};
ArcSQLDialog.prototype.getDialog = function (name, line, successFunction) {
    this.db.readTransaction(function (tx) {
        if (line && line !== null) {
            tx.executeSql('SELECT * FROM DIALOGS WHERE NAME = ? AND LINE_NUMBER = ?', [name, line], function (tx2, results) {
                if (results.rows.length > 0) {
                    successFunction(results.rows.item(0));
                }
            });
        } else {
            tx.executeSql('SELECT * FROM DIALOGS WHERE NAME = ? ORDER BY LINE_NUMBER', [name], function (tx2, results) {
                if (results.rows.length > 0) {
                    successFunction(results.rows.item(0));
                }
            });
        }
    });
};

function arcGetDialogAdapter(csvUrl){
    var dialog;
    
    if(window.openDatabase){
        dialog = new ArcSQLDialog(csvUrl);
    }else{
        dialog = new ArcDialog(csvUrl);
    }
    
    return dialog;
}