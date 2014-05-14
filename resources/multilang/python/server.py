import os, logging, optparse, time, signal, sys
from worker import MajorDomoWorker

def str2bool(v):
  return v.lower() in ("yes", "true", "t", "1")

DEBUG_MODE = str2bool(os.environ.get("DEBUG", "true"))
VERSION = os.environ.get("SPA_VERSION", "<I HAVE NO MASTER>")
LOG_LEVEL = (logging.DEBUG if DEBUG_MODE else logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format='[%(levelname)s] %(name)s %(asctime)s: %(message)s')
log = logging.getLogger(__name__)

def destroy(signum, frame):
    log.warn("received %s shutting down..." % (signum))
    sys.exit(0)

signal.signal(signal.SIGINT, destroy)
signal.signal(signal.SIGTERM, destroy)

def run_server(socket_addr, name, handler):
    worker = MajorDomoWorker(socket_addr, name, DEBUG_MODE)
    reply = None
    while True:
        request = worker.recv(reply)
        if request is None:
            break # Worker was interrupted
        reply = handler.run(request[0])

def main():
    p = optparse.OptionParser(
        description="Runs the filter (subclass of abstract_filter) from the module as a worker process on the specified socket",
        version="%s" % (VERSION))
    p.add_option('--module', '-m')
    p.add_option('--socket', '-s')
    p.add_option('--name', '-n', help="Service name")
    p.add_option('--path', '-p', default="../../topologies", help="Path where to look for modules")
    options, arguments = p.parse_args()

    sys.path.append(options.path)
    mod = __import__(options.module, fromlist=['Filter'])
    f = getattr(mod, 'Filter')

    handler = f()

    log.info("Hail to the king %s on %s" % (VERSION, options.socket))
    run_server(options.socket, options.name, handler)

if __name__ == '__main__':
    main()