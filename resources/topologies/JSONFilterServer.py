import os, logging, optparse, time, signal
import zmq

context = zmq.Context()

DEBUG_MODE = True
LOG_LEVEL = (logging.DEBUG if DEBUG_MODE else logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format='[%(levelname)s] %(name)s %(asctime)s: %(message)s')
log = logging.getLogger(__name__)

def destroy(signum, frame):
    log.warn("received %s shutting down..." % (signum))
    # context.destroy depends on pyzmq >= 2.1.10
    context.destroy(0)

signal.signal(signal.SIGINT, destroy)
signal.signal(signal.SIGTERM, destroy)

def run_server(socket_addr):
    log.info("Starting server on %s" % (socket_addr))
    socket = context.socket(zmq.REP)
    socket.bind(socket_addr)
    try:
        # Wait for next request from client
        while True:
            message = socket.recv()
            log.debug("Received request: %s" % (message))
            socket.send("World from %s" % socket_addr)
    except zmq.ZMQError as e:
        log.info("recv failed with: %s" % e)

def main():
    p = optparse.OptionParser(
        description="Runs the file as a worker process on the specified socket",
        version="Spa %s" % (os.environ['SPA_VERSION']))
    p.add_option('--file', '-f')
    p.add_option('--socket', '-s')
    options, arguments = p.parse_args()
    run_server(options.socket)

if __name__ == '__main__':
    main()
