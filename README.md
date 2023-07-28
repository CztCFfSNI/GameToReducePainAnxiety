# Introduction 
This codebase contains the main files required for setting up a *local* instance of our game. It consists of a simple front-end webpage to host the game content using our engine + code and submits requests to a backend which records analytics and game state data to a database which can be used with analytics. 

# Getting Started
This project uses TypeScript, HTML, and CSS. All JavaScript code should work in TypeScript. TS just guarantees type safety. Additionally we use NPM as the package manager.

Install NPM: <https://nodejs.org/en/download/>

Install TypeScript via NPM: `npm install -g typescript`

Install Dependencies: `npm install gl-matrix http-server webgl-obj-loader`

Build your changes: `npx tsc`

For using a live server with PHP and MySQL database, you need to:

You can download **xampp**: <https://www.apachefriends.org/download.html>

For Mac, you can also download **MAMP**: <https://www.mamp.info/en/downloads/>

Copy and Paste our source files to the **htdocs** file, then you should be able to use it on <http://localhost:8888/> (depend on your port)

# Developing
I recommend using Chrome or derivatives (Brave, Edge, Opera, etc.) and using the developer tools -- this will help you catch any errors.

Another suggestion is doing `npx tsc --watch` which will automatically recompile your changes to a typescript.

# Contribute

Developers:

Use branches whenever you are going to make **large** changes of code -- > 50-100 lines. Please use pull requests to submit these and make sure it is rebased on the current master/main. 

Small (50 line or less) commits (e.g. bug-fixes) can be directly pushed to master.

When submitting pull requests, choose to merge with squash and rebase as necessary to the latest branch. If you need to rebase your branch onto master, make sure that it works before merging.