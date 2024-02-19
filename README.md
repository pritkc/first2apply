# first2apply

## Init project
`npx supabase init`

To stop containers
`npx supabase stop`

## Run edge functions with hot reload
`npx supabase functions serve`

## Release

### MacOS
Forge supports automatically uploading the packaged app to S3, but unfortunatelly the download link is broken because we have whitespaces in the app name. So make sure to edit the generated `REALEASES.json` file with the actual link from S3 and upload it again

### Windows
Updates are handled via the Microsoft store so just build a new AppX and submit it there.