# first2apply

## Init project
`npx supabase init`

To stop containers
`npx supabase stop`

## Run edge functions with hot reload
`npx supabase functions serve`

## Release

First, update the version in `package.json` and also in the `.appx` manifest.

### MacOS
Forge supports automatically uploading the packaged app to S3, but unfortunatelly the download link is broken because we have whitespaces in the app name. So make sure to edit the generated `REALEASES.json` file with the actual link from S3 and upload it again

Run `npm run package` to test a production build locally first. Don't forget to uncomment the prov ENV vars in the desktop probe.

If everything is ok, then run `npm run publish` to upload a new prod build

### Windows
Updates are handled via the Microsoft store so just build a new AppX and submit it there. The auto-updater only checks the `RELEASES.json` to display a notification that a new version is available

Run `npm run make` to build a new AppX bundle. Upload it manually to the Windows Store.

Add a new version entry to the releases json file from S3.

### Linux
We have to manually upload the `.deb` file to S3 and also manually update the `RELEASES.json` file with the new version.

## Payments (Stripe)