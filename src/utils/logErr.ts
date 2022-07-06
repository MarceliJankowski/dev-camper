/**Formats and logs error to the console*/
export default function logErr(message: string, error: Error | string = ""): void {
  const formatedErr = "\n" + message.toUpperCase() + "\n" + error + "\n";

  console.error(formatedErr);
}
