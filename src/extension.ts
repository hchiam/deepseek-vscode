import * as vscode from "vscode";
import ollama from "ollama";

/** don't forget to run tsc so that /out/extension.js is generated!
 * otherwise your extension might not run when you start the debugger on extension.ts!
 */

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "deepseek-vscode" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "deepseek-vscode.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from deepseek-vscode!");

      const panel = vscode.window.createWebviewPanel(
        "deepseek-vscode",
        "deepseek-vscode chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebViewContent();

      // listen to message:
      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.text;
          let responseText = "";
          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:1.5b", // TODO
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                // respond to UI
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Did you make sure that the Ollama app is running? \n\nError: ${String(
                err
              )}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
  return /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
  body{font-family:sans-serif;margin:1rem;}
  #prompt{width:100%;box-sizing:border-box;}
  #response{border:1px solid #ccc;margin-top:1rem;padding:0.5rem;min-height:3rem;}
  </style>
</head>
<body>
  <h2>deepseek-vscode extension</h2>
  <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
  <div><button id="askBtn">Ask</button></div>
  <div id="response"></div>
  <script>
    const vscode = acquireVsCodeApi();

    // send message:
    document.getElementById('askBtn').addEventListener('click', () => {
      const text = document.getElementById('prompt').value;
      vscode.postMessage({ command: 'chat', text });
    });

    // listen for response:
    window.addEventListener('message', event => {
      const {command,text} = event.data;
      if (command === 'chatResponse') {
        document.getElementById('response').innerText = text;
      }
    });
  </script>
</body>
</html>
  `;
}

export function deactivate() {}
