/**Attempts environmental variable retrieval, upon failure it'll throw exception, otherwise it'll return env variable
@param name name of the environmental variable which will be retrieved*/
export default function getEnvVariable(name: string): string | never {
  const envVar = process.env[name];

  if (envVar === undefined) throw new Error(`${name} environmental variable is not defined`);

  return envVar;
}
