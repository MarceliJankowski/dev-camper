/**@desc attempts environmental variable retrieval (raises exception upon failure)*/
export function getEnvVar(name: string): string | never {
  const value = process.env[name];

  if (value === undefined) throw new Error(`'${name}' environmental variable is undefined`);

  return value;
}
