import child = require("child_process");
import path = require("path");

export class TaskManager {
  workspacePath: string;
  contextPath: string;
  storagePath: string;
  dbConfigPath: string;
  wsConfigPath: string;
  gulpPathJs: string;
  gulpFile: string;
  gulpParams: Array<string>;
  processEnv: object;

  constructor(tmConfig: {
    workspacePath: string;
    contextPath: string;
    storagePath: string;
    isSilent: boolean;
    isColor: boolean;
  }) {
    this.workspacePath = tmConfig.workspacePath;
    this.contextPath = tmConfig.contextPath;

    this.dbConfigPath = path.resolve(this.workspacePath, "dbconfig.json");
    this.wsConfigPath = path.resolve(this.workspacePath, "oradewrc.json");
    this.storagePath = tmConfig.storagePath;

    this.gulpPathJs = path.resolve(
      this.contextPath,
      "node_modules/gulp/bin/gulp.js"
    );
    this.gulpFile = path.resolve(this.contextPath, "out/gulpfile.js");

    this.gulpParams = [
      `${this.gulpPathJs}`,
      "--cwd",
      `${this.workspacePath}`,
      "--gulpfile",
      `${this.gulpFile}`,
      // Set only when true, had some problems with false
      ...(tmConfig.isColor ? ["--color", "true"] : []),
      ...(tmConfig.isSilent ? ["--silent", "true"] : [])
    ];

    this.processEnv = {
      env: {
        storagePath: this.storagePath,
        dbConfigPath: this.dbConfigPath,
        wsConfigPath: this.wsConfigPath
      },
      // inherit stdio
      stdio: "inherit"
    };
  }

  executeOradewTask = argv => {
    const params = [...this.gulpParams, ...argv.slice(2)];
    console.log("Executing oradew task: " + params.join(" "));

    // Execute process
    child.spawn(process.execPath, params, this.processEnv);
  }
}
