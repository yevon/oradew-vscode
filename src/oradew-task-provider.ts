
import * as vscode from "vscode";
import { TaskManager } from "./gulp-task-manager";
import { ConfigurationController } from "./configuration-controller";

let settings = ConfigurationController.getInstance();
const { chatty, workspaceConfigFile, databaseConfigFile, cliExecutable, envVariables } = settings;

let taskManager: TaskManager;

export class OradewTaskProvider implements vscode.TaskProvider {
  static OradewType: string = "oradew";
  private oradewPromise: Thenable<vscode.Task[]> | undefined = undefined;

  constructor(context: vscode.ExtensionContext) {
    const workspacePath =
      vscode.workspace.workspaceFolders![0].uri.fsPath || context.extensionPath;
    const contextPath = context.extensionPath;
    const storagePath = context.storagePath || context.extensionPath;

    taskManager = new TaskManager({
      workspacePath,
      contextPath,
      storagePath,
      dbConfigPath: databaseConfigFile,
      wsConfigPath: workspaceConfigFile,
      isSilent: !chatty,
      isColor: true,
      cliExecutable,
      envVariables
    });
  }

  public provideTasks(): Thenable<vscode.Task[]> | undefined {
    if (!this.oradewPromise) {
      this.oradewPromise = getOradewTasks();
    }
    return this.oradewPromise;
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    const name = _task.definition.name;
    const params = _task.definition.params;

    if (name && params) {
      // resolveTask requires that the same definition object be used. !!!!!
      const definition: OradewTaskDefinition = <any>_task.definition;
      return createOradewTask(definition);
    }
    return undefined;
  }
}

export function createCompileOnSaveTask(): vscode.Task {
  let _def: OradewTaskDefinition = createOradewTaskDefinition({
    name: "compileOnSave",
    params: ["compileOnSave", "--env", "${command:oradew.getEnvironment}"]
  });
  let _task = createOradewTask(_def);
  _task.isBackground = true;
  _task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Silent
  };
  return _task;
}

let _channel: vscode.OutputChannel;
function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel("Oradew Auto Detection");
  }
  return _channel;
}

interface OradewTaskDefinition extends vscode.TaskDefinition {
  name: string;
  params: string[];
}

function createOradewTaskDefinition({ name, params }): OradewTaskDefinition {
  return {
    type: OradewTaskProvider.OradewType,
    name,
    params
  };
}

function createOradewTask(definition: OradewTaskDefinition): vscode.Task {
  let _task = new vscode.Task(
    definition,
    vscode.TaskScope.Workspace,
    definition.name,
    "oradew",
    new vscode.ProcessExecution(
      "node",
      [...taskManager.gulpParams, ...definition.params],
      taskManager.processEnv
    ),
    "$oracle-plsql"
  );
  return _task;
}

async function getOradewTasks(): Promise<vscode.Task[]> {
  let result: vscode.Task[] = [];
  let emptyTasks: vscode.Task[] = [];

  try {

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "generator",
        params: [
          "generate",
          "--env",
          "${command:oradew.getEnvironment}",
          "--func",
          "${command:oradew.getGeneratorFunction}",
          "--file",
          "${file}",
          "--object",
          "${selectedText}",
          // ...(generator.output ? ["--output", generator.output] : [])
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask({
        type: OradewTaskProvider.OradewType,
        name: "init",
        params: ["init"]
      })
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "create",
        params: ["create", "--env", "${command:oradew.getEnvironment}"]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "compile",
        params: [
          "compile",
          "--env",
          "${command:oradew.getEnvironment}",
          "--changed",
          "true"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "compile--file",
        params: [
          "compile",
          "--env",
          "${command:oradew.getEnvironment}",
          "--file",
          "${file}",
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "compile--all",
        params: [
          "compile",
          "--env",
          "${command:oradew.getEnvironment}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "compile--object",
        params: [
          "compile",
          "--env",
          "${command:oradew.getEnvironment}",
          "--file",
          "${file}",
          "--object",
          "${selectedText}",
          "--line",
          "${lineNumber}",
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "import",
        params: [
          "import",
          "--env",
          "${command:oradew.getEnvironment}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "import--file",
        params: [
          "import",
          "--env",
          "${command:oradew.getEnvironment}",
          "--file",
          "${file}",
          "--ease",
          "false"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "import--object",
        params: [
          "import",
          "--env",
          "${command:oradew.getEnvironment}",
          "--object",
          "${selectedText}",
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "package",
        params: ["package", "--env", "${command:oradew.getEnvironment}"]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "package--delta",
        params: [
          "package",
          "--env",
          "${command:oradew.getEnvironment}",
          "--delta"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "deploy",
        params: [
          "run",
          "--env",
          "${command:oradew.pickEnvironment}",
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "deploy--file",
        params: [
          "run",
          "--env",
          "${command:oradew.getEnvironment}",
          "--file",
          "${file}",
          "--user",
          "${command:oradew.getUser}"
        ]
      }))
    );

    result.push(
      createOradewTask(createOradewTaskDefinition({
        name: "test",
        params: ["test", "--env", "${command:oradew.getEnvironment}"]
      }))
    );

    return result;

  } catch (err) {
    let channel = getOutputChannel();
    if (err.stderr) {
      channel.appendLine(err.stderr);
    }
    if (err.stdout) {
      channel.appendLine(err.stdout);
    }
    channel.appendLine("Auto detecting oradew tasts failed." + err);
    channel.show(true);
    return emptyTasks;
  }
}