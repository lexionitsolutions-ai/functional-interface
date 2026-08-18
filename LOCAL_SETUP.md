# Local Desktop Setup

## One-click start

Double-click:

```text
Start Functional Batch Interface.bat
```

The launcher checks Node.js, checks MongoDB on `127.0.0.1:27017`, opens the app in your browser, and starts the backend on port `5000`.

Keep the command window open while using the app. Close it to stop the backend.

## Manual CMD start

From Command Prompt:

```bat
cd /d "C:\Users\Raj\Functional Batch Interface\functional-batch-web\backend"
npm.cmd start
```

Then open:

```text
http://127.0.0.1:5000
```

## MongoDB

The app is configured to use:

```text
mongodb://127.0.0.1:27017/functionalBatchDB
```

If MongoDB is installed as a Windows service but is stopped, start it from an Administrator Command Prompt:

```bat
net start MongoDB
```
