# LegalMind

A frontend starting point for a private contract review experience for freelancers, beginning with Egypt.

## Run on your computer

Install [Node.js](https://nodejs.org/) (LTS), then open PowerShell in this project folder and run:

```powershell
npm install
npm run dev
```

Open the local address printed by Next.js (usually `http://localhost:3000`). Stop the server with `Ctrl+C`.

To make a production build:

```powershell
npm run build
npm start
```

## Upload to GitHub

Create an empty repository on GitHub, then in PowerShell from this folder run the commands below. Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` with your GitHub details.

```powershell
git add .
git commit -m "Build LegalMind frontend"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If `origin` is already configured, skip the `git remote add origin ...` line. GitHub may ask you to sign in in the browser.

## Current scope

The interface supports selecting a PDF or Word file and choosing a jurisdiction. It is a frontend prototype: documents are not uploaded or analyzed, and the review action only displays a preview notice. Do not put real confidential contracts into this prototype.
