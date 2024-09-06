class HttpError extends Error {
    constructor(message, errorCode) {
        super(message); // додаємо пропс повідомелння
        this.code = errorCode; // додаємо пропс коду
    }
}

module.exports = HttpError;