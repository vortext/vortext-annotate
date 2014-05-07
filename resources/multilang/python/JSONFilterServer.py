import os, logging, optparse, time, signal, sys
import zmq
import json


def str2bool(v):
  return v.lower() in ("yes", "true", "t", "1")

context = zmq.Context()

DEBUG_MODE = str2bool(os.environ.get("DEBUG", "true"))
VERSION = os.environ.get("SPA_VERSION", "<I HAVE NO MASTER>")
LOG_LEVEL = (logging.DEBUG if DEBUG_MODE else logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format='[%(levelname)s] %(name)s %(asctime)s: %(message)s')
log = logging.getLogger(__name__)

def destroy(signum, frame):
    log.warn("received %s shutting down..." % (signum))
    context.destroy(0)
    sys.exit(0)

signal.signal(signal.SIGINT, destroy)
signal.signal(signal.SIGTERM, destroy)

def run_server(socket_addr, handler):
    log.info("Hail to the king %s on %s" % (VERSION, socket_addr))
    socket = context.socket(zmq.REP)
    socket.bind(socket_addr)
    try:
        # Wait for next request from client
        while True:
            try:
                message = json.loads(socket.recv())
                response = handler.run(message)
                socket.send(json.dumps(response, ensure_ascii=False))
            except Exception as e:
                socket.send(json.dumps({"cause": str(e)}))
    except zmq.ZMQError as e:
        log.info("recv failed with: %s" % e)

def main():
    p = optparse.OptionParser(
        description="Runs the filter (subclass of AbstractFilter) from the module as a worker process on the specified socket",
        version="%s" % (VERSION))
    p.add_option('--module', '-m')
    p.add_option('--socket', '-s')
    p.add_option('--path', '-p', default="../../topologies", help="Path where to look for modules")
    options, arguments = p.parse_args()

    sys.path.append(options.path)
    mod = __import__(options.module, fromlist=['Filter'])
    f = getattr(mod, 'Filter')

    handler = f()

    run_server(options.socket, handler)

if __name__ == '__main__':
    main()
