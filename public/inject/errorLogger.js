'use strict';

(() => {
  const ERROR_EVENT_NAME = 'ErrorToExtension';

  const dispatchError = (detail) => {
    document.dispatchEvent(new CustomEvent(ERROR_EVENT_NAME, { detail }));
  };

  const buildStack = () => {
    const stack = new Error().stack;
    if (!stack) return '';
    return stack.split('\n').slice(2, 6).join('\n');
  };

  const parseStackLocation = (stack) => {
    const stackLines = stack.split('\n');
    const match =
      (stackLines.length > 1 &&
        (/^.*?\((.*?):(\d+):(\d+)/.exec(stackLines[1]) ||
          /(\w+:\/\/.*?):(\d+):(\d+)/.exec(stackLines[1]))) ||
      [null, null, null, null];
    return {
      stack: stackLines.join('\n'),
      url: match[1],
      line: match[2],
      col: match[3]
    };
  };

  const safeStringify = (value) => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  };

  const handleCustomError = (message, stack) => {
    const resolvedStack = stack || buildStack();
    const stackInfo = parseStackLocation(resolvedStack);
    dispatchError({
      ...stackInfo,
      text: message
    });
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || event.detail || {};
    const message = reason.message || safeStringify(reason);
    handleCustomError(message, reason.stack);
  });

  const originalConsoleError = window.console.error.bind(window.console);
  window.console.error = (...args) => {
    originalConsoleError(...args);
    const formatted =
      args.length === 1
        ? safeStringify(args[0])
        : safeStringify(args.map((arg) => safeStringify(arg)));
    handleCustomError(formatted);
  };

  window.addEventListener('error', (event) => {
    if (!event.filename) return;
    dispatchError({
      stack: event.error ? event.error.stack : null,
      url: event.filename,
      line: event.lineno,
      col: event.colno,
      text: event.message
    });
  });

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      const src = target?.src || target?.href;
      const baseUrl = target?.baseURI;
      if (src && baseUrl && src !== baseUrl) {
        dispatchError({
          is404: true,
          url: src
        });
      }
    },
    true
  );
})();
