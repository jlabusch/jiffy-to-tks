# jiffy-to-tks
Downloads Jiffy timesheet CSV files from Google Drive and turns them into Catalyst TKS files.

## Usage

1. Set up secure.json
2. Export daily summaries from the Jiffy mobile app to Google Drive
3. Do `make run`, which will append the Drive files to `timesheet.txt` in TKS format
4. Tweak `timesheet.txt` as necessary and commit to TKS (e.g. `tks -c timesheet.txt`)

## Secure.json

```
{
  "CLIENT_ID":      "(OAuth2 parameter from google dev console)",
  "CLIENT_SECRET":  "(OAuth2 parameter from google dev console)",
  "REFRESH_TOKEN":  "(OAuth2 parameter you can get from the API explorer)",
  "FOLDER_ID":      "(Drive folder ID, e.g. https://drive.google.com/drive/#folders/<id>)"
}
```
