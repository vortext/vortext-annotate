import sys, logging
sys.path.append('gen-py')

from services import Filter

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

DEBUG_MODE = True
LOG_LEVEL = (logging.DEBUG if DEBUG_MODE else logging.INFO)
logging.basicConfig(level=LOG_LEVEL, format='[%(levelname)s] %(name)s %(asctime)s: %(message)s')
log = logging.getLogger(__name__)

class FilterHandler:
    def __init__(self):
        log.info("Started server")

    def ping(self):
        log.info("PONG")


handler = FilterHandler()
processor = Filter.Processor(handler)
transport = TSocket.TServerSocket(port=9090)
tfactory = TTransport.TBufferedTransportFactory()
pfactory = TBinaryProtocol.TBinaryProtocolFactory()

server = TServer.TThreadPoolServer(processor, transport, tfactory, pfactory)

server.serve()
