"""
Spawn a frontend server to be used in tests. This file is executed in a fixture in conftest.py, see that.
"""

import os
import posixpath
from urllib.parse import unquote
import http.server

# BaseHTTPServer
# from SimpleHTTPServer import SimpleHTTPRequestHandler

# modify this to add additional routes
STATIC_ROUTES = (
    # [url_prefix]
    "/assets",
    "/static",
)


def normalize_path(path, root):
    # normalize path and prepend root directory
    path = path.split("?", 1)[0]
    path = path.split("#", 1)[0]
    path = posixpath.normpath(unquote(path))
    words = path.split("/")
    words = filter(None, words)

    path = root
    for word in words:
        drive, word = os.path.splitdrive(word)
        head, word = os.path.split(word)
        if word in (os.curdir, os.pardir):
            continue
        path = os.path.join(path, word)
    return path


class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        """translate path given routes"""

        # set default root to cwd
        root = os.getcwd()

        # this is a react SPA app. By default, vend index.html for all routes
        output_path = os.path.join(root, "index.html")

        # or if it was something in /public, which is placed in the same directory as index.html
        # this is a bad solution, an alternative request handler must be implemented or imported
        # sometimes a resource like image.png is requested, which must be returned, other times it's a path, in which index.html should be...
        # this is a poor temporary patch to filter that
        # TODO: FIX THIS
        if "svg" in path or "png" in path or "jpg" in path:
            output_path = normalize_path(path, root)

        # unless the route is listed in STATIC_ROUTES. In that case...
        for pattern in STATIC_ROUTES:
            if path.startswith(pattern):
                # remove the static section from the url
                # and then normalize the path to the real file on disk
                output_path = normalize_path(path, root)
                break

        return output_path


if __name__ == "__main__":
    HOST = "127.0.0.1"
    PORT = 5173
    server = http.server.HTTPServer((HOST, PORT), RequestHandler)
    print("Serving HTTP frontend testing server on %s:%s" % (HOST, PORT))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    print("Exiting on Interrupt")
    server.server_close()
