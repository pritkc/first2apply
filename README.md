# First 2 Apply

First 2 Apply (https://first2apply.com/) is an open-source job board aggregator that centralizes listings from platforms like LinkedIn, Indeed, Dice, and more, helping job seekers find opportunities faster.

## Quick Start

The application consists of two main components:
- **Supabase backend** - handles data storage and AI job matching
- **Desktop application** - provides the user interface and job scanning

### Daily Usage

1. **Start the backend services:**
   ```bash
   supabase start
   supabase functions serve
   ```

2. **Start the desktop application:**
   ```bash
   cd desktopProbe
   npm run start
   ```

3. **Access the application:**
   - Desktop app will appear in your menu bar (paper airplane icon)
   - Supabase Studio: http://127.0.0.1:54323
   - API endpoint: http://127.0.0.1:54321

### Features

- **Automated job scanning** from multiple job boards
- **AI-powered job matching** using OpenAI
- **Desktop notifications** for relevant job matches
- **Local data storage** with Supabase
- **Customizable filters** and preferences

## Release

First, update the version in `package.json` and also in the `.appx` manifest.

### MacOS
Forge supports automatically uploading the packaged app to S3, but unfortunately the download link is broken because we have whitespaces in the app name. So make sure to edit the generated `REALEASES.json` file with the actual link from S3 and upload it again

Run `npm run package` to test a production build locally first. Don't forget to uncomment the prov ENV vars in the desktop probe.

If everything is ok, then run `npm run publish` to upload a new prod build

To build the x64 version for Intel macs run `npm run publish -- --arch x64`.

### Windows
Updates are handled via the Microsoft store so just build a new AppX and submit it there. The auto-updater only checks the `RELEASES.json` to display a notification that a new version is available

Run `npm run make` to build a new AppX bundle. Upload it manually to the Windows Store.

Add a new version entry to the releases json file from S3.

### Linux
We have to manually upload the `.deb` file to S3 and also manually update the `RELEASES.json` file with the new version.
