const path = require("path")
const os = require("os")
const fs = require("fs")
const Module = require("module")

const mockPath = path.join(__dirname, "electron-mock.js")
const dbPath = path.join(os.homedir(), ".config", "smk-ttn-app", "smk-ttn.db")
const projectRoot = process.cwd()
fs.writeFileSync(mockPath, `module.exports = { app: { getAppPath: () => ${JSON.stringify(projectRoot)}, getPath: (n) => n === "userData" ? ${JSON.stringify(path.dirname(dbPath))} : "" } }`)

const originalLoad = Module._load
Module._load = function(request, ...args) {
  if (request === "electron") {
    return require(mockPath)
  }
  return originalLoad.call(this, request, ...args)
}
