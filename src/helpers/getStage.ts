export default (): string => {
  if (!process.env.cfstack) {
    throw Error('Missing required param');
  }

  const [stage] = process.env.cfstack.split('-');

  return stage;
};
