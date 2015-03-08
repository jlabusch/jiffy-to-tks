# jiffy-to-tks

Downloads Jiffy timesheet CSV files from Google Drive and turns them into Catalyst TKS files.

This script moves processed files into the trash. Note that it will get slower and slower over
time as your trash fills up, because the `drive.children.list` API call includes trashed items,
and we have to make a round trip for each child before we can tell whether it's new or trashed.<br/>
Just empty your trash if it gets too slow.

## Usage

1. Set up secure.json
2. Export daily summaries from the Jiffy mobile app to Google Drive as CSV
3. Do `make run`, which will append the Drive files to `timesheet.txt` in TKS format
4. Tweak `timesheet.txt` as necessary and commit to TKS (e.g. `tks -c timesheet.txt`)

## Configuring Jiffy

This script relies on your Jiffy projects and tasks to follow one of two naming conventions:

* Default style: "Description of work - 123456"
    * In this case the WR number is 123456, and the description of work is only used if your Jiffy "note" field is blank
* Override style: "123456. Description of work"
    * This style is usually used in a Note field to override the Project or Task level WR number. That WR number is stripped from the description.

The script will break if your descriptions contain commas, but if you care enough it would
be possible to handle that properly.

## Secure.json

```
{
  "CLIENT_ID":      "(OAuth2 parameter from google dev console)",
  "CLIENT_SECRET":  "(OAuth2 parameter from google dev console)",
  "REFRESH_TOKEN":  "(OAuth2 parameter you can get from the API explorer)",
  "FOLDER_ID":      "(Drive folder ID, e.g. https://drive.google.com/drive/#folders/<id>)"
}
```

The repository stores an encrypted version of your secure file (`secure.json.pgp`) and `make`
will ensure that the clear text version (`secure.json`) is up to date before running the script.

The clear text version is ignored by `git`, so to save your changes you should run `make secure` to
regenerate the encrypted version before you commit.
