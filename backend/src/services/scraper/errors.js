export class ScrapeError extends Error {
  constructor(message, errorType = 'UNKNOWN_ERROR', httpStatus = null) {
    super(message);
    this.name = 'ScrapeError';
    this.errorType = errorType;
    this.httpStatus = httpStatus;
  }
}

export class NavigationTimeoutError extends ScrapeError {
  constructor(message = 'Page navigation timed out') {
    super(message, 'NAVIGATION_TIMEOUT', 408);
  }
}

export class SelectorNotFoundError extends ScrapeError {
  constructor(selector) {
    super(`Required element not found for selector: ${selector}`, 'SELECTOR_NOT_FOUND', 404);
  }
}

export class AntiBotBlockError extends ScrapeError {
  constructor(message = 'Anti-bot or humanness check failed') {
    super(message, 'ANTI_BOT_BLOCK', 401);
  }
}

export class PriceExtractionError extends ScrapeError {
  constructor(message = 'Failed to extract valid price numeric data') {
    super(message, 'PRICE_EXTRACTION_FAILED', 422);
  }
}
