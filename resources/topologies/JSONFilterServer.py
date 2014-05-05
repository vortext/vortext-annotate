import os, logging, optparse

DEBUG_MODE = True
LOG_LEVEL = (logging.DEBUG if DEBUG_MODE else logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format='[%(levelname)s] %(name)s %(asctime)s: %(message)s')
log = logging.getLogger(__name__)

def main():
    p = optparse.OptionParser(description="Runs the file as a worker process on the specified socket",
                              version="Spa %s" % (os.environ['SPA_VERSION']))
    p.add_option('--file', '-f')
    p.add_option('--socket', '-s')
    options, arguments = p.parse_args()
    log.debug('Hello %s' % options.file)

if __name__ == '__main__':
    main()
