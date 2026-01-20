def build_response(status: int, type_: str, title: str, message: str, data=None, error=None):
    return {
        "status": status,
        "type": type_,
        "title": title,
        "message": message,
        "data": data,
        "error": error
    }