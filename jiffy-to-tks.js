var google  = require('googleapis'),
    request = require('request'),
    secure  = require('./secure.json');

// secure.json's format is:
//
// {
//   "CLIENT_ID":      "(OAuth2 parameter from google dev console)",
//   "CLIENT_SECRET":  "(OAuth2 parameter from google dev console)",
//   "REFRESH_TOKEN":  "(OAuth2 parameter you can get from the API explorer, given the above)",
//   "FOLDER_ID":      "(Browse to the drive folder that contains the Jiffy CSV files and copy <id> from https://drive.google.com/drive/#folders/<id>)"
// }

var tks = {};

function Folder(auth, callback){
    this.id = secure.FOLDER_ID;
    this.files = [];
    this.drive = google.drive({ version: 'v2', auth: auth });

    var me = this;

    // RAII
    me.drive.children.list({folderId: me.id}, function(err, res){
        if (err){
            callback && callback(err);
            return;
        }
        me.files = res.items.map(function(f){
            return f.id;
        });
        callback && callback(null, me);
    });

    return this;
}

Folder.prototype.next_file = function(callback){
    var f = this.files.shift();
    if (!f){
        console.error('No more files');
        callback && callback(null, null);
        return null;
    }
    return new File(this.drive, f, callback);
}

function File(drive, file_id, callback){
    this.drive = drive;
    this.id = file_id;
    this.url = undefined;
    this.title = undefined;
    this.trash = undefined;
    this.data = null;

    var me = this;

    // RAII
    me.drive.files.get({fileId: me.id}, function(err, res){
        if (err){
            callback && callback(err);
            return;
        }
        me.trash = !!res.labels.trashed;
        if (me.trash){
            callback && callback(null, null);
        }else{
            me.url = res.downloadUrl;
            me.title = res.title;
            console.error('Downloading "' + me.title + '" (' + me.id + ')');
            me.download(function(err, res, body){
                if (err){
                    callback && callback(err);
                    return;
                }
                me.data = body;
                callback(null, me);
            });
        }
    });

    return this;
}

File.prototype.download = function(callback){
    request.get({
        url: this.url,
        qs: { access_token: this.drive._options.auth.credentials.access_token }
    }, callback);
}

File.prototype.move_to_trash = function(callback){
    var me = this;
    me.drive.files.trash({fileId: me.id}, function(err, res){
        if (err){
            callback && callback(err);
            return;
        }
        me.trash = true;
        console.error('Moved "' + me.title + '" (' + me.id + ') to the trash');
        callback && callback(null, null);
    });
}

function process_next_file(folder){
    folder.next_file(function(err, file){
        if (err){
            console.error(err);
        }else if (file){
            convert_to_tks(file.data, function(err, res){
                if (err){
                    console.error(err);
                }else{
                    if (tks[res.date]){
                        console.error('Warning - overwriting entries for "' + res.date + '"');
                    }
                    tks[res.date] = res.body;
                    file.move_to_trash();
                }
            });
        }
        if (folder.files.length){
            process_next_file(folder);
        }else{
            write_tks();
            console.error('Done');
        }
    });
}

function convert_to_tks(data, callback){
    var lines = data.split(/\n/);
    lines.shift(); // Ignore headings

    var date = undefined,
        body = lines.map(matcher).filter(function(x){ return !!x }).join('\n');

    if (callback){
        if (!date){
            return callback(new Error("Coudln't determine date"));
        }
        return callback(null, {date: date, body: body});
    }

    return {date: date, body: body};


    // Customer,Project,Task,Start time,Stop time,Minutes,Note
    //
    // Look for fields of the following formats:
    //
    // Default style:
    //      "$note - $wr"   Use $wr, and only use $note if the Note field is empty-ish.
    // Override style:
    //      "$wr. $note"    Use $wr and $note unconditionally; overrides the above.
    function matcher(line){
        if (!line){
            return null;
        }
        var parts = line.split(/,/);
        if (!parts || parts.length < 7){
            return null;
        }
        var wr,
            note = parts[6].replace(/"/g, ''),
            duration = (parts[5]/60).toFixed(2);

        // Default style
        arr = line.match(/,"?([^,]+) - (\d\d\d\d\d+)/);
        if (arr){
            wr = arr[2];
            if (!note){
                note = arr[1];
            }
        }
        // Override style
        arr = line.match(/,"?(\d+)\.\s+([^,"]+)/);
        if (arr){
            wr = arr[1];
            note = arr[2];
        }

        if (!wr){
            wr = (parts[0] + ' - ' + parts[1]).replace(/"/g, '');
        }
        if (!date){
            arr = parts[3].match(/(\d\d\d\d-\d\d?-\d\d?)/);
            if (arr){
                date = arr[1];
            }
        }
        return wr + '\t' + duration + '\t' + note;
    }
}

function write_tks(){
    Object.keys(tks).sort().forEach(function(k){
        console.log(k);
        console.log(tks[k]);
        console.log();
    });
}

function main(cfg){
    secure = cfg || secure;

    var auth = new google.auth.OAuth2(secure.CLIENT_ID, secure.CLIENT_SECRET, null);
    auth.setCredentials({
        refresh_token: secure.REFRESH_TOKEN
    });
    auth.refreshAccessToken(function(err, tokens){
        if (err){
            throw err;
        }
        new Folder(auth, function(err, folder){
            if (err){
                throw err;
            }
            process_next_file(folder);
        });
    });
}

module.exports = main;

if (require.main === module){
    main();
}

