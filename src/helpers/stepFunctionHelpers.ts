const returnResults = (event: any, data: any, statusCode = 200) => {
  if (
    event.requestContext &&
    event.requestContext.accountId === 'offlineContext_accountId'
  ) {
    return {
      statusCode,
      body: JSON.stringify(data),
    };
  }

  return data;
};

const returnEvent = (event: any) => {
  // If we are running lambda locally, then pull body as event
  if (
    event.requestContext &&
    event.requestContext.accountId === 'offlineContext_accountId' &&
    event.body
  ) {
    const data = JSON.parse(event.body);
    return data;
  }

  return event;
};

export default {
  returnResults,
  returnEvent,
};
